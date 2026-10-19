// Route-level checks for the DB-backed upload/ingest pipeline and the chunked summariser. Routes
// are transpiled and run with the database, AI client and PDF parser stubbed, but the real cleaner
// and summariser run. Run with `node --test tests/*.test.cjs`.
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

// Loads a library module in its own realm with the given require stubs.
function loadModule(file, stubs = {}) {
  const context = {
    exports: {},
    console,
    process,
    require(name) {
      if (stubs[name]) return stubs[name];
      return require(name);
    },
  };
  vm.runInNewContext(transpile(file), context);
  return context.exports;
}

const summarize = loadModule('src/lib/summarize.ts');
const cleaner = loadModule('src/lib/cleanText.ts');

const SECTIONED_SUMMARY = [
  '## Meeting Summary', 'The team reviewed the week.', '',
  '## Key Decisions', 'Deadlines move to Sunday.', '',
  '## Action Items', 'Everyone submits the form.',
].join('\n');

// Mirrors the parts of Prisma's `where` the ingest route relies on, so tests can assert on
// which document a request picked.
function matchesWhere(doc, where = {}) {
  if (where.status && doc.status !== where.status) return false;
  if (typeof where.id === 'string' && doc.id !== where.id) return false;
  if (where.id && typeof where.id === 'object' && Array.isArray(where.id.notIn) && where.id.notIn.includes(doc.id)) return false;
  return true;
}

function prismaStub({ stagedDocs = [] } = {}) {
  const log = { creates: [], upserts: [], updates: [], transactions: 0, knowledgeResets: 0 };
  const prisma = {
    stagedDocument: {
      create: async args => {
        log.creates.push(JSON.parse(JSON.stringify({ ...args, data: { ...args.data, data: `<${args.data.data.length} bytes>` } })));
        return { id: 'staged-1', ...args.data, uploadedAt: new Date('2026-10-19T12:00:00Z'), status: 'STAGED' };
      },
      findMany: async (args = {}) => stagedDocs
        .filter(doc => matchesWhere(doc, args.where))
        .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
        .slice(0, args.take ?? stagedDocs.length),
      count: async (args = {}) => stagedDocs.filter(doc => matchesWhere(doc, args.where)).length,
      update: async args => {
        log.updates.push(JSON.parse(JSON.stringify(args)));
        const doc = stagedDocs.find(candidate => candidate.id === args.where.id);
        if (doc && args.data && args.data.status) doc.status = args.data.status;
        return {};
      },
    },
    ingestedDocument: {
      upsert: async args => {
        log.upserts.push(JSON.parse(JSON.stringify(args)));
        return {};
      },
    },
    $transaction: async ops => {
      log.transactions += 1;
      await Promise.all(ops);
      return ops;
    },
  };
  return { prisma, log };
}

class OpenAIMock {
  constructor(reply) {
    const payloads = [];
    this.payloads = payloads;
    this.chat = {
      completions: {
        create: async payload => {
          payloads.push(payload);
          return { choices: [{ message: { content: reply } }] };
        },
      },
    };
  }
}

function makeContext({ prisma, openai, secret, log, access }) {
  return {
    exports: {},
    console: { error: (...args) => console.error('[route]', ...args), log() {}, warn() {} },
    process,
    File,
    TextDecoder,
    Buffer,
    require(name) {
      if (name === 'next/server') {
        return {
          __esModule: true,
          // JSON round-trip: bodies are built in the vm realm and fail deepStrictEqual against host literals.
          NextResponse: {
            json: (body, init) => ({
              body: JSON.parse(JSON.stringify(body ?? null)),
              status: init?.status ?? 200,
            }),
          },
        };
      }
      if (name === '@/lib/ingestAccess') {
        // The gate itself is covered by tests/ingestAccess.test.cjs; here it stands in for
        // the session lookup so these tests stay focused on upload/ingest behaviour.
        return {
          __esModule: true,
          hasIngestAccess:
            access ??
            (async (req) => {
              const configured = process.env.INGEST_SECRET;
              if (configured && req.headers.get('x-ingest-secret') === configured) {
                return { ok: true, via: 'secret', viewer: null };
              }
              return { ok: false, viewer: null };
            }),
        };
      }
      if (name === '@/lib/prisma') return { __esModule: true, prisma };
      if (name === 'openai') return { __esModule: true, default: function () { return openai; } };
      if (name === 'unpdf') {
        return { __esModule: true, extractText: async () => ({ text: '' }), getDocumentProxy: async () => ({}) };
      }
      if (name === '@/lib/cleanText') return { __esModule: true, cleanTranscriptText: cleaner.cleanTranscriptText };
      if (name === '@/lib/summarize') return { __esModule: summarize, ...summarize };
      if (name === '@/lib/knowledge') {
        return {
          __esModule: true,
          resetKnowledgeCache: () => {
            log.knowledgeResets += 1;
          },
        };
      }
      return require(name);
    },
  };
}

