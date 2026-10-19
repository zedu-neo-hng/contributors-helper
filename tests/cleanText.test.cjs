// Unit checks for the deterministic transcript cleaner. Same transpile-and-run pattern as the other
// tests in this directory, since the repository has no TypeScript test runner.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const compiled = ts.transpileModule(fs.readFileSync('src/lib/cleanText.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2017 },
}).outputText;

const context = { exports: {}, console, process };
vm.runInNewContext(compiled, context);
const { cleanTranscriptText } = context.exports;

test('strips caption timestamps, speaker markers and entities', () => {
  const raw = [
    '00:00:04.480 >> Welcome &amp; good morning',
    '00:04 welcome to HNG',
  ].join('\n');

  const cleaned = cleanTranscriptText(raw);

  assert.equal(cleaned, 'Welcome & good morning welcome to HNG');
});

test('unwraps the ASR hard-wrap but keeps paragraph breaks', () => {
  const raw = [
    'we are going to talk about',
    'the week two tasks and',
    'then take questions',
    '',
    'Second paragraph starts here.',
  ].join('\n');

  const cleaned = cleanTranscriptText(raw);

  assert.equal(cleaned, 'we are going to talk about the week two tasks and then take questions\n\nSecond paragraph starts here.');
});

test('drops filler words and adjacent duplicated words', () => {
  const cleaned = cleanTranscriptText('um so we, you know, fixed the the deploy uh issue I mean yesterday');

  assert.equal(cleaned, 'so we fixed the deploy issue yesterday');
});

test('decodes numeric apostrophe entities and normalises spacing', () => {
  const cleaned = cleanTranscriptText("don&#39;t  worry   about   it");

  assert.equal(cleaned, "don't worry about it");
});

test('never invents content: deletions only', () => {
  const raw = '2026-10-19 stands. The deadline is Friday. 2 >> 1 wins.';

  const cleaned = cleanTranscriptText(raw);

  // The date prefix is kept (only clock-style timestamps go), and the comparison survives because
  // markers are only stripped at line starts.
  assert.equal(cleaned, '2026-10-19 stands. The deadline is Friday. 2 >> 1 wins.');
});
