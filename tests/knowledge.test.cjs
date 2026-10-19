// Integration and unit checks for the knowledge base loader (issue #36). The module is loaded
// through the TypeScript transpiler, matching messagePlainText.test.cjs, because this repository has
// no TypeScript test runner. Run with `node --test tests/`.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/lib/knowledge.ts', 'utf8');

function transpile(target) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target },
  }).outputText;
}

// Matches tsconfig.json so the loaded module behaves as it does in a real build.
const compiled = transpile(ts.ScriptTarget.ES2017);

// Loads a fresh instance of the module so KNOWLEDGE_DIR can be pointed at a fixture directory.
function loadModule(knowledgeDir, code = compiled) {
  const previous = process.env.KNOWLEDGE_DIR;
  if (knowledgeDir === undefined) delete process.env.KNOWLEDGE_DIR;
  else process.env.KNOWLEDGE_DIR = knowledgeDir;
  try {
    const context = { exports: {}, require, process, console };
    vm.runInNewContext(code, context);
    return context.exports;
  } finally {
    if (previous === undefined) delete process.env.KNOWLEDGE_DIR;
    else process.env.KNOWLEDGE_DIR = previous;
  }
}

// Mirrors the shape loadKnowledgeBase builds, so selection can be tested without the real corpus.
function indexEntry(knowledge, base, body) {
  const titleTokens = new Set(knowledge.tokenize(base));
  return {
    base,
    titleTokens,
    tokens: new Set([...titleTokens, ...knowledge.tokenize(body)]),
  };
}

test('tokenize keeps lesson numbers and drops function words', () => {
  const knowledge = loadModule();
  const tokens = knowledge.tokenize('What did they say in Lesson 5 about the marketing dashboard?');

  assert.ok(tokens.includes('5'), 'single-digit lesson numbers must survive');
  assert.ok(tokens.includes('lesson'));
  assert.ok(tokens.includes('marketing'));
  assert.ok(tokens.includes('dashboard'));
  assert.ok(!tokens.includes('the'));
  assert.ok(!tokens.includes('did'));
  assert.ok(tokens.includes('say'), 'plain three-letter words are not stopped');
});

test('selectSessions picks the one call a specific question refers to', () => {
  const knowledge = loadModule();
  const index = [
    indexEntry(knowledge, '2026-10-05_lesson_4_week_2_mobile_desktop_setup_ticketing_taste', 'mobile and desktop setup'),
    indexEntry(knowledge, '2026-10-16_call_9_deadlines_auth_sales_issues_tracker', 'sales auth and email deliverability'),
  ];

  assert.deepEqual(
    Array.from(knowledge.selectSessions('how do we avoid cold email bounces and check deliverability', index)),
    ['2026-10-16_call_9_deadlines_auth_sales_issues_tracker'],
  );
});

test('selectSessions attaches nothing when no call clearly matches', () => {
  const knowledge = loadModule();
  const index = [
    indexEntry(knowledge, '2026-10-01_session_alpha', 'marketing dashboard tracking'),
    indexEntry(knowledge, '2026-10-02_session_beta', 'marketing dashboard tracking'),
  ];

  assert.deepEqual(Array.from(knowledge.selectSessions('tell me about the marketing dashboard', index)), []);
  assert.deepEqual(Array.from(knowledge.selectSessions('', index)), []);
  assert.deepEqual(Array.from(knowledge.selectSessions('hello there', index)), []);
});

test('loadKnowledgeBase reads every summary and finds a transcript for each session', async () => {
  const knowledge = loadModule();
  const knowledgeBase = await knowledge.loadKnowledgeBase();

  const summaryFiles = fs
    .readdirSync('clean-transcripts/summaries')
    .filter((name) => name.endsWith('.summary.md'));

  assert.ok(summaryFiles.length >= 8, `expected the compacted summaries, found ${summaryFiles.length}`);
  assert.equal(knowledgeBase.index.length, summaryFiles.length);
  assert.ok(knowledgeBase.summaries.includes('## People & Roles'));
  assert.ok(knowledgeBase.summaries.includes('## Deadlines & Dates'));

  for (const session of knowledgeBase.index) {
    assert.ok(
      fs.existsSync(path.join('clean-transcripts/transcripts', `${session.base}.cleaned.md`)),
      `missing cleaned transcript for ${session.base}`,
    );
  }
});

test('buildKnowledgeContext always injects summaries and attaches a transcript on demand', async () => {
  const knowledge = loadModule();

  const vague = await knowledge.buildKnowledgeContext('hello');
  assert.ok(vague.includes('COHORT CALL KNOWLEDGE'));
  assert.ok(!vague.includes('CALL TRANSCRIPT'), 'a vague question must not attach a whole transcript');

  const pointed = await knowledge.buildKnowledgeContext('what did they say about email deliverability');
  assert.ok(pointed.includes('COHORT CALL KNOWLEDGE'));
  assert.ok(pointed.includes('CALL TRANSCRIPT'));
  assert.ok(pointed.includes('2026-10-16_call_9'));
});

test('loadKnowledgeBase fails loudly when the knowledge directory is missing', async () => {
  const missing = path.join(os.tmpdir(), 'neo-036-knowledge-missing');
  const knowledge = loadModule(missing);

  await assert.rejects(
    () => knowledge.loadKnowledgeBase(),
    (error) => {
      assert.equal(error.name, 'KnowledgeBaseError');
      assert.match(error.message, /neo-036-knowledge-missing/);
      return true;
    },
  );
});

test('loadKnowledgeBase fails loudly when the summaries directory is empty', async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-036-knowledge-empty-'));
  fs.mkdirSync(path.join(empty, 'summaries'));
  const knowledge = loadModule(empty);

  await assert.rejects(
    () => knowledge.loadKnowledgeBase(),
    (error) => {
      assert.equal(error.name, 'KnowledgeBaseError');
      return true;
    },
  );
});

test('readTranscript fails loudly for a session with no cleaned transcript', async () => {
  const knowledge = loadModule();

  await assert.rejects(
    () => knowledge.readTranscript('2099-01-01_nonexistent_session'),
    (error) => {
      assert.equal(error.name, 'KnowledgeBaseError');
      return true;
    },
  );
});

test('isKnowledgeBaseError survives a downlevelled build, unlike a bare instanceof', async () => {
  // tsconfig targets es2017, but a downlevelled bundle breaks `instanceof` for Error subclasses.
  // Without the guard a missing knowledge base would surface as a generic 500 instead of a clear 503.
  const knowledge = loadModule(path.join(os.tmpdir(), 'neo-036-guard'), transpile(ts.ScriptTarget.ES5));

  await assert.rejects(
    () => knowledge.loadKnowledgeBase(),
    (error) => {
      assert.ok(
        knowledge.isKnowledgeBaseError(error),
        'the guard must recognise the error regardless of the compile target',
      );
      return true;
    },
  );
});
