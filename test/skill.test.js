import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { extractPasteBlock, stripComments, FRONTMATTER, buildInlineBundle } from '../build/generate.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test('extractPasteBlock returns only the content between the markers', () => {
  const src = 'intro\n<!-- PASTE-BLOCK:START -->\nKEEP ME\n<!-- PASTE-BLOCK:END -->\nouter';
  assert.equal(extractPasteBlock(src), 'KEEP ME');
});

test('stripComments removes HTML comments (so markers/notes never reach output)', () => {
  const src = '<!-- a -->visible<!-- PASTE-BLOCK:START -->text';
  assert.equal(stripComments(src), 'visibletext');
});

test('FRONTMATTER declares an agent-skill name and a trigger-rich description', () => {
  assert.match(FRONTMATTER, /name:\s*hypertype/);
  assert.match(FRONTMATTER, /description:\s*.+/);
  assert.ok(/typograph/i.test(FRONTMATTER), 'description should mention typography for triggering');
});

test('the inline bundle JS parses as a classic script and exposes slabAll', () => {
  const slabJs = readFileSync(join(root, 'src/slab.js'), 'utf8');
  const bundle = buildInlineBundle('', slabJs);
  // Pull the <script> body and confirm it evaluates without module syntax errors.
  const code = bundle.slice(bundle.indexOf('<script>') + 8, bundle.indexOf('</script>'))
    .replace(/slabAll\('\[data-slab\]'\);/, ''); // drop the DOM auto-run line
  const probe = new Function(`${code}; return typeof slabAll === 'function' && typeof slabify === 'function';`);
  assert.equal(probe(), true);
});

test('buildInlineBundle inlines both the CSS and the slab engine, no module syntax', () => {
  const bundle = buildInlineBundle('.ht{color:red}', 'export function slabAll(){}');
  assert.ok(bundle.includes('.ht{color:red}'), 'bundle missing inlined CSS');
  assert.ok(bundle.includes('function slabAll(){}'), 'bundle missing inlined slab code');
  assert.ok(!/export\s+function/.test(bundle), 'bundle must not contain ES module export syntax');
  assert.ok(bundle.includes('data-slab'), 'bundle missing the slab usage example');
});

// Smoke tests on generated output (present once `npm run build` has run).
test('generated SKILL.md and paste-block.md exist and are coherent', () => {
  const skillPath = join(root, 'skill/SKILL.md');
  const pastePath = join(root, 'skill/paste-block.md');
  if (!existsSync(skillPath) || !existsSync(pastePath)) {
    return; // not yet generated; the build step covers this
  }
  const skill = readFileSync(skillPath, 'utf8');
  const paste = readFileSync(pastePath, 'utf8');
  assert.ok(skill.startsWith('---\n'), 'SKILL.md must open with YAML frontmatter');
  assert.ok(skill.includes('name: hypertype'), 'SKILL.md missing skill name');
  assert.ok(!paste.includes('PASTE-BLOCK'), 'paste-block must not leak marker comments');
  const pasteTokens = Math.round(Buffer.byteLength(paste, 'utf8') / 4);
  assert.ok(pasteTokens <= 900, `paste-block ~${pasteTokens} tokens exceeds 900`);
});