function runRoute(routeFile, context) {
  vm.runInNewContext(transpile(routeFile), context);
  return context.exports;
}

function uploadRequest({ file, uploaderId, secretHeader, contentLength }) {
  return {
    headers: { get: name => (name === 'x-ingest-secret' ? secretHeader : name === 'content-length' ? contentLength : null) },
    formData: async () => ({
      get: name => (name === 'file' ? file : uploaderId === undefined ? null : uploaderId),
    }),
  };
}

test('upload rejects anonymous callers whether or not a secret is configured', async () => {
  const { prisma } = prismaStub();
  const context = makeContext({ prisma, openai: new OpenAIMock(''), secret: 's3cret' });
  const { POST } = runRoute('src/app/api/upload/route.ts', context);

  const previous = process.env.INGEST_SECRET;
  delete process.env.INGEST_SECRET;
  const unconfigured = await POST(uploadRequest({ file: null }));
  process.env.INGEST_SECRET = 's3cret';

  const unauthorized = await POST(uploadRequest({ file: null, secretHeader: 'wrong' }));

  try {
    assert.equal(unconfigured.status, 401);
    assert.equal(unauthorized.status, 401);
  } finally {
    if (previous === undefined) delete process.env.INGEST_SECRET;
    else process.env.INGEST_SECRET = previous;
  }
});

test('a signed-in contributor without admin rights is forbidden, not unauthorized', async () => {
  const { prisma } = prismaStub();
  const access = async () => ({ ok: false, viewer: { id: 'google-9', email: null, role: 'USER' } });
  const context = makeContext({ prisma, openai: new OpenAIMock(''), access });
  const { POST } = runRoute('src/app/api/upload/route.ts', context);

  const forbidden = await POST(uploadRequest({ file: null }));

  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.body.error, 'Admin access required.');
});

test('an admin session stages the upload under the signed-in id', async () => {
  const { prisma, log } = prismaStub();
  const access = async () => ({ ok: true, via: 'session', viewer: { id: 'google-1', email: null, role: 'ADMIN' } });
  const context = makeContext({ prisma, openai: new OpenAIMock(''), access });
  const { POST } = runRoute('src/app/api/upload/route.ts', context);

  const bytes = new TextEncoder().encode('transcript text');
  const staged = await POST(uploadRequest({ file: new File([bytes], '2026-10-19_call_10.md') }));

  assert.equal(staged.status, 200);
  assert.equal(staged.body.uploaderId, 'google-1');
  assert.equal(log.creates[0].data.uploaderId, 'google-1');
});

