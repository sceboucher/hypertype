import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const css = readFileSync(join(root, 'src/hypertype.css'), 'utf8');

// Remove every @supports { ... } block (brace-matched) so we can assert what
// remains in the always-applied base layer.
function stripSupports(input) {
  const src = input.replace(/\/\*[\s\S]*?\*\//g, ''); // drop comments so @supports in prose can't fool us
  let out = '';
  for (let i = 0; i < src.length; i++) {
    if (src.startsWith('@supports', i)) {
      const open = src.indexOf('{', i);
      let depth = 1;
      let j = open + 1;
      for (; j < src.length && depth > 0; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') depth--;
      }
      i = j - 1;
      continue;
    }
    out += src[i];
  }
  return out;
}

const BUDGET_TOKENS = 2000;

test('hypertype.css stays under the inline token budget', () => {
  const tokens = Math.round(Buffer.byteLength(css, 'utf8') / 4);
  assert.ok(tokens <= BUDGET_TOKENS, `CSS ~${tokens} tokens exceeds budget ${BUDGET_TOKENS}`);
});

test('hypertype.css ships the production-safe layer unconditionally', () => {
  for (const needed of [
    'font-optical-sizing: auto',
    'font-kerning: normal',
    'text-wrap: balance',
    'text-wrap: pretty',
    'font-variant-numeric: tabular-nums',
    'font-variant-caps: all-small-caps',
  ]) {
    assert.ok(css.includes(needed), `missing production-safe rule: ${needed}`);
  }
});

test('every progressive-enhancement feature is gated behind @supports', () => {
  const base = stripSupports(css);
  // These properties must NOT appear in the always-applied base layer.
  for (const gated of ['text-box:', 'hanging-punctuation:', 'hyphenate-limit-chars:', 'initial-letter:']) {
    assert.ok(!base.includes(gated), `${gated} must live only inside @supports, found in base layer`);
  }
});

test('hypertype.css provides a fallback for each gated enhancement', () => {
  // Drop cap float fallback, optical-margin text-indent fallback both in base.
  const base = stripSupports(css);
  assert.ok(base.includes('float: left'), 'drop-cap float fallback missing from base layer');
  assert.ok(base.includes('text-indent: -0.42em'), 'hanging-punctuation text-indent fallback missing');
});
