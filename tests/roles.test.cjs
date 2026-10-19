// Role helper checks. Pure logic, no Next.js or database involved.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const context = { exports: {}, process, require: name => require(name) };
  vm.runInNewContext(code, context);
  return context.exports;
}

const roles = load('src/lib/roles.ts');

test('isUserRole accepts only the known roles', () => {
  assert.equal(roles.isUserRole('USER'), true);
  assert.equal(roles.isUserRole('ADMIN'), true);
  assert.equal(roles.isUserRole('SUPER_ADMIN'), true);
  assert.equal(roles.isUserRole('ROOT'), false);
  assert.equal(roles.isUserRole('admin'), false);
  assert.equal(roles.isUserRole(undefined), false);
  assert.equal(roles.isUserRole(2), false);
});

test('roleAtLeast ranks user, admin and super admin', () => {
  assert.equal(roles.roleAtLeast('USER', 'ADMIN'), false);
  assert.equal(roles.roleAtLeast('ADMIN', 'ADMIN'), true);
  assert.equal(roles.roleAtLeast('ADMIN', 'SUPER_ADMIN'), false);
  assert.equal(roles.roleAtLeast('SUPER_ADMIN', 'ADMIN'), true);
  assert.equal(roles.isAdmin('ADMIN'), true);
  assert.equal(roles.isAdmin('USER'), false);
  assert.equal(roles.isSuperAdmin('SUPER_ADMIN'), true);
  assert.equal(roles.isSuperAdmin('ADMIN'), false);
});

test('super admin cannot be assigned from the admin panel', () => {
  assert.deepEqual(Array.from(roles.ASSIGNABLE_ROLES), ['USER', 'ADMIN']);
});

test('superAdminEmails trims, lowercases and drops blanks', () => {
  const emails = roles.superAdminEmails(' A@Example.com , , b@example.com,');
  assert.deepEqual(Array.from(emails).sort(), ['a@example.com', 'b@example.com']);
  assert.equal(roles.superAdminEmails(undefined).size, 0);
  assert.equal(roles.superAdminEmails('').size, 0);
});

test('seededRole promotes only allowlisted emails and leaves others untouched', () => {
  const raw = 'abdulsamad200591133@gmail.com';
  assert.equal(roles.seededRole('abdulsamad200591133@gmail.com', raw), 'SUPER_ADMIN');
  assert.equal(roles.seededRole('AbdulSamad200591133@Gmail.com', raw), 'SUPER_ADMIN');
  assert.equal(roles.seededRole(' someone@example.com ', raw), undefined);
  assert.equal(roles.seededRole(null, raw), undefined);
  assert.equal(roles.seededRole('abdulsamad200591133@gmail.com', ''), undefined);
});