test('upload validates and stages the file bytes in the database', async () => {
  const { prisma, log } = prismaStub();
  const context = makeContext({ prisma, openai: new OpenAIMock(''), secret: 's3cret' });
  const { POST } = runRoute('src/app/api/upload/route.ts', context);

  const previous = process.env.INGEST_SECRET;
  process.env.INGEST_SECRET = 's3cret';
  try {
    const bytes = new TextEncoder().encode('verbatim transcript text');
    const good = new File([bytes], '2026-10-19_call_10.txt');

    const staged = await POST(uploadRequest({ file: good, uploaderId: 'tri', secretHeader: 's3cret', contentLength: String(bytes.length) }));
    const badExt = await POST(uploadRequest({ file: new File([bytes], 'thing.exe'), secretHeader: 's3cret' }));
    const fakePdf = await POST(uploadRequest({ file: new File([bytes], 'thing.pdf'), secretHeader: 's3cret' }));

    assert.equal(staged.status, 200);
    assert.equal(staged.body.originalName, '2026-10-19_call_10.txt');
    assert.equal(staged.body.status, 'STAGED');
    assert.equal(staged.body.uploadedAt, '2026-10-19T12:00:00.000Z');
    assert.equal(log.creates.length, 1);
    assert.equal(log.creates[0].data.ext, '.txt');
    assert.equal(log.creates[0].data.uploaderId, 'tri');
    assert.equal(log.creates[0].data.data, '<24 bytes>');
    assert.equal(badExt.status, 400);
    assert.equal(fakePdf.status, 400);
  } finally {
    if (previous === undefined) delete process.env.INGEST_SECRET;
    else process.env.INGEST_SECRET = previous;
  }
});

function ingestHarness({ stagedDocs = [], reply = SECTIONED_SUMMARY } = {}) {
  const { prisma, log } = prismaStub({ stagedDocs });
  const openai = new OpenAIMock(reply);
  const context = makeContext({ prisma, openai, secret: 's3cret', log });
  const { POST } = runRoute('src/app/api/ingest/route.ts', context);

  const previousSecret = process.env.INGEST_SECRET;
  const previousKey = process.env.AI_API_KEY;
  process.env.INGEST_SECRET = 's3cret';
  process.env.AI_API_KEY = 'test-key';

  return {
    log,
    openai,
    post: body => POST({ headers: { get: () => 's3cret' }, json: async () => body }),
    restore: () => {
      if (previousSecret === undefined) delete process.env.INGEST_SECRET;
      else process.env.INGEST_SECRET = previousSecret;
      if (previousKey === undefined) delete process.env.AI_API_KEY;
      else process.env.AI_API_KEY = previousKey;
    },
  };
}

const noisyTranscript = '00:00:04.480 >> um we are going to review the the week\n\nDeadlines move to Sunday.';

test('ingest cleans, summarises and stores the full document', async () => {
  const h = ingestHarness({
    stagedDocs: [{ id: 'doc-1', ext: '.txt', filename: '2026-10-19_call_10.txt', status: 'STAGED', data: new TextEncoder().encode(noisyTranscript), uploadedAt: new Date('2026-10-19T12:00:00Z') }],
  });

  try {
    const response = await h.post();

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { processed: ['doc-1'], failed: [], remaining: 0 });

    const payload = h.openai.payloads[0];
    assert.equal(payload.model, 'deepseek/deepseek-v4-flash-0731', 'the floor routing must stay gone');
    assert.ok(payload.messages[0].content.includes('Extract only'), 'summaries must be extract-only');
    assert.ok(payload.messages[0].content.includes('People & Roles'), 'the neo-008 section format must be requested');
    assert.equal(payload.messages[1].content, 'we are going to review the week\n\nDeadlines move to Sunday.');

    assert.equal(h.log.upserts.length, 1);
    assert.equal(h.log.upserts[0].where.sourceId, 'doc-1');
    assert.equal(h.log.upserts[0].create.title, '2026-10-19_call_10');
    assert.ok(h.log.upserts[0].create.summary.includes('## Key Decisions'));
    assert.ok(h.log.upserts[0].create.cleaned.includes('we are going to review the week'));
    assert.deepEqual(h.log.upserts[0].update, { title: '2026-10-19_call_10', summary: h.log.upserts[0].create.summary, cleaned: h.log.upserts[0].create.cleaned });

    assert.equal(h.log.updates.length, 1);
    assert.deepEqual(h.log.updates[0], { where: { id: 'doc-1' }, data: { status: 'INGESTED' } });
    assert.equal(h.log.transactions, 1);
    assert.equal(h.log.knowledgeResets, 1, 'the chat knowledge cache must refresh after new documents');
  } finally {
    h.restore();
  }
});

