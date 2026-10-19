// Unit checks for the deterministic ingest cleaner: one rulebook, two shapes. Caption captures get
// the same shaping the committed corpus was produced with; any other document keeps its own layout.
// Same transpile-and-run pattern as the other tests in this directory, since the repository has no
// TypeScript test runner. The cleaner is plain ESM, which TypeScript transpiles to CJS for the vm.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const compiled = ts.transpileModule(fs.readFileSync('src/lib/cleanText.mjs', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2017 },
}).outputText;

const context = { exports: {}, console, process };
vm.runInNewContext(compiled, context);
const { cleanTranscriptText, cleanCaptionText, cleanDocumentText, looksLikeCaptionCapture } = context.exports;

/* -------------------------------------------------------------- caption captures */

test('a caption capture is cleaned and reflowed the way the corpus is', () => {
  const raw = ['00:00:04.480 >> Welcome &amp; good morning', '00:04 welcome to HNG'].join('\n');

  // `00:04` survives on purpose: the corpus rule only removes a full hh:mm:ss stamp, and this path
  // has to keep reproducing the committed files exactly.
  assert.equal(cleanTranscriptText(raw), '## Cleaned Transcript\n\nWelcome & good morning 00:04 welcome to HNG');
});

test('a caption capture drops ASR filler, stutters and duplicated words', () => {
  const raw = '00:00:04.480 >> um so we, you know, fixed the the deploy uh issue I mean yesterday';

  assert.equal(cleanCaptionText(raw), '## Cleaned Transcript\n\nSo we, fixed the deploy issue yesterday');
});

test('a caption capture whose speech is all noise cleans to nothing', () => {
  assert.equal(cleanTranscriptText('00:00:01 >> um'), '');
});

test('captures are recognised by their export furniture, not by file extension', () => {
  assert.equal(looksLikeCaptionCapture('00:00:04.480 >> hello'), true);
  assert.equal(looksLikeCaptionCapture('tactiq.io\nanything'), true);
  assert.equal(looksLikeCaptionCapture('**Date:** 2026-10-19\nanything'), true);
  assert.equal(looksLikeCaptionCapture('FULL TRANSCRIPT\nanything'), true);
  // A stream of timestamped lines is a capture even without a marker.
  assert.equal(looksLikeCaptionCapture('00:00:01\n00:00:02\n00:00:03\nstream'), true);
});

/* -------------------------------------------------------------- other documents */

test('captures of prose are not mistaken for captures', () => {
  assert.equal(looksLikeCaptionCapture('The deadline is Friday. 2 >> 1 wins.'), false);
  assert.equal(looksLikeCaptionCapture('plain prose with no furniture at all'), false);
});

test('a document keeps its own paragraphs instead of being reflowed', () => {
  const raw = [
    'we are going to talk about',
    'the week two tasks and',
    'then take questions',
    '',
    'Second paragraph starts here.',
  ].join('\n');

  assert.equal(
    cleanTranscriptText(raw),
    'we are going to talk about the week two tasks and then take questions\n\nSecond paragraph starts here.',
  );
});

test('a document drops disfluencies but keeps words that carry meaning', () => {
  // "you know" and "I mean" are real English here, so deleting them would change the meaning.
  assert.equal(
    cleanDocumentText('um so we, you know, fixed the the deploy uh issue I mean yesterday'),
    'so we, you know, fixed the deploy issue I mean yesterday',
  );
});

test('a document keeps a clock time but drops caption stamps at line start', () => {
  assert.equal(
    cleanDocumentText('The deadline is 10:45 tomorrow.\n\nJoined at 00:01:23 as well.'),
    'The deadline is 10:45 tomorrow.\n\nJoined at 00:01:23 as well.',
  );
  assert.equal(cleanDocumentText('00:00:12 Sarah: the deploy is green'), 'Sarah: the deploy is green');
});

test('a document rejoins words split across a hard wrap', () => {
  assert.equal(cleanTranscriptText('the deve-\nlopment work continues here'), 'the development work continues here');
});

test('a document keeps headings, list items and speaker turns on their own lines', () => {
  assert.equal(cleanDocumentText('# Agenda\n\n- first item\n- second item'), '# Agenda\n\n- first item\n\n- second item');
  assert.equal(cleanDocumentText('[Alice]: hello there\n[Bob]: hi Alice'), '[Alice]: hello there\n\n[Bob]: hi Alice');
});

test('decodes numeric apostrophe entities and normalises spacing', () => {
  assert.equal(cleanDocumentText("don&#39;t  worry   about   it"), "don't worry about it");
});

test('never invents content: deletions only', () => {
  const raw = '2026-10-19 stands. The deadline is Friday. 2 >> 1 wins.';

  // The date prefix is kept (only clock-style stamps go) and the comparison survives because markers
  // are only stripped at line starts.
  assert.equal(cleanTranscriptText(raw), raw);
});
