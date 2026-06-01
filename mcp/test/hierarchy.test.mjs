import { test } from 'node:test';
import assert from 'node:assert/strict';
import { critiqueHierarchy, toPx, toWeight } from '../src/hierarchy.mjs';

test('toPx normalizes units and reads clamp() max', () => {
  assert.equal(toPx('24px').px, 24);
  assert.equal(toPx('1.5rem').px, 24);
  assert.equal(toPx('clamp(1rem, 2vw, 3rem)').px, 48);
  assert.equal(toPx('clamp(1rem, 2vw, 3rem)').fluid, true);
});

test('toWeight maps keywords and numbers', () => {
  assert.equal(toWeight('bold'), 700);
  assert.equal(toWeight('normal'), 400);
  assert.equal(toWeight('800'), 800);
});

test('flags a flat, symmetric-margin, unmeasured sample', () => {
  const css = `
    h1 { font-size: 18px; font-weight: 700; margin: 20px; }
    h2 { font-size: 16px; font-weight: 600; margin: 20px; }
    p  { font-size: 16px; }
  `;
  const r = critiqueHierarchy(css);
  assert.equal(r.ok, false);
  const ids = r.findings.map((f) => f.id);
  assert.ok(ids.includes('flat-hierarchy'));
  assert.ok(ids.includes('symmetric-heading-margins'));
  assert.ok(ids.includes('no-measure'));
});

test('flags bold-only hierarchy at a single size', () => {
  const css = `
    .a { font-size: 16px; font-weight: 400; }
    .b { font-size: 16px; font-weight: 700; }
  `;
  const ids = critiqueHierarchy(css).findings.map((f) => f.id);
  assert.ok(ids.includes('bold-only-hierarchy'));
});

test('clean, well-built hierarchy passes', () => {
  const css = `
    .display { font-size: 64px; font-weight: 800; line-height: 1.05; margin-top: 0; margin-bottom: 16px; }
    h2 { font-size: 32px; font-weight: 700; line-height: 1.2; margin-top: 48px; margin-bottom: 12px; }
    p { font-size: 18px; font-weight: 400; line-height: 1.6; max-width: 65ch; }
    .meta { font-size: 14px; font-weight: 500; color: #6b7280; }
  `;
  const r = critiqueHierarchy(css);
  assert.equal(r.ok, true, JSON.stringify(r.findings));
});