test('ingest chunks long documents so nothing is truncated', async () => {
  // Varied wording: the duplicated-word removal in the cleaner must not shrink this text.
  const paragraphs = Array.from({ length: 30 }, (_, i) => `Paragraph ${i} ${Array.from({ length: 120 }, (_, j) => `point ${j} `).join('')}`);
  const longText = paragraphs.join('\n\n');
  const h = ingestHarness({
    stagedDocs: [{ id: 'doc-2', ext: '.txt', filename: 'long_call.txt', status: 'STAGED', data: new TextEncoder().encode(longText), uploadedAt: new Date('2026-10-19T12:00:00Z') }],
  });

  try {
    const response = await h.post();

    assert.deepEqual(response.body.processed, ['doc-2']);
    const cleaned = cleaner.cleanTranscriptText(longText);
    assert.equal(h.openai.payloads.length, Math.ceil(cleaned.length / 9000), 'one model call per chunk');
    const sent = h.openai.payloads.map(p => p.messages[1].content).join('\n\n');
    assert.ok(sent.length <= cleaned.length, 'nothing beyond the document may be sent');
    for (const paragraph of longText.split('\n\n')) {
      assert.ok(sent.includes(cleaner.cleanTranscriptText(paragraph)), 'each paragraph must reach the summariser');
    }
    assert.ok(h.openai.payloads[0].messages[0].content.includes('part 1 of'), 'multi-part runs are labelled');
  } finally {
    h.restore();
  }
});

test('ingest failures keep the document staged for retry', async () => {
  const doc = { id: 'doc-3', ext: '.txt', filename: 'call.txt', status: 'STAGED', data: new TextEncoder().encode('real content'), uploadedAt: new Date('2026-10-19T12:00:00Z') };

  const empty = ingestHarness({ stagedDocs: [doc], reply: '' });
  try {
    const response = await empty.post();
    assert.deepEqual(response.body, { processed: [], failed: [{ id: 'doc-3', error: 'Empty AI response.' }], remaining: 1 });
    assert.deepEqual(empty.log.updates, [], 'a failed document must not be marked INGESTED');
    assert.equal(empty.log.knowledgeResets, 0, 'nothing was ingested, so the knowledge cache must not be invalidated');
  } finally {
    empty.restore();
  }

  const blank = ingestHarness({ stagedDocs: [{ ...doc, data: new TextEncoder().encode('00:00:01 >> um') }] });
  try {
    const response = await blank.post();
    assert.deepEqual(response.body.failed, [{ id: 'doc-3', error: 'No extractable text.' }]);
  } finally {
    blank.restore();
  }
});

const stagedDoc = (id, uploadedAt, body = noisyTranscript) => ({
  id,
  ext: '.txt',
  filename: `${id}.txt`,
  status: 'STAGED',
  data: new TextEncoder().encode(body),
  uploadedAt: new Date(uploadedAt),
});

test('ingest handles exactly one document per request so a long run cannot time out', async () => {
  const h = ingestHarness({
    stagedDocs: [stagedDoc('doc-1', '2026-10-19T10:00:00Z'), stagedDoc('doc-2', '2026-10-19T11:00:00Z')],
  });

  try {
    const first = await h.post();
    assert.deepEqual(first.body, { processed: ['doc-1'], failed: [], remaining: 1 }, 'the oldest document goes first');
    assert.equal(h.log.transactions, 1, 'one document per request');

    const second = await h.post({ exclude: [] });
    assert.deepEqual(second.body, { processed: ['doc-2'], failed: [], remaining: 0 });

    const third = await h.post({ exclude: [] });
    assert.deepEqual(third.body, { processed: [], failed: [], remaining: 0 }, 'an empty queue is not an error');
    assert.equal(h.log.transactions, 2, 'the drained queue triggers no further work');
  } finally {
    h.restore();
  }
});

