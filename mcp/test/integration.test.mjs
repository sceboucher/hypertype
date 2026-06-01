// Network-dependent goldens. Skipped automatically when offline so the suite still
// passes without a connection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAndAnalyze } from '../src/sources.mjs';
import checkCss from '../src/tools/check-css.mjs';

async function online() {
  try {
    await resolveAndAnalyze('Source Serif 4');
    return true;
  } catch {
    return false;
  }
}

test('analyze: Google Source Serif 4 latin ships tabular figures but not small caps', async (t) => {
  if (!(await online())) return t.skip('offline');
  const r = await resolveAndAnalyze('Source Serif 4');
  assert.equal(r.summary.tabularFigures, true);
  assert.equal(r.summary.smallCaps, false);
  assert.equal(r.summary.slashedZero, false);
});

test('check_css: catches the small-caps degrade and slashed-zero no-op on Source Serif 4', async (t) => {
  if (!(await online())) return t.skip('offline');
  const v = await checkCss.handler({
    css: 'h1{font-variant-caps:small-caps} td{font-variant-numeric:tabular-nums slashed-zero}',
    font: 'Source Serif 4',
  });
  assert.equal(v.ok, false);
  const byTag = Object.fromEntries(v.findings.map((f) => [f.tag, f.verdict]));
  assert.equal(byTag.smcp, 'degraded');
  assert.equal(byTag.tnum, 'resolves');
  assert.equal(byTag.zero, 'no-op');
});
