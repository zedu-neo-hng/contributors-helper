// The upload/ingest gate: a signed-in ADMIN+ session is the only way in. Role lookups are
// stubbed; the real gate module runs.
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
const session = id => ({ user: { id, email: `${id}@example.com` } });

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

test('admins pass the default gate, ordinary contributors do not', async () => {
  const admin = loadAccess({ session: session('admin-1'), user: { id: 'admin-1', email: null, role: 'ADMIN' } });
  const user = loadAccess({ session: session('user-1'), user: { id: 'user-1', email: null, role: 'USER' } });

  const allowed = await admin.hasIngestAccess();
  assert.equal(allowed.ok, true);
  assert.equal(allowed.viewer.role, 'ADMIN');

  const denied = await user.hasIngestAccess();
  assert.equal(denied.ok, false);
  // The viewer is returned so the route can answer 403 instead of 401.
  assert.equal(denied.viewer.role, 'USER');
});

test('an anonymous request is refused with no viewer so the route answers 401', async () => {
  const access = loadAccess({ session: null });

  const denied = await access.hasIngestAccess();

  assert.equal(denied.ok, false);
  assert.equal(denied.viewer, null);
});

test('a stricter minimum keeps admins out and lets super admins through', async () => {
  const admin = loadAccess({ session: session('admin-2'), user: { id: 'admin-2', email: null, role: 'ADMIN' } });
  const superAdmin = loadAccess({ session: session('super-1'), user: { id: 'super-1', email: null, role: 'SUPER_ADMIN' } });

  assert.equal((await admin.hasIngestAccess('SUPER_ADMIN')).ok, false);
  assert.equal((await superAdmin.hasIngestAccess('SUPER_ADMIN')).ok, true);
});

// Regression guard: a shared secret used to be a second way in. It must stay gone, so the
// session is the only path and there is nothing extra to rotate or leak.
test('the gate has no shared-secret path', () => {
  const source = fs.readFileSync('src/lib/ingestAccess.ts', 'utf8');

  assert.ok(!source.includes('INGEST_SECRET'), 'an INGEST_SECRET fallback would be a second way in');
  assert.ok(!source.includes('x-ingest-secret'), 'the secret header must not be accepted');
});
