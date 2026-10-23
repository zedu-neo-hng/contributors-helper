// Admin-only routes: who may look at the contributor list, and who may change a role.
// The database and session are stubbed; the real role rules run.
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

function run(file, { viewer = null, users = [] } = {}) {
  const log = { updates: [], findMany: 0 };
  const prisma = {
    user: {
      findMany: async (args) => {
        log.findMany += 1;
        log.findManyArgs = JSON.parse(JSON.stringify(args ?? {}));
        return users;
      },
      findUnique: async ({ where }) => users.find((user) => user.id === where.id) ?? null,
      update: async (args) => {
        log.updates.push(JSON.parse(JSON.stringify(args)));
        const target = users.find((user) => user.id === args.where.id);
        return { id: args.where.id, email: target?.email ?? null, role: args.data.role, createdAt: new Date('2026-10-19T12:00:00Z') };
      },
    },
  };

  const context = {
    exports: {},
    console,
    process,
    require(name) {
      if (name === 'next/server') {
        return {
          __esModule: true,
          NextResponse: {
            json: (body, init) => ({ body: JSON.parse(JSON.stringify(body ?? null)), status: init?.status ?? 200 }),
          },
        };
      }
      if (name === '@/lib/ingestAccess') return { __esModule: true, currentViewer: async () => viewer };
      if (name === '@/lib/prisma') return { __esModule: true, prisma };
      if (name === '@/lib/roles') return { __esModule: true, ...roles };
      return require(name);
    },
  };

  vm.runInNewContext(transpile(file), context);
  return { route: context.exports, log };
}

const post = payload => ({ json: async () => payload });

test('the role endpoint requires a session', async () => {
  const { route } = run('src/app/api/admin/me/route.ts', { viewer: null });
  assert.equal((await route.GET()).status, 401);
});

test('the role endpoint reports the stored role', async () => {
  const { route } = run('src/app/api/admin/me/route.ts', { viewer: { id: 'u1', email: 'a@example.com', role: 'ADMIN' } });
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { role: 'ADMIN', email: 'a@example.com' });
});

const USERS = [
  { id: 'super-1', email: 'owner@example.com', role: 'SUPER_ADMIN', createdAt: new Date('2026-10-01T00:00:00Z') },
  { id: 'user-1', email: 'someone@example.com', role: 'USER', createdAt: new Date('2026-10-02T00:00:00Z') },
];

test('the contributor list is invisible without a super admin session', async () => {
  const anonymous = run('src/app/api/admin/users/route.ts', { viewer: null, users: USERS });
  const admin = run('src/app/api/admin/users/route.ts', { viewer: { id: 'admin-1', email: null, role: 'ADMIN' }, users: USERS });

  assert.equal((await anonymous.route.GET()).status, 401);
  assert.equal((await admin.route.GET()).status, 403);
  assert.equal(anonymous.log.findMany, 0, 'a rejected caller must not reach the database');
  assert.equal(admin.log.findMany, 0);
});

test('a super admin sees every contributor', async () => {
  const { route, log } = run('src/app/api/admin/users/route.ts', { viewer: { id: 'super-1', email: null, role: 'SUPER_ADMIN' }, users: USERS });
  const response = await route.GET();

  assert.equal(response.status, 200);
  assert.equal(response.body.users.length, 2);
  assert.deepEqual(response.body.users.map((user) => user.role), ['SUPER_ADMIN', 'USER']);
  assert.equal(log.findMany, 1);
});

test('only a super admin can promote, and only to USER or ADMIN', async () => {
  const admin = run('src/app/api/admin/users/route.ts', { viewer: { id: 'admin-1', email: null, role: 'ADMIN' }, users: USERS });
  assert.equal((await admin.route.POST(post({ id: 'user-1', role: 'ADMIN' }))).status, 403);
  assert.equal(admin.log.updates.length, 0);

  const superAdmin = run('src/app/api/admin/users/route.ts', { viewer: { id: 'super-1', email: null, role: 'SUPER_ADMIN' }, users: USERS });
  assert.equal((await superAdmin.route.POST(post({ role: 'ADMIN' }))).status, 400, 'a user id is required');
  assert.equal((await superAdmin.route.POST(post({ id: 'user-1' }))).status, 400, 'a role is required');
  assert.equal((await superAdmin.route.POST(post({ id: 'user-1', role: 'ROOT' }))).status, 400);
  assert.equal((await superAdmin.route.POST(post({ id: 'user-1', role: 'SUPER_ADMIN' }))).status, 400, 'super admin is seeded, never assigned');
  assert.equal(superAdmin.log.updates.length, 0);
});

test('a super admin promotes a contributor and the update is scoped', async () => {
  const { route, log } = run('src/app/api/admin/users/route.ts', { viewer: { id: 'super-1', email: null, role: 'SUPER_ADMIN' }, users: USERS });
  const response = await route.POST(post({ id: 'user-1', role: 'ADMIN' }));

  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, 'ADMIN');
  assert.equal(response.body.user.id, 'user-1');
  assert.deepEqual(log.updates, [{
    where: { id: 'user-1' },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, role: true, createdAt: true },
  }]);
});

test('contributors can be demoted, super admins cannot', async () => {
  const demote = run('src/app/api/admin/users/route.ts', { viewer: { id: 'super-1', email: null, role: 'SUPER_ADMIN' }, users: [{ id: 'admin-1', email: 'a@example.com', role: 'ADMIN' }] });
  const demoted = await demote.route.POST(post({ id: 'admin-1', role: 'USER' }));
  assert.equal(demoted.status, 200);
  assert.equal(demoted.body.user.role, 'USER');

  const guard = run('src/app/api/admin/users/route.ts', { viewer: { id: 'other-super', email: null, role: 'SUPER_ADMIN' }, users: USERS });
  const refused = await guard.route.POST(post({ id: 'super-1', role: 'USER' }));
  assert.equal(refused.status, 403);
  assert.equal(guard.log.updates.length, 0);
});

test('an unknown contributor cannot be updated', async () => {
  const { route, log } = run('src/app/api/admin/users/route.ts', { viewer: { id: 'super-1', email: null, role: 'SUPER_ADMIN' }, users: USERS });
  assert.equal((await route.POST(post({ id: 'nobody', role: 'ADMIN' }))).status, 404);
  assert.equal(log.updates.length, 0);
});
