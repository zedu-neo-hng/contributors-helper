// The health probe must reflect database reachability, so a broken DATABASE_URL cannot look
// like a healthy deployment. Prisma is stubbed; the real route runs.
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

// Values built inside the vm realm fail deepStrictEqual against host literals.
const plain = value => JSON.parse(JSON.stringify(value ?? null));

function loadHealth(query) {
  const context = {
    exports: {},
    console: { error() {}, log() {}, warn() {} },
    process,
    require(name) {
      if (name === 'next/server') {
        return {
          __esModule: true,
          NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) },
        };
      }
      if (name === '@/lib/prisma') return { __esModule: true, prisma: { $queryRaw: query } };
      return require(name);
    },
  };
  vm.runInNewContext(transpile('src/app/api/health/route.ts'), context);
  return context.exports;
}

test('health queries the database and reports ok when it answers', async () => {
  let calls = 0;
  const { GET } = loadHealth(async () => {
    calls += 1;
    return [{ '?column?': 1 }];
  });

  const response = await GET();

  assert.equal(calls, 1, 'the probe must actually touch the database');
  assert.equal(response.status, 200);
  assert.deepEqual(plain(response.body), { status: 'ok', database: 'ok' });
});

test('health reports 503 when the database is unreachable', async () => {
  const { GET } = loadHealth(async () => {
    throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
  });

  const response = await GET();

  assert.equal(response.status, 503);
  assert.deepEqual(plain(response.body), { status: 'unavailable', database: 'unavailable' });
  assert.ok(!JSON.stringify(response.body).includes('ECONNREFUSED'), 'the connection error must not leak to callers');
});
