// Unit fixtures model the DOM produced by ReactMarkdown; these are not browser tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

class Text {
  nodeType = 3;
  constructor(text) { this.textContent = text; }
}
class Element {
  nodeType = 1;
  constructor(tag, children = [], attributes = {}) {
    this.tagName = tag.toUpperCase();
    this.childNodes = children.map(child => typeof child === 'string' ? new Text(child) : child);
    this.attributes = attributes;
    for (const child of this.childNodes) child.parentElement = this;
  }
  get children() { return this.childNodes.filter(child => child instanceof Element); }
  get textContent() { return this.childNodes.map(child => child.textContent).join(''); }
  getAttribute(name) { return this.attributes[name] ?? null; }
}
const e = (tag, children, attributes) => new Element(tag, children, attributes);
const source = fs.readFileSync('src/lib/messagePlainText.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const context = { exports: {}, Node: { TEXT_NODE: 3 }, HTMLElement: Element };
vm.runInNewContext(compiled.outputText, context);
const { messagePlainText } = context.exports;

test('copies welcome and only the selected response root', () => {
  const welcome = e('div', [e('p', ['Welcome to Zoe!'])]);
  const other = e('div', [e('p', ['A different response'])]);
  assert.equal(messagePlainText(welcome), 'Welcome to Zoe!');
  assert.equal(messagePlainText(other), 'A different response');
});

test('preserves readable heading, emphasis, lists, inline code and link destination', () => {
  const root = e('div', [
    e('h2', ['Task instructions']),
    e('p', ['Use ', e('strong', ['care']), ' and ', e('code', ['npm test']), '.']),
    e('ul', [e('li', ['First bullet']), e('li', ['Second bullet'])]),
    e('ol', [e('li', ['Step three']), e('li', ['Step four'])], { start: '3' }),
    e('p', [e('a', ['Submission'], { href: 'https://example.com/submit' })]),
  ]);
  assert.equal(messagePlainText(root), 'Task instructions\n\nUse care and npm test.\n\n• First bullet\n• Second bullet\n\n3. Step three\n4. Step four\n\nSubmission (https://example.com/submit)');
});

test('retains fenced code indentation, internal blank lines and Markdown-like literals', () => {
  const code = '  const text = "**literal**";\n\n    return text;\n';
  assert.equal(messagePlainText(e('div', [e('pre', [e('code', [code])])])), code.replace(/\n+$/, ''));
});

test('does not truncate long multi-paragraph content', () => {
  const long = 'Complete response content. '.repeat(3000);
  assert.equal(messagePlainText(e('div', [e('p', [long]), e('p', ['Final paragraph.'])])), `${long}\n\nFinal paragraph.`);
});

test('preserves explicit line breaks, image alt text and avoids duplicate autolink URL', () => {
  assert.equal(messagePlainText(e('div', [e('p', ['Line one', e('br'), 'Line two ', e('img', [], { alt: 'Diagram' }), ' ', e('a', ['https://example.com'], { href: 'https://example.com' })])])), 'Line one\nLine two Diagram https://example.com');
});
