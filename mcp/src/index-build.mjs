// Build the cross-source discovery index: fetch + analyze a seed set of Google families
// and write data/feature-index.json with each font's REAL features and axes. Run via
// `npm run build:index` (needs network). No upstream publishes per-feature GSUB data, so
// we generate it ourselves; this file is the moat and its maintenance cost.
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchGoogle } from './adapters/google.mjs';
import { analyzeBuffer } from './analyzer.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, '../data');

async function seedFamilies() {
  const sl = JSON.parse(await readFile(join(DATA, 'font-shortlist.json'), 'utf8'));
  const set = new Set();
  for (const d of Object.values(sl.directions)) {
    d.display.forEach((f) => set.add(f));
    d.text.forEach((f) => set.add(f));
  }
  // A few more common families so discovery has range out of the box.
  for (const f of [
    'Source Serif 4', 'Lora', 'Merriweather', 'EB Garamond', 'Cormorant',
    'Crimson Pro', 'Work Sans', 'Nunito Sans', 'Libre Franklin', 'Manrope',
    'Roboto Flex', 'Recursive', 'Fraunces', 'Inter',
  ]) set.add(f);
  return [...set];
}

export async function buildIndex({ log = () => {} } = {}) {
  const families = await seedFamilies();
  const fonts = {};
  for (const fam of families) {
    try {
      const { buffer, servedUrl } = await fetchGoogle(fam);
      const r = await analyzeBuffer(buffer, { servedUrl });
      fonts[fam] = {
        family: r.family || fam,
        source: 'google',
        servedUrl,
        features: r.featureTags,
        axes: r.axes.map((a) => a.tag),
      };
      log(`indexed ${fam}: ${r.featureTags.length} features, ${r.axes.length} axes`);
    } catch (e) {
      log(`skip ${fam}: ${e.message}`);
    }
  }
  await mkdir(DATA, { recursive: true });
  await writeFile(join(DATA, 'feature-index.json'), JSON.stringify({ fonts }, null, 0));
  return fonts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildIndex({ log: (m) => console.error(m) }).then((f) =>
    console.error(`feature-index.json written: ${Object.keys(f).length} families`),
  );
}
