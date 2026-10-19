// Route-level checks for knowledge injection into the chat system prompt (issue #36) and the
// per-user persistence wiring (neo-005). The routes are transpiled and run with the network,
// session, AI client and database stubbed, but the real knowledge loader, so the assertions cover
// the actual wiring inside the handlers. Run with `node --test tests/`.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      // Matches tsconfig.json so the stubs see the same class semantics as a real build.
      target: ts.ScriptTarget.ES2017,
    },
  }).outputText;
}

const routeSource = transpile('src/app/api/chat/route.ts');
const historySource = transpile('src/app/api/chat/history/route.ts');
const knowledgeSource = transpile('src/lib/knowledge.ts');

// Evaluates the knowledge module with KNOWLEDGE_DIR applied at load time, since the module resolves
// the directory on import. `ingested` stands in for the ingested-document rows the loader reads
// from the database.
function loadKnowledge(knowledgeDir, ingested = []) {
  const previous = process.env.KNOWLEDGE_DIR;
  if (knowledgeDir === undefined) delete process.env.KNOWLEDGE_DIR;
  else process.env.KNOWLEDGE_DIR = knowledgeDir;
  try {
    const context = {
      exports: {},
      process,
      console,
      require(name) {
        if (name === '@/lib/prisma') {
          return { __esModule: true, prisma: { ingestedDocument: { findMany: async () => ingested } } };
        }
        return require(name);
      },
    };
    vm.runInNewContext(knowledgeSource, context);
    return context.exports;
  } finally {
    if (previous === undefined) delete process.env.KNOWLEDGE_DIR;
    else process.env.KNOWLEDGE_DIR = previous;
  }
}

function nextServerStub() {
  return {
    __esModule: true,
    NextResponse: {
      // The JSON round-trip re-creates bodies in the test realm, so deepStrictEqual sees plain
      // test-side objects instead of cross-realm ones built inside the vm.
      json: (body, init) => ({
        body: JSON.parse(JSON.stringify(body ?? null)),
        status: init?.status ?? 200,
      }),
    },
  };
}

// Reads the SSE body to completion, which also guarantees the route has finished saving the
// assistant reply, since it closes the stream only after that write.
async function sse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }

  return text
    .split('\n')
    .filter(line => line.startsWith('data: '))
    .map(line => JSON.parse(line.slice('data: '.length)));
}

