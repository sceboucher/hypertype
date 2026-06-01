import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tagsFromVariant,
  tagsFromFeatureSettings,
  parseTypeDeclarations,
  describeTag,
  isStyleSet,
  isCharVariant,
} from '../src/features.mjs';

test('font-variant-numeric keywords map to tags', () => {
  const tags = tagsFromVariant('font-variant-numeric', 'tabular-nums slashed-zero');
  assert.deepEqual(tags.map((t) => t.tag).sort(), ['tnum', 'zero']);
});

test('all-small-caps expands to smcp + c2sc', () => {
  const tags = tagsFromVariant('font-variant-caps', 'all-small-caps').map((t) => t.tag).sort();
  assert.deepEqual(tags, ['c2sc', 'smcp']);
});

test('no-common-ligatures marks the tag as off', () => {
  const tags = tagsFromVariant('font-variant-ligatures', 'no-common-ligatures');
  assert.equal(tags[0].tag, 'liga');
  assert.equal(tags[0].off, true);
});

test('font-feature-settings parses tags and on/off', () => {
  const tags = tagsFromFeatureSettings('"tnum" 1, "zero" on, "liga" 0');
  assert.deepEqual(tags, [
    { tag: 'tnum', off: false },
    { tag: 'zero', off: false },
    { tag: 'liga', off: true },
  ]);
});

test('parseTypeDeclarations handles full rules and bare declarations', () => {
  const fromRule = parseTypeDeclarations('h1 { font-variant-numeric: tabular-nums; color: red; }');
  assert.equal(fromRule.length, 1);
  assert.equal(fromRule[0].requested[0].tag, 'tnum');

  const bare = parseTypeDeclarations('font-variant-caps: small-caps');
  assert.equal(bare[0].requested[0].tag, 'smcp');
});

test('stylistic set and character variant detection', () => {
  assert.ok(isStyleSet('ss01'));
  assert.ok(isStyleSet('ss20'));
  assert.ok(!isStyleSet('ss21'));
  assert.ok(isCharVariant('cv11'));
  assert.equal(describeTag('ss03'), 'stylistic set ss03');
  assert.equal(describeTag('tnum'), 'tabular figures');
});
