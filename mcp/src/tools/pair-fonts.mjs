import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveAndAnalyze } from '../sources.mjs';

const here = dirname(fileURLToPath(import.meta.url));

export default {
  name: 'pair_fonts',
  description:
    'Suggest a display + text pairing where BOTH fonts actually carry the OpenType features ' +
    'you need (e.g. a headline face with real small caps + a body face with oldstyle ' +
    'figures), drawn from a de-AI\'d shortlist and verified against the served files. High ' +
    'typeface contrast by construction (serif + grotesque, display + text).',
  inputSchema: {
    type: 'object',
    properties: {
      direction: {
        type: 'string',
        description: 'Aesthetic direction: editorial, technical, grotesque, humanist, expressive-display, serif-display, code.',
      },
      features: {
        type: 'array',
        items: { type: 'string' },
        description: 'OpenType tags both fonts should carry, e.g. ["onum"] for text, ["smcp"] for display.',
      },
      verify: { type: 'boolean', description: 'Analyze the served files to confirm features (default true).' },
    },
  },
  async handler({ direction = 'editorial', features = [], verify = true }) {
    const sl = JSON.parse(await readFile(join(here, '../../data/font-shortlist.json'), 'utf8'));
    const d = sl.directions[direction];
    if (!d) {
      return {
        error: `Unknown direction "${direction}".`,
        available: Object.keys(sl.directions),
      };
    }

    const pair = { direction, display: d.display[0], text: d.text[0], alternates: d, contrast: 'Display + text contrast for a clear primary; both from one curated family set.' };
    const want = features.map((s) => s.toLowerCase());

    if (verify && want.length) {
      pair.verification = {};
      for (const slot of ['display', 'text']) {
        try {
          const r = await resolveAndAnalyze(pair[slot]);
          const missing = want.filter((t) => !r.featureTags.includes(t));
          pair.verification[slot] = {
            family: r.family,
            carries: want.filter((t) => r.featureTags.includes(t)),
            missing,
            ok: missing.length === 0,
          };
        } catch (e) {
          pair.verification[slot] = { family: pair[slot], error: e.message };
        }
      }
    }

    return pair;
  },
};
