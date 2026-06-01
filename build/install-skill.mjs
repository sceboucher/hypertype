// Install the generated skill into your Claude Code personal skills dir
// so it registers as the /hypertype slash command. Re-run after `npm run build`.
// Override the target with HYPERTYPE_SKILL_DIR if your skills live elsewhere.
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, 'skill');
const target = process.env.HYPERTYPE_SKILL_DIR || join(homedir(), '.claude', 'skills', 'hypertype');

if (!existsSync(join(src, 'SKILL.md'))) {
  console.error('skill/SKILL.md not found, run `npm run build` first.');
  process.exit(1);
}

mkdirSync(target, { recursive: true });
// Replace the installed copy so removed files don't linger.
for (const entry of ['SKILL.md', 'paste-block.md', 'references', 'assets']) {
  const from = join(src, entry);
  const to = join(target, entry);
  if (!existsSync(from)) continue;
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

console.log(`Installed hypertype skill -> ${target}`);
