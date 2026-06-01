// Tiny content cache: fetched font files land on disk so repeated checks (and the
// discovery index build) don't re-download. Keyed by a hash of the source string.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CACHE_DIR =
  process.env.HYPERTYPE_CACHE_DIR || join(tmpdir(), 'hypertype-mcp-cache');

export function keyFor(s) {
  return createHash('sha256').update(s).digest('hex').slice(0, 32);
}

// Return a cached buffer for `id`, or call `fetcher()` once and cache the result.
export async function cachedBuffer(id, fetcher) {
  await mkdir(CACHE_DIR, { recursive: true });
  const file = join(CACHE_DIR, keyFor(id) + '.font');
  if (existsSync(file)) return readFile(file);
  const buf = await fetcher();
  await writeFile(file, buf);
  return buf;
}

// Read/write a small JSON blob in the cache dir (used for the installed-font index).
export async function readJsonCache(name) {
  const file = join(CACHE_DIR, name);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}
export async function writeJsonCache(name, data) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(join(CACHE_DIR, name), JSON.stringify(data));
}
