// The committed corpus has to stay reproducible from the tree. This is the guard that the offline
// script and the ingest pipeline really do share one set of rules, and that refactoring those rules
// did not silently change eight already-reviewed files. Line endings are normalised because the
// working copy may be CRLF while the script writes LF.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const COMMITTED = path.join(ROOT, 'clean-transcripts', 'transcripts');

const normalise = text => text.replace(/\r\n/g, '\n');
const read = file => normalise(fs.readFileSync(file, 'utf8'));

test('the cleaner script reproduces the committed transcript corpus exactly', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-'));
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'clean-transcripts.mjs'), '--out', out], { cwd: ROOT });

    const produced = fs.readdirSync(out).sort();
    const committed = fs.readdirSync(COMMITTED).sort();

    assert.ok(committed.length > 0, 'the committed corpus must exist');
    assert.deepEqual(produced, committed, 'the script must produce exactly the committed files');

    for (const name of committed) {
      assert.equal(read(path.join(out, name)), read(path.join(COMMITTED, name)), `${name} must be reproduced exactly`);
    }
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
