// Isolated component logic with mocked React hooks, DOM serializer and clipboard.
// Native browser behavior, layout and accessibility announcements require browser QA.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function harness(clipboard) {
  const slots = [];
  const states = [];
  let cursor = 0;
  let stateCursor = 0;
  let mounted = false;
  const cleanups = [];
  const timers = new Map();
  const react = {
    useState(initial) {
      const index = stateCursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ||= { current: initial };
    },
    useEffect(effect) {
      // Run only the copy cleanup effect; session network loading is out of scope.
      if (!mounted && !cleanups.length) {
        const cleanup = effect();
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const context = {
    exports: {}, navigator: { clipboard },
    setTimeout(fn) { const id = {}; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    require(name) {
      if (name === 'react') return react;
      if (name === 'next-auth/react') return { useSession: () => ({ data: { user: { name: 'Synthetic QA' } }, status: 'authenticated' }) };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
      if (name.includes('messagePlainText')) return { messagePlainText: element => element.text };
      return {};
    },
  };
  const code = ts.transpileModule(fs.readFileSync('src/app/page.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, context);
  let elements;
  function render() {
    cursor = 0;
    stateCursor = 0;
    elements = [];
    function walk(value) {
      if (Array.isArray(value)) return value.forEach(walk);
      if (!value || typeof value !== 'object') return;
      elements.push(value);
      if (value.props?.className === 'markdown-content') {
        value.props.ref({ text: value.props.children.props.children });
      }
      walk(value.props?.children);
    }
    walk(context.exports.default());
    mounted = true;
    return elements.filter(element => element.type === 'button' && element.props['aria-label']?.startsWith('Copy Zoe response'));
  }
  return {
    render, timers, unmount: () => cleanups.forEach(fn => fn()),
    messages: value => { states[1] = value; },
    get feedback() { return states[5]; },
  };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('welcome copy awaits success and expires confirmation', async () => {
  let resolveWrite;
  let copied;
  const h = harness({ writeText: text => { copied = text; return new Promise(resolve => { resolveWrite = resolve; }); } });
  h.render()[0].props.onClick();
  assert.equal(copied, 'Welcome to Zoe, The Official Zedu Contributor Assistant! Ask me about tasks.');
  assert.equal(h.feedback.state, 'pending');
  resolveWrite(); await tick();
  assert.equal(h.render()[0].props.children, 'Copied');
  [...h.timers.values()][0]();
  assert.equal(h.feedback, null);
});

test('multiple/history-shaped messages exclude users and invalidate older pending feedback', async () => {
  const pending = [];
  const writes = [];
  const h = harness({ writeText: text => { writes.push(text); return new Promise(resolve => pending.push(resolve)); } });
  h.messages([{ role: 'assistant', content: 'First' }, { role: 'user', content: 'Question' }, { role: 'assistant', content: 'Second' }]);
  const buttons = h.render();
  assert.equal(buttons.length, 2);
  assert.equal(buttons[1].props['aria-label'], 'Copy Zoe response 3');
  buttons[0].props.onClick(); buttons[1].props.onClick();
  pending[1](); await tick(); pending[0](); await tick();
  assert.deepEqual(writes, ['First', 'Second']);
  assert.equal(h.feedback.index, 2);
  assert.equal(h.feedback.state, 'success');
  assert.equal(h.timers.size, 1);
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('rejection and unavailable clipboard produce error without a success timer', async () => {
  for (const clipboard of [undefined, { writeText: async () => { throw new Error('Denied'); } }]) {
    const h = harness(clipboard);
    h.render()[0].props.onClick(); await tick();
    assert.equal(h.feedback.state, 'error');
    assert.equal(h.render()[0].props.children, 'Copy');
    assert.equal(h.timers.size, 0);
  }
});

test('unmount invalidates in-flight completion', async () => {
  let resolveWrite;
  const h = harness({ writeText: () => new Promise(resolve => { resolveWrite = resolve; }) });
  h.render()[0].props.onClick(); h.unmount(); resolveWrite(); await tick();
  assert.equal(h.feedback.state, 'pending');
  assert.equal(h.timers.size, 0);
});
