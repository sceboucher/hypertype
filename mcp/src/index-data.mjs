// Load the prebuilt cross-source feature index (data/feature-index.json), written by
// src/index-build.mjs. Returns null if it has not been built yet.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const FEATURE_INDEX_PATH = join(here, '../data/feature-index.json');

export async function loadFeatureIndex() {
  if (!existsSync(FEATURE_INDEX_PATH)) return null;
  try {
    return JSON.parse(await readFile(FEATURE_INDEX_PATH, 'utf8'));
  } catch {
    return null;
  }
}
