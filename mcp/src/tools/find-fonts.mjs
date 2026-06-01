import { loadFeatureIndex } from '../index-data.mjs';
import { installedIndex } from '../adapters/local.mjs';

export default {
  name: 'find_fonts',
  description:
    'Discovery: find fonts that actually carry a set of OpenType features (and optionally ' +
    'variable axes) across the sources you have access to. Google results come from a ' +
    'prebuilt verified index; installed/Adobe results come from your machine. Answers ' +
    '"which fonts ship real small caps AND a slashed zero?" honestly, from analyzed files.',
  inputSchema: {
    type: 'object',
    properties: {
      features: {
        type: 'array',
        items: { type: 'string' },
        description: 'OpenType tags that must ALL be present, e.g. ["smcp","zero"].',
      },
      axes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Variable axes that must all be present, e.g. ["wdth"].',
      },
      sources: {
        type: 'array',
        items: { type: 'string', enum: ['google', 'installed'] },
        description: 'Default ["google"]. Add "installed" to include local + Adobe fonts.',
      },
      limit: { type: 'number', description: 'Max results (default 25).' },
    },
    required: ['features'],
  },
  async handler({ features = [], axes = [], sources = ['google'], limit = 25 }) {
    const wantF = features.map((s) => s.toLowerCase());
    const wantA = axes.map((s) => s.toLowerCase());
    const results = [];
    const notes = [];

    if (sources.includes('google')) {
      const idx = await loadFeatureIndex();
      if (!idx) {
        notes.push('Google discovery index not built. Run `npm run build:index` (needs network).');
      } else {
        for (const [name, info] of Object.entries(idx.fonts)) {
          const feats = info.features || [];
          const ax = info.axes || [];
          if (wantF.every((f) => feats.includes(f)) && wantA.every((a) => ax.includes(a)))
            results.push({ family: name, source: 'google' });
        }
      }
    }

    if (sources.includes('installed')) {
      const inst = await installedIndex();
      for (const entry of Object.values(inst.families)) {
        const feats = entry.features || [];
        const ax = entry.axes || [];
        if (wantF.every((f) => feats.includes(f)) && wantA.every((a) => ax.includes(a)))
          results.push({ family: entry.family, source: 'installed' });
      }
    }

    return {
      query: { features: wantF, axes: wantA, sources },
      count: results.length,
      results: results.slice(0, limit),
      ...(results.length > limit ? { truncated: results.length - limit } : {}),
      ...(notes.length ? { notes } : {}),
    };
  },
};
