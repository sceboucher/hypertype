// Read fonts installed on this machine. This is the payoff of running locally: it's
// the only adapter that can see Adobe Fonts (Creative Cloud activates them into a
// CoreSync directory) and anything else the user has installed. A remote server can't.
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { analyzeBuffer } from '../analyzer.mjs';
import { readJsonCache, writeJsonCache } from '../cache.mjs';

export function fontDirs() {
  const p = platform();
  const home = homedir();
  let dirs = [];
  if (p === 'win32') {
    dirs = ['C:\\Windows\\Fonts'];
    if (process.env.LOCALAPPDATA)
      dirs.push(join(process.env.LOCALAPPDATA, 'Microsoft', 'Windows', 'Fonts'));
  } else if (p === 'darwin') {
    dirs = ['/System/Library/Fonts', '/Library/Fonts', join(home, 'Library', 'Fonts')];
  } else {
    dirs = [
      '/usr/share/fonts',
      '/usr/local/share/fonts',
      join(home, '.fonts'),
      join(home, '.local', 'share', 'fonts'),
    ];
  }
  return dirs.filter(existsSync);
}

// The directory Creative Cloud activates synced (Adobe Fonts) faces into.
export function adobeDir() {
  const p = platform();
  const home = homedir();
  let d = null;
  if (p === 'win32' && process.env.APPDATA)
    d = join(process.env.APPDATA, 'Adobe', 'CoreSync', 'plugins', 'livetype', 'r');
  else if (p === 'darwin')
    d = join(home, 'Library', 'Application Support', 'Adobe', 'CoreSync', 'plugins', 'livetype', '.r');
  return d && existsSync(d) ? d : null;
}

async function walk(dir, out, depth) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory() && depth < 2) await walk(full, out, depth + 1);
    else if (e.isFile() && /\.(ttf|otf|ttc|otc)$/i.test(e.name)) out.push(full);
  }
}

async function listFontFiles() {
  const out = [];
  const roots = fontDirs();
  const adobe = adobeDir();
  if (adobe) roots.push(adobe);
  for (const dir of roots) await walk(dir, out, 0);
  return out;
}

// family (lowercased) -> { family, paths: [] }. Built once, cached to disk.
export async function installedIndex({ rebuild = false } = {}) {
  const NAME = 'installed-index.json';
  if (!rebuild) {
    const cached = await readJsonCache(NAME);
    if (cached) return cached;
  }
  const files = await listFontFiles();
  const families = {};
  for (const file of files) {
    try {
      const report = await analyzeBuffer(await readFile(file));
      const fam = report.family;
      if (!fam) continue;
      const key = fam.toLowerCase();
      const entry = (families[key] ??= { family: fam, paths: [], features: [], axes: [] });
      if (!entry.paths.includes(file)) entry.paths.push(file);
      // Cache real features + axes at build time so find_fonts needs no re-analysis.
      for (const tag of report.featureTags) if (!entry.features.includes(tag)) entry.features.push(tag);
      for (const a of report.axes) if (!entry.axes.includes(a.tag)) entry.axes.push(a.tag);
    } catch {
      // Unreadable/proprietary file: skip.
    }
  }
  const index = { builtFiles: files.length, families };
  await writeJsonCache(NAME, index);
  return index;
}

export async function fetchInstalled(name) {
  const idx = await installedIndex();
  const hit = idx.families[name.trim().toLowerCase()];
  if (!hit) {
    throw new Error(
      `No installed font named "${name}". Use the exact installed family name, ` +
        `or pass a Google family name / direct URL instead.`,
    );
  }
  return { buffer: await readFile(hit.paths[0]), servedUrl: `file://${hit.paths[0]}` };
}

export function localSourcesInfo() {
  const adobe = adobeDir();
  return { platform: platform(), dirs: fontDirs(), adobeActivated: !!adobe };
}
