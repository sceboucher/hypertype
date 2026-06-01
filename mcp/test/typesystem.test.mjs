import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTypeSystem, emitCss, fluidClamp, CONTEXTS } from '../src/typesystem.mjs';

test('context sets the ratio: dashboards tight, marketing wide', () => {
  assert.ok(buildTypeSystem({ context: 'dashboard' }).ratio < buildTypeSystem({ context: 'marketing' }).ratio);
});

test('every context produces ordered role tokens', () => {
  for (const ctx of Object.keys(CONTEXTS)) {
    const sys = buildTypeSystem({ context: ctx });
    const sizes = sys.tokens.map((t) => t.size.px);
    const sorted = [...sizes].sort((a, b) => a - b);
    assert.deepEqual(sizes, sorted, `${ctx} tokens should ascend by size`);
    assert.ok(sys.tokens.find((t) => t.role === 'body'));
    assert.ok(sys.tokens.find((t) => t.role === 'display'));
  }
});

test('display leading is tighter than body leading', () => {
  const sys = buildTypeSystem({ context: 'editorial' });
  const body = sys.tokens.find((t) => t.role === 'body');
  const display = sys.tokens.find((t) => t.role === 'display');
  assert.ok(display.lineHeight < body.lineHeight);
});

test('fluid clamp is rem-safe: preferred value mixes rem and vw', () => {
  const clamp = fluidClamp(24, 48);
  assert.match(clamp, /^clamp\(/);
  const preferred = clamp.split(',')[1];
  assert.match(preferred, /rem/);
  assert.match(preferred, /vw/);
});

test('fluid contexts attach a clamp to display roles', () => {
  const sys = buildTypeSystem({ context: 'marketing' });
  assert.ok(sys.tokens.find((t) => t.role === 'display').fluidSize);
});

test('emitCss produces custom properties and a measure', () => {
  const css = emitCss(buildTypeSystem({ context: 'docs' }));
  assert.match(css, /--text-body-size/);
  assert.match(css, /--measure:/);
});
