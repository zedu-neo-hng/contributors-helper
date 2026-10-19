// The upload/ingest gate: either a correctly signed-in ADMIN+ session, or the shared
// secret for scripted runs. Role lookups are stubbed; the real gate module runs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2017 },
  }).outputText;
}

const roles = (() => {
  const context = { exports: {}, process, require: name => require(name) };
  vm.runInNewContext(transpile('src/lib/roles.ts'), context);
  return context.exports;
})();

function loadAccess({ session = null, user = null } = {}) {
  const context = {
    exports: {},
    console,
    process,
    require(name) {
      if (name === 'next-auth') return { __esModule: true, getServerSession: async () => session };
      if (name === '@/lib/auth') return { __esModule: true, authOptions: {} };
      if (name === '@/lib/prisma') return { __esModule: true, prisma: { user: { findUnique: async () => user } } };
      if (name === '@/lib/roles') return { __esModule: true, ...roles };
      return require(name);
    },
  };
  vm.runInNewContext(transpile('src/lib/ingestAccess.ts'), context);
  return context.exports;
}

// Values built inside the vm realm fail deepStrictEqual against host literals.
const plain = value => JSON.parse(JSON.stringify(value ?? null));
const request = header => ({ headers: { get: name => (name === 'x-ingest-secret' ? header ?? null : null) } });
const session = id => ({ user: { id, email: `${id}@example.com` } });

async function withSecret(secret, run) {
  const previous = process.env.INGEST_SECRET;
  if (secret === undefined) delete process.env.INGEST_SECRET;
  else process.env.INGEST_SECRET = secret;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.INGEST_SECRET;
    else process.env.INGEST_SECRET = previous;
  }
}

test('currentViewer returns null without a signed-in session', async () => {
  const access = loadAccess({ session: null });
  assert.equal(await access.currentViewer(), null);
});

test('currentViewer reads the stored role and email', async () => {
  const access = loadAccess({ session: session('google-1'), user: { id: 'google-1', email: 'a@example.com', role: 'ADMIN' } });
  assert.deepEqual(plain(await access.currentViewer()), { id: 'google-1', email: 'a@example.com', role: 'ADMIN' });
});

test('currentViewer fails closed for a missing row or an unknown stored role', async () => {
  const missing = loadAccess({ session: session('google-2'), user: null });
  assert.deepEqual(plain(await missing.currentViewer()), { id: 'google-2', email: 'google-2@example.com', role: 'USER' });

  const unknown = loadAccess({ session: session('google-3'), user: { id: 'google-3', email: null, role: 'ROOT' } });
  assert.deepEqual(plain(await unknown.currentViewer()), { id: 'google-3', email: 'google-3@example.com', role: 'USER' });
});

test('a matching shared secret is accepted without a session', async () => {
  const access = loadAccess({ session: null });
  await withSecret('s3cret', async () => {
    assert.deepEqual(plain(await access.hasIngestAccess(request('s3cret'))), { ok: true, via: 'secret', viewer: null });
  });
});

test('a wrong or absent secret falls through to the session', async () => {
  const access = loadAccess({ session: null });
  await withSecret('s3cret', async () => {
    assert.deepEqual(plain(await access.hasIngestAccess(request('wrong'))), { ok: false, viewer: null });
    assert.deepEqual(plain(await access.hasIngestAccess(request())), { ok: false, viewer: null });
  });
});

test('an unset secret is never treated as a match', async () => {
  const access = loadAccess({ session: null });
  await withSecret(undefined, async () => {
    assert.deepEqual(plain(await access.hasIngestAccess(request(''))), { ok: false, viewer: null });
    assert.deepEqual(plain(await access.hasIngestAccess(request('undefined'))), { ok: false, viewer: null });
  });
});

test('admins pass the default gate, ordinary contributors do not', async () => {
  await withSecret('s3cret', async () => {
    const admin = loadAccess({ session: session('admin-1'), user: { id: 'admin-1', email: null, role: 'ADMIN' } });
    const user = loadAccess({ session: session('user-1'), user: { id: 'user-1', email: null, role: 'USER' } });

    const allowed = await admin.hasIngestAccess(request());
    assert.equal(allowed.ok, true);
    assert.equal(allowed.via, 'session');
    assert.equal(allowed.viewer.role, 'ADMIN');

    const denied = await user.hasIngestAccess(request());
    assert.equal(denied.ok, false);
    // The viewer is returned so the route can answer 403 instead of 401.
    assert.equal(denied.viewer.role, 'USER');
  });
});

test('a stricter minimum keeps admins out and lets super admins through', async () => {
  await withSecret('s3cret', async () => {
    const admin = loadAccess({ session: session('admin-2'), user: { id: 'admin-2', email: null, role: 'ADMIN' } });
    const superAdmin = loadAccess({ session: session('super-1'), user: { id: 'super-1', email: null, role: 'SUPER_ADMIN' } });

    assert.equal((await admin.hasIngestAccess(request(), 'SUPER_ADMIN')).ok, false);
    assert.equal((await superAdmin.hasIngestAccess(request(), 'SUPER_ADMIN')).ok, true);
  });
});