function harness({ knowledgeDir, ingested, session = { user: { name: 'Synthetic QA', id: 'synthetic-google-id' } }, throwOn } = {}) {
  const calls = [];
  const errors = [];
  const db = { upserts: [], chatsCreated: 0, messages: [] };
  const knowledge = loadKnowledge(knowledgeDir, ingested);

  const die = role => {
    if (throwOn === role) throw new Error('database down');
  };

  const prisma = {
    user: {
      upsert: async args => {
        die('upsert');
        db.upserts.push(JSON.parse(JSON.stringify(args)));
        return { id: args.where.id };
      },
    },
    chat: {
      findFirst: async () => null,
      create: async () => {
        db.chatsCreated += 1;
        return { id: 'chat-1' };
      },
    },
    message: {
      create: async args => {
        die(args.data.role);
        db.messages.push(JSON.parse(JSON.stringify(args.data)));
        return { id: `msg-${db.messages.length}` };
      },
    },
  };

  class OpenAIMock {
    constructor() {
      this.chat = {
        completions: {
          async create(payload) {
            calls.push(payload);
            // The route streams, so the stub must return an async iterable of chunks.
            return (async function* () {
              yield { choices: [{ delta: { content: 'stub reply' } }] };
            })();
          },
        },
      };
    }
  }

  const context = {
    exports: {},
    process,
    console: {
      error: (...args) => errors.push(args.map(String).join(' ')),
      warn() {},
      log() {},
    },
    // Web globals the streaming route uses to build its SSE response.
    TextEncoder,
    ReadableStream,
    Response,
    require(name) {
      if (name === 'next/server') {
        return nextServerStub();
      }
      if (name === 'next-auth') {
        return { __esModule: true, getServerSession: async () => session };
      }
      if (name === 'openai') {
        return { __esModule: true, default: OpenAIMock };
      }
      if (name === '@/lib/auth') {
        return { __esModule: true, authOptions: {} };
      }
      if (name === '@/lib/knowledge') {
        return knowledge;
      }
      if (name === '@/lib/prisma') {
        return { __esModule: true, prisma };
      }
      return require(name);
    },
  };

  vm.runInNewContext(routeSource, context);

  const previousKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'test-key';
  const restore = () => {
    if (previousKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = previousKey;
  };

  return {
    calls,
    db,
    errors,
    restore,
    post: messages => context.exports.POST({ json: async () => ({ messages }) }),
  };
}

function historyHarness({ session = { user: { id: 'synthetic-google-id' } }, prisma } = {}) {
  const context = {
    exports: {},
    process,
    console,
    require(name) {
      if (name === 'next/server') {
        return nextServerStub();
      }
      if (name === 'next-auth') {
        return { __esModule: true, getServerSession: async () => session };
      }
      if (name === '@/lib/auth') {
        return { __esModule: true, authOptions: {} };
      }
      if (name === '@/lib/prisma') {
        return { __esModule: true, prisma };
      }
      return require(name);
    },
  };

  vm.runInNewContext(historySource, context);
  return context.exports;
}

const systemContentOf = payload => payload.messages[0].content;

test('POST always injects the summaries and the task document', async () => {
  const h = harness();

  try {
    const response = await h.post([{ role: 'user', content: 'hello there' }]);

    assert.equal(response.status, 200);
    assert.equal(h.calls.length, 1);

    const payload = h.calls[0];
    assert.equal(payload.messages[0].role, 'system');
    assert.deepEqual(Array.from(payload.messages.slice(1), m => m.role), ['user']);
    assert.equal(payload.messages[1].content, 'hello there');

    const system = systemContentOf(payload);
    assert.ok(system.includes('COHORT CALL KNOWLEDGE'), 'summaries block must always be present');
    assert.ok(system.includes('## People & Roles'), 'the compacted summaries must be injected');
    assert.ok(system.includes('OFFICIAL ZEDU DOCUMENTATION'), 'the task document must remain');
    assert.ok(system.includes('Two Sources, Both Authoritative'), 'the guardrails must remain');
  } finally {
    h.restore();
  }
});

test('POST attaches a cleaned transcript only when the question points at one call', async () => {
  const h = harness();

  try {
    const pointed = await h.post([{ role: 'user', content: 'what did they say about email deliverability' }]);

    assert.equal(pointed.status, 200);
    const system = systemContentOf(h.calls[0]);
    // The guardrail text also mentions the phrase, so match the attached section header instead.
    assert.ok(
      system.includes('=== CALL TRANSCRIPT'),
      'a pointed question must attach the transcript',
    );
    assert.ok(
      system.includes('=== CALL TRANSCRIPT — EXACT WORDING (2026-10-16_call_9'),
      'the transcript attached must be the matching call',
    );
  } finally {
    h.restore();
  }

  const vague = harness();

  try {
    const response = await vague.post([{ role: 'user', content: 'hello there' }]);

    assert.equal(response.status, 200);
    assert.ok(
      !systemContentOf(vague.calls[0]).includes('=== CALL TRANSCRIPT'),
      'a vague question must not attach a whole transcript',
    );
  } finally {
    vague.restore();
  }
});

test('POST injects ingested document knowledge from the database', async () => {
  const h = harness({
    ingested: [
      {
        title: 'zebu_flamingo_onboarding_portal',
        summary: '## Key Decisions\nThe onboarding portal ships on Friday.',
        cleaned: 'verbatim portal wording nobody else contains',
      },
    ],
  });

  try {
    const response = await h.post([{ role: 'user', content: 'when does the zebu flamingo onboarding portal ship' }]);

    assert.equal(response.status, 200);
    const system = systemContentOf(h.calls[0]);
    assert.ok(system.includes('The onboarding portal ships on Friday.'), 'ingested summaries are always on');
    assert.ok(
      system.includes('=== CALL TRANSCRIPT — EXACT WORDING (zebu_flamingo_onboarding_portal)'),
      'an ingested document attaches like a call transcript',
    );
    assert.ok(system.includes('verbatim portal wording nobody else contains'));
  } finally {
    h.restore();
  }
});

test('POST fails loudly with 503 when the knowledge base cannot be read', async () => {
  const h = harness({ knowledgeDir: path.join('clean-transcripts', 'does-not-exist') });

  try {
    const response = await h.post([{ role: 'user', content: 'hello there' }]);

    assert.equal(response.status, 503);
    assert.equal(response.body.error, 'Knowledge base is unavailable.');
    assert.equal(h.calls.length, 0, 'the model must not be called without the knowledge base');
  } finally {
    h.restore();
  }
});

test('POST still rejects unauthenticated requests before touching the knowledge base', async () => {
  const h = harness({ session: null, knowledgeDir: path.join('clean-transcripts', 'does-not-exist') });

  try {
    const response = await h.post([{ role: 'user', content: 'hello there' }]);

    assert.equal(response.status, 401);
    assert.equal(h.calls.length, 0);
  } finally {
    h.restore();
  }
});

test('POST trims long histories instead of rejecting them', async () => {
  const h = harness();

  try {
    const history = Array.from({ length: 60 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i}`,
    }));

    const response = await h.post(history);

    assert.equal(response.status, 200);

    const sent = h.calls[0].messages;
    assert.equal(sent.length, 31, 'system prompt plus the last 30 messages');
    assert.equal(sent[0].role, 'system');
    assert.equal(sent[1].content, 'message 30', 'older messages are dropped from the front');
    assert.equal(sent[30].content, 'message 59', 'the newest message is kept');
  } finally {
    h.restore();
  }
});

test('POST still rejects malformed bodies', async () => {
  const h = harness();

  try {
    const response = await h.post([{ role: 'system', content: 'not allowed' }]);

    assert.equal(response.status, 400);
    assert.equal(h.calls.length, 0);
  } finally {
    h.restore();
  }
});

test('POST saves the user message and the finished assistant reply', async () => {
  const h = harness();

  try {
    const payloads = await sse(await h.post([{ role: 'user', content: 'hello there' }]));

    assert.deepEqual(payloads, [{ delta: 'stub reply' }]);

    assert.deepEqual(h.db.upserts, [
      { where: { id: 'synthetic-google-id' }, update: {}, create: { id: 'synthetic-google-id' } },
    ]);
    assert.equal(h.db.chatsCreated, 1);
    assert.deepEqual(h.db.messages, [
      { chatId: 'chat-1', role: 'user', content: 'hello there' },
      { chatId: 'chat-1', role: 'assistant', content: 'stub reply' },
    ]);
    assert.deepEqual(h.errors, []);
  } finally {
    h.restore();
  }
});

test('POST streams through a database outage without persisting', async () => {
  const h = harness({ throwOn: 'upsert' });

  try {
    const payloads = await sse(await h.post([{ role: 'user', content: 'hello there' }]));

    assert.deepEqual(payloads, [{ delta: 'stub reply' }], 'the reply must still stream');
    assert.deepEqual(h.db.messages, [], 'nothing may be half-saved during an outage');
    assert.ok(
      h.errors.some(text => text.includes('persist the user message')),
      'the outage must be logged, not swallowed',
    );
  } finally {
    h.restore();
  }
});

test('POST streams through an assistant-save failure after a full reply', async () => {
  const h = harness({ throwOn: 'assistant' });

  try {
    const payloads = await sse(await h.post([{ role: 'user', content: 'hello there' }]));

    assert.deepEqual(payloads, [{ delta: 'stub reply' }]);
    assert.deepEqual(
      h.db.messages.map(m => m.role),
      ['user'],
      'the user message is saved, the failed assistant reply is not',
    );
    assert.ok(
      h.errors.some(text => text.includes('persist the assistant reply')),
      'the save failure must be logged, not swallowed',
    );
  } finally {
    h.restore();
  }
});

test('history returns the signed-in user\'s saved conversation in order', async () => {
  const saved = [
    { role: 'user', content: 'first question' },
    { role: 'assistant', content: 'first answer' },
  ];
  const lookups = [];
  let messageQuery;
  const prisma = {
    chat: {
      findFirst: async args => {
        lookups.push(JSON.parse(JSON.stringify(args)));
        return { id: 'chat-1' };
      },
    },
    message: {
      findMany: async args => {
        messageQuery = JSON.parse(JSON.stringify(args));
        return saved;
      },
    },
  };

  const { GET } = historyHarness({ prisma });
  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(lookups, [
    { where: { userId: 'synthetic-google-id' }, orderBy: { createdAt: 'asc' } },
  ]);
  assert.deepEqual(messageQuery, {
    where: { chatId: 'chat-1' },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true },
  });
  assert.deepEqual(response.body.messages, saved);
});

test('history returns an empty list without touching the database when unauthenticated', async () => {
  let touched = false;
  const prisma = {
    chat: {
      findFirst: async () => {
        touched = true;
        return { id: 'chat-1' };
      },
    },
    message: { findMany: async () => [] },
  };

  const { GET } = historyHarness({ session: null, prisma });
  const response = await GET();

  assert.deepEqual(response.body, { messages: [] });
  assert.equal(touched, false, 'the database must not be queried without a session');
});

test('history returns an empty list before the user has any chat', async () => {
  const prisma = {
    chat: { findFirst: async () => null },
    message: { findMany: async () => [] },
  };

  const { GET } = historyHarness({ prisma });
  const response = await GET();

  assert.deepEqual(response.body, { messages: [] });
});

test('history returns an empty list when the database is unavailable', async () => {
  const prisma = {
    chat: {
      findFirst: async () => {
        throw new Error('database down');
      },
    },
    message: { findMany: async () => [] },
  };

  const { GET } = historyHarness({ prisma });
  const response = await GET();

  assert.deepEqual(response.body, { messages: [] });
});
