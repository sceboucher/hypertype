import { test } from 'node:test';
import assert from 'node:assert/strict';

import { smartQuotes, leadingPunctuation } from '../src/micro.js';

test('smartQuotes curls double quotes by context', () => {
  assert.equal(smartQuotes('she said "hello" loudly'), 'she said “hello” loudly');
});

test('smartQuotes curls single quotes and apostrophes', () => {
  assert.equal(smartQuotes("it's a 'test'"), 'it’s a ‘test’');
});

test('smartQuotes converts three dots to a real ellipsis', () => {
  assert.equal(smartQuotes('wait...'), 'wait…');
});

test('smartQuotes leaves already-curly text unchanged', () => {
  const already = '“done”';
  assert.equal(smartQuotes(already), already);
});

test('leadingPunctuation reports the hanging glyph at the start of a string', () => {
  assert.equal(leadingPunctuation('“Hello'), '“'); // opening curly quote
  assert.equal(leadingPunctuation('"Hello'), '"');
  assert.equal(leadingPunctuation('‘Hi'), '‘');
  assert.equal(leadingPunctuation('Hello'), '');          // nothing to hang
  assert.equal(leadingPunctuation('  “Hi'), '“'); // skips leading spaces
});
