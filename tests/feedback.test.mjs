import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

async function loadTypeScript(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);
  const source = await (await import('node:fs/promises')).readFile(absolutePath, 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(javascript, { module, exports: module.exports, require, process, Buffer, console });
  return module.exports;
}

test('approval rate handles zero ratings and aggregates positive and negative totals', async () => {
  const { aggregateFeedback } = await loadTypeScript('src/lib/feedback-store.ts');
  const now = new Date('2026-10-18T12:00:00.000Z');
  const empty = aggregateFeedback([], now);
  assert.equal(empty.total, 0);
  assert.equal(empty.approvalRate, 0);
  assert.equal(empty.trend.length, 14);

  const result = aggregateFeedback([
    { responseId: 'a', rating: 'up', comment: '', createdAt: '2026-10-18T09:00:00.000Z', updatedAt: '2026-10-18T09:00:00.000Z' },
    { responseId: 'b', rating: 'up', comment: '', createdAt: '2026-10-17T09:00:00.000Z', updatedAt: '2026-10-17T09:00:00.000Z' },
    { responseId: 'c', rating: 'down', comment: 'Needs more detail.', createdAt: '2026-10-18T10:00:00.000Z', updatedAt: '2026-10-18T10:00:00.000Z' },
  ], now);
  assert.equal(result.positive, 2);
  assert.equal(result.negative, 1);
  assert.equal(result.total, 3);
  assert.equal(result.approvalRate, 67);
  assert.equal(result.recentFeedback.length, 3);
  assert.equal(result.recentFeedback[0].responseId, 'c');
  assert.equal(result.trend.at(-1).up, 1);
  assert.equal(result.trend.at(-1).down, 1);
  assert.equal(result.recentComments[0].comment, 'Needs more detail.');
});

test('feedback is persisted and a response rating is updated instead of duplicated', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'contributors-feedback-'));
  const previous = process.env.FEEDBACK_DATA_FILE;
  process.env.FEEDBACK_DATA_FILE = path.join(directory, 'feedback.json');
  try {
    const store = await loadTypeScript('src/lib/feedback-store.ts');
    await store.saveFeedback({ responseId: 'response-1', rating: 'down', comment: '' });
    await store.saveFeedback({ responseId: 'response-1', rating: 'down', comment: 'Missing context.' });
    const records = await store.readFeedback();
    assert.equal(records.length, 1);
    assert.equal(records[0].rating, 'down');
    assert.equal(records[0].comment, 'Missing context.');
    assert.ok(records[0].createdAt);
    assert.ok(records[0].updatedAt);
  } finally {
    if (previous === undefined) delete process.env.FEEDBACK_DATA_FILE;
    else process.env.FEEDBACK_DATA_FILE = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test('admin analytics requires a valid signed and unexpired admin session', async () => {
  process.env.ADMIN_USERNAME = 'test-admin';
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret-that-is-at-least-32-characters';
  process.env.ADMIN_ROLE = 'lead';
  const auth = await loadTypeScript('src/lib/admin-auth.ts');
  assert.equal(auth.verifyAdminCredentials('test-admin', 'test-password'), true);
  assert.equal(auth.verifyAdminCredentials('test-admin', 'wrong-password'), false);
  assert.equal(auth.verifyAdminSession(undefined), false);
  const session = auth.createAdminSession();
  assert.equal(auth.verifyAdminSession(session.token), true);
  assert.equal(auth.verifyAdminSession(`${session.token}tampered`), false);
});