test('a document that cannot be read is skipped so the queue still drains', async () => {
  const h = ingestHarness({
    stagedDocs: [stagedDoc('bad', '2026-10-19T10:00:00Z', '00:00:01 >> um'), stagedDoc('good', '2026-10-19T11:00:00Z')],
  });

  try {
    const first = await h.post({ exclude: [] });
    // `remaining` counts everything still staged and not given up on: the bad document is
    // still staged (for a later retry) and the good one has not been reached yet.
    assert.deepEqual(first.body, { processed: [], failed: [{ id: 'bad', error: 'No extractable text.' }], remaining: 2 });
    assert.deepEqual(h.log.updates, [], 'the unreadable document must stay staged');

    // The UI hands the failed id back, so the good document is still reached.
    const second = await h.post({ exclude: ['bad'] });
    assert.deepEqual(second.body, { processed: ['good'], failed: [], remaining: 0 });
  } finally {
    h.restore();
  }
});

test('ingest can be aimed at one document by id', async () => {
  const h = ingestHarness({
    stagedDocs: [stagedDoc('doc-1', '2026-10-19T10:00:00Z'), stagedDoc('doc-2', '2026-10-19T11:00:00Z')],
  });

  try {
    const response = await h.post({ id: 'doc-2' });
    assert.deepEqual(response.body, { processed: ['doc-2'], failed: [], remaining: 1 }, 'the named document is ingested, not the oldest');
  } finally {
    h.restore();
  }
});

test('a malformed target is rejected instead of ingesting the wrong document', async () => {
  const h = ingestHarness({ stagedDocs: [stagedDoc('doc-1', '2026-10-19T10:00:00Z')] });

  try {
    assert.equal((await h.post({ id: '' })).status, 400);
    assert.equal((await h.post({ exclude: 'doc-1' })).status, 400);
    assert.equal((await h.post({ exclude: [1] })).status, 400);
    assert.equal(h.log.transactions, 0, 'a rejected request must not ingest anything');
  } finally {
    h.restore();
  }
});

test('chunkForSummarize preserves all content and respects the size cap', () => {
  const paragraphs = ['a'.repeat(50), 'b'.repeat(50), 'c'.repeat(50)];
  const chunks = summarize.chunkForSummarize(paragraphs.join('\n\n'), 110);

  assert.equal(chunks.length, 2, 'two 50-char paragraphs fit, the third starts a new chunk');
  assert.ok(chunks.every(chunk => chunk.length <= 110));
  assert.equal(chunks.flatMap(chunk => chunk.split('\n\n')).length, 3);

  const oversized = summarize.chunkForSummarize('x'.repeat(250), 100);
  assert.equal(oversized.length, 3, 'an oversized paragraph is hard-split');
  assert.equal(oversized.join('').length, 250);
});

test('mergeChunkSummaries keeps canonical order and collapses None found', () => {
  const part1 = ['preamble text', '## Meeting Summary', 'First half happened.', '## Q&A', 'Q: When? A: Friday.'].join('\n');
  const part2 = ['## Meeting Summary', 'None found.', '## Action Items', 'None found.', '## Key Decisions', 'Ship on Sunday.'].join('\n');

  const merged = summarize.mergeChunkSummaries([part1, part2]);

  const headings = merged.split('\n\n').map(block => block.split('\n')[0]);
  assert.deepEqual(headings, [
    '## Meeting Summary',
    '## People & Roles',
    '## Key Decisions',
    '## Guidelines & Process',
    '## Deadlines & Dates',
    '## Action Items',
    '## Q&A',
    '## Unresolved / Needs Verification',
  ]);
  assert.ok(merged.includes('First half happened.'), 'real content from every part survives');
  assert.ok(merged.includes('Ship on Sunday.'));
  assert.ok(!merged.includes('preamble text'), 'text outside sections is dropped');
  const meeting = merged.split('## Meeting Summary\n')[1].split('\n')[0];
  assert.equal(meeting, 'First half happened.', 'a real entry beats another chunk\'s None found');
});
