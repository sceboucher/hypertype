import { test } from 'node:test';
import assert from 'node:assert/strict';

import { packLines, fitLine, slabModel, applyTextTransform, solveFit } from '../src/slab.js';

// Synthetic measurer: width === character count (spaces included).
// Makes the greedy packing fully deterministic for assertions.
const measure = (text) => text.length;

test('packLines greedily packs words into lines of roughly equal measured width', () => {
  // lengths: one=3 two=3 three=5 four=4 five=4 six=3
  // joined "one two three four five six" = 27 chars
  // containerWidth 10 => nLines = round(27 / (10*0.9)) = round(3) = 3, ideal = 9
  const words = ['one', 'two', 'three', 'four', 'five', 'six'];
  const lines = packLines(words, measure, 10);
  assert.deepEqual(lines, ['one two', 'three', 'four five', 'six']);
});

test('fitLine solves font-size so the line fills the container width (linear)', () => {
  // measure('one two') = 7 at probe 100. Container 350.
  // size = probe * (W / lineWidthAtProbe) = 100 * (350 / 7) = 5000
  const size = fitLine('one two', measure, 350, { probe: 100, min: 8, max: 100000 });
  assert.equal(size, 5000);
});

test('fitLine clamps to max when a line would otherwise overflow upward', () => {
  // 100 * (350/7) = 5000, clamped to max 400
  const size = fitLine('one two', measure, 350, { probe: 100, min: 8, max: 400 });
  assert.equal(size, 400);
});

test('fitLine clamps to min for a very long single word', () => {
  // measure of 50-char word = 50 at probe 100, container 20 => 100*(20/50)=40, clamp min 60
  const size = fitLine('x'.repeat(50), measure, 20, { probe: 100, min: 60, max: 400 });
  assert.equal(size, 60);
});

test('slabModel returns one sized line per packed line', () => {
  const model = slabModel('one two three four five six', measure, 10, { probe: 100, min: 8, max: 100000 });
  assert.deepEqual(model, [
    { text: 'one two', fontSize: 100 * (10 / 7) },
    { text: 'three', fontSize: 100 * (10 / 5) },
    { text: 'four five', fontSize: 100 * (10 / 9) },
    { text: 'six', fontSize: 100 * (10 / 3) },
  ]);
});

test('slabModel collapses arbitrary whitespace and ignores leading/trailing space', () => {
  const model = slabModel('  hello   world  ', measure, 1000, { probe: 100, min: 8, max: 100000 });
  assert.equal(model.length, 1);
  assert.equal(model[0].text, 'hello world');
});

test('slabModel honors explicit newlines as forced lines (no repacking)', () => {
  const model = slabModel('aa\nbbbb', measure, 100, { probe: 100, min: 8, max: 100000 });
  assert.deepEqual(model, [
    { text: 'aa', fontSize: 100 * (100 / 2) },
    { text: 'bbbb', fontSize: 100 * (100 / 4) },
  ]);
});

test('slabModel collapses inner whitespace and drops blank lines in forced-line mode', () => {
  const model = slabModel('  a   b \n\n c \n', measure, 100, { probe: 100, min: 8, max: 100000 });
  assert.deepEqual(model.map((m) => m.text), ['a b', 'c']);
});

test('slabModel returns empty array for empty or whitespace-only input', () => {
  assert.deepEqual(slabModel('', measure, 100), []);
  assert.deepEqual(slabModel('   \n  ', measure, 100), []);
});

test('slabModel handles a single word as one line', () => {
  const model = slabModel('Headline', measure, 80, { probe: 100, min: 8, max: 100000 });
  assert.equal(model.length, 1);
  assert.equal(model[0].text, 'Headline');
  assert.equal(model[0].fontSize, 100 * (80 / 8));
});

test('applyTextTransform matches CSS text-transform so measurement matches render', () => {
  assert.equal(applyTextTransform('The Quick fox', 'uppercase'), 'THE QUICK FOX');
  assert.equal(applyTextTransform('The Quick FOX', 'lowercase'), 'the quick fox');
  assert.equal(applyTextTransform('the quick fox', 'capitalize'), 'The Quick Fox');
  assert.equal(applyTextTransform('The Quick fox', 'none'), 'The Quick fox');
  assert.equal(applyTextTransform('The Quick fox', ''), 'The Quick fox');
});

test('solveFit binary-searches a monotonic measurer to the target width', () => {
  // width(param) = param. Largest param whose width <= 350 is 350.
  const result = solveFit((p) => p, 350, 8, 10000);
  assert.ok(Math.abs(result - 350) < 0.5, `expected ~350, got ${result}`);
});

test('solveFit handles non-linear measurers (where the linear solve is wrong)', () => {
  // width(size) = size + 0.2*size  (e.g. letter-spacing adds 20%). target 360 => size 300.
  const result = solveFit((size) => size * 1.2, 360, 8, 10000);
  assert.ok(Math.abs(result - 300) < 0.5, `expected ~300, got ${result}`);
});

test('solveFit clamps to hi when the text underflows even at the max', () => {
  const result = solveFit((p) => p * 0.001, 350, 8, 1000); // width at hi = 1 < 350
  assert.equal(result, 1000);
});

test('solveFit clamps to lo when the text overflows even at the min', () => {
  const result = solveFit((p) => p * 100, 350, 8, 10000); // width at lo = 800 > 350
  assert.equal(result, 8);
});
