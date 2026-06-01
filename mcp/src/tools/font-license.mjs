import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveAndAnalyze } from '../sources.mjs';

const here = dirname(fileURLToPath(import.meta.url));

export default {
  name: 'font_license',
  description:
    'Report whether a font is safe to self-host and ship in a real repo: OFL / Apache ' +
    '(freely self-hostable) vs Adobe Fonts (web-use via Adobe\'s CDN only, cannot self-host) ' +
    'vs unknown (verify with the foundry). Resolves the real family name first so a renamed ' +
    'or installed file still matches.',
  inputSchema: {
    type: 'object',
    properties: {
      font: { type: 'string', description: 'Family name, font URL, or installed family name.' },
      source: { type: 'string', enum: ['google', 'url', 'installed'] },
    },
    required: ['font'],
  },
  async handler({ font, source }) {
    const table = JSON.parse(await readFile(join(here, '../../data/licenses.json'), 'utf8'));

    let family = String(font);
    let servedUrl = null;
    let fromAdobe = false;
    try {
      const r = await resolveAndAnalyze(font, { source });
      family = r.family || family;
      servedUrl = r.servedUrl;
      fromAdobe = typeof servedUrl === 'string' && /CoreSync|livetype/i.test(servedUrl);
    } catch {
      // Fall back to name-only lookup.
    }

    let cls = table.families[family.toLowerCase()] || 'verify';
    if (fromAdobe) cls = 'adobe';

    return {
      family,
      servedUrl,
      license: cls,
      selfHostable: cls === 'ofl' || cls === 'apache',
      explanation: table.classes[cls],
    };
  },
};
