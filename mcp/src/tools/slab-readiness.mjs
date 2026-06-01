import { resolveAndAnalyze } from '../sources.mjs';

export default {
  name: 'slab_readiness',
  description:
    'Check whether a font can drive the authentic justified-slab headline (every line the ' +
    'same cap-height, stretched to the column via the width axis) instead of the per-line ' +
    'font-size scaling fallback. Reports whether the font ships a wdth (width) axis and its ' +
    'range, and recommends the slab.js mode to use.',
  inputSchema: {
    type: 'object',
    properties: {
      font: { type: 'string', description: 'Google family name, font URL, or installed family name.' },
      source: { type: 'string', enum: ['google', 'url', 'installed'] },
    },
    required: ['font'],
  },
  async handler({ font, source }) {
    const r = await resolveAndAnalyze(font, { source });
    const wdth = r.axes.find((a) => a.tag === 'wdth');
    return {
      font: r.family,
      servedUrl: r.servedUrl,
      widthAxis: !!wdth,
      ...(wdth ? { range: { min: wdth.min, default: wdth.default, max: wdth.max } } : {}),
      recommendedMode: wdth ? 'width' : 'size',
      note: wdth
        ? `Ships a width axis (${wdth.min}-${wdth.max}). Use slab.js mode:'width' for the authentic same-cap-height slab.`
        : 'No width axis. slab.js will scale font-size per line (mode:\'size\'), which still works but lines vary in cap-height.',
    };
  },
};
