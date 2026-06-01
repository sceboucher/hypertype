// Generator: emit skill/SKILL.md (full body) and skill/paste-block.md (the
// condensed PASTE-BLOCK region) from skill/canonical.md, so the two carriers
// never drift. Dev-only; never ships to client or artifact.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const FRONTMATTER = `---
name: hypertype
description: Use whenever generating or styling HTML/CSS or web UI and the typography should look intentional rather than default, especially justified display headlines (the magazine slab effect, which pure CSS cannot do), and underused OpenType features (tabular/oldstyle/slashed-zero figures, true small caps, fractions, case-sensitive forms, ligatures), plus modular type scale, readable measure, text-wrap balance/pretty, drop caps, hanging punctuation, and variable fonts. Reach for this for landing pages, headlines, hero sections, editorial layouts, data tables, and any "make the type nicer / less generic / more editorial" request, even when the user does not say "typography". Inline-first and portable across Claude (Code, Design, Cowork, Desktop) and other AI coding tools (works in artifact sandboxes with no build step). The kit is hypertype.css + slab.js + micro.js.
---`;

export function stripComments(src) {
  return src.replace(/<!--[\s\S]*?-->/g, '');
}

export function extractPasteBlock(src) {
  const m = src.match(/<!--\s*PASTE-BLOCK:START\s*-->([\s\S]*?)<!--\s*PASTE-BLOCK:END\s*-->/);
  if (!m) throw new Error('PASTE-BLOCK markers not found in canonical source');
  return m[1].trim();
}

export function buildSkill(canonical) {
  return `${FRONTMATTER}\n\n${stripComments(canonical).trim()}\n\n> Deep reference (browser-support table, full OpenType tag catalog, slab.js algorithm): see REFERENCE.md. Kit files: hypertype.css, slab.js.\n`;
}

export function buildPasteBlock(canonical) {
  const body = extractPasteBlock(canonical);
  return `<!-- hypertype advanced-typography guidance, paste into project/system instructions.\n     Generated from skill/canonical.md; do not edit by hand. -->\n\n${body}\n`;
}

// A VS Code / GitHub Copilot custom-instructions file. The "Install in VS Code"
// button (vscode:chat-instructions/install) points at this. Same guidance as
// the paste-block, with the frontmatter VS Code expects.
export function buildVsCodeInstructions(canonical) {
  const body = extractPasteBlock(canonical);
  return `---
description: 'hypertype: intentional web typography, justified display headlines and the underused OpenType features.'
applyTo: '**/*.{html,htm,css,scss,less,jsx,tsx,vue,svelte,astro,md,mdx}'
---

${body}
`;
}

// A single self-contained, paste-anywhere bundle: the CSS + the slab engine
// inlined into one HTML skeleton. This is the portable artifact-sandbox path.
// slab.js uses ES export syntax; strip it for a classic (non-module) <script>.
export function buildInlineBundle(css, slabJs) {
  const classic = slabJs.replace(/^export\s+/gm, '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>hypertype inline bundle</title>
<!-- 1. The CSS core. Put class="ht" on a wrapper; use ht-* utilities. -->
<style>
${css.trim()}
</style>
</head>
<body class="ht">

  <!-- 2. A justified display headline. -->
  <h1 data-slab>Replace this with your headline</h1>

  <!-- 3. The slab engine, inlined. No build step, no network. -->
  <script>
${classic.trim()}

// Auto-run on any [data-slab] element.
slabAll('[data-slab]');
  </script>
</body>
</html>
`;
}

function main() {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const canonical = readFileSync(join(root, 'skill/canonical.md'), 'utf8');
  const css = readFileSync(join(root, 'src/hypertype.css'), 'utf8');
  const slabJs = readFileSync(join(root, 'src/slab.js'), 'utf8');
  const microJs = readFileSync(join(root, 'src/micro.js'), 'utf8');

  // Skill carriers.
  writeFileSync(join(root, 'skill/SKILL.md'), buildSkill(canonical));
  writeFileSync(join(root, 'skill/paste-block.md'), buildPasteBlock(canonical));

  // Make the skill folder a self-contained, installable unit.
  mkdirSync(join(root, 'skill/references'), { recursive: true });
  mkdirSync(join(root, 'skill/assets'), { recursive: true });
  copyFileSync(join(root, 'docs/REFERENCE.md'), join(root, 'skill/references/REFERENCE.md'));
  copyFileSync(join(root, 'docs/TYPE-SYSTEMS.md'), join(root, 'skill/references/TYPE-SYSTEMS.md'));
  copyFileSync(join(root, 'docs/HIERARCHY.md'), join(root, 'skill/references/HIERARCHY.md'));
  copyFileSync(join(root, 'src/hypertype.css'), join(root, 'skill/assets/hypertype.css'));
  copyFileSync(join(root, 'src/slab.js'), join(root, 'skill/assets/slab.js'));
  copyFileSync(join(root, 'src/micro.js'), join(root, 'skill/assets/micro.js'));

  // Distributable inline bundle + the optional micro pass as a classic script.
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist/hypertype-inline.html'), buildInlineBundle(css, slabJs));
  writeFileSync(join(root, 'dist/hypertype-micro.js'), microJs.replace(/^export\s+/gm, ''));
  writeFileSync(join(root, 'dist/hypertype.instructions.md'), buildVsCodeInstructions(canonical));

  // Claude Code plugin layout: plugin/skills/<name>/ for `/plugin install`.
  const pluginSkill = join(root, 'plugin/skills/hypertype');
  rmSync(pluginSkill, { recursive: true, force: true });
  mkdirSync(pluginSkill, { recursive: true });
  copyFileSync(join(root, 'skill/SKILL.md'), join(pluginSkill, 'SKILL.md'));
  cpSync(join(root, 'skill/references'), join(pluginSkill, 'references'), { recursive: true });
  cpSync(join(root, 'skill/assets'), join(pluginSkill, 'assets'), { recursive: true });

  const tokens = Math.round(Buffer.byteLength(buildPasteBlock(canonical), 'utf8') / 4);
  console.log(`Generated skill (SKILL.md, paste-block ~${tokens} tokens) + plugin/skills/hypertype + dist/hypertype-inline.html`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
