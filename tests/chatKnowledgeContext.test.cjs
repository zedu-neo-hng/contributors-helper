// Route-level checks for knowledge injection into the chat system prompt (issue #36). The chat route
// is transpiled and run with the network, session and AI client stubbed, but the real knowledge
// loader, so the assertions cover the actual wiring inside POST. Run with `node --test tests/`.
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
const knowledgeSource = transpile('src/lib/knowledge.ts');

// Evaluates the knowledge module with KNOWLEDGE_DIR applied at load time, since the module resolves
// the directory on import.
function loadKnowledge(knowledgeDir) {
  const previous = process.env.KNOWLEDGE_DIR;
  if (knowledgeDir === undefined) delete process.env.KNOWLEDGE_DIR;
  else process.env.KNOWLEDGE_DIR = knowledgeDir;
  try {
    const context = { exports: {}, require, process, console };
    vm.runInNewContext(knowledgeSource, context);
    return context.exports;
  } finally {
    if (previous === undefined) delete process.env.KNOWLEDGE_DIR;
    else process.env.KNOWLEDGE_DIR = previous;
  }
}

function harness({ knowledgeDir, session = { user: { name: 'Synthetic QA' } } } = {}) {
  const calls = [];
  const knowledge = loadKnowledge(knowledgeDir);

  class OpenAIMock {
    constructor() {
      this.chat = {
        completions: {
          async create(payload) {
            calls.push(payload);
            return { choices: [{ message: { content: 'stub reply' } }] };
          },
        },
      };
    }
  }

  const context = {
    exports: {},
    process,
    console,
    require(name) {
      if (name === 'next/server') {
        return {
          __esModule: true,
          NextResponse: {
            json: (body, init) => ({ body, status: init?.status ?? 200 }),
          },
        };
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
    restore,
    post: messages => context.exports.POST({ json: async () => ({ messages }) }),
  };
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
