const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'translations/zh-CN.json'), 'utf8'));
const placeholders = (text) => (text.match(/\{\{[\s\S]*?\}\}/g) || []).sort();

test('dictionary contains nonempty string translations and preserves placeholders', () => {
  assert.ok(Object.keys(dictionary).length > 0);
  for (const [english, chinese] of Object.entries(dictionary)) {
    assert.equal(typeof chinese, 'string');
    assert.ok(chinese.trim(), `Empty translation: ${english}`);
    assert.deepEqual(placeholders(chinese), placeholders(english), `Placeholder mismatch: ${english}`);
  }
});

test('source and distributed bundle have valid JavaScript syntax', () => {
  for (const file of ['src/patcher.js', 'dist/patcher.cjs']) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
});
