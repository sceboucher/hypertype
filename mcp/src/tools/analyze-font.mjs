import { resolveAndAnalyze } from '../sources.mjs';

export default {
  name: 'analyze_font',
  description:
    'Report the OpenType features and variable axes a font ACTUALLY ships by analyzing ' +
    'the real served file, not the foundry spec. Accepts a Google Fonts family name, a ' +
    'direct woff2/ttf/otf URL, or an installed family name. Use this before writing ' +
    'font-variant-* CSS so the features you turn on actually render. Automatically ' +
    'catches the Google Fonts reduced-subset gotcha (e.g. Source Serif 4 served without ' +
    'small caps or a slashed zero).',
  inputSchema: {
    type: 'object',
    properties: {
      font: {
        type: 'string',
        description:
          'Google Fonts family name (e.g. "Source Serif 4"), a direct font URL, or an installed family name.',
      },
      source: {
        type: 'string',
        enum: ['google', 'url', 'installed'],
        description: 'Force a source. Default: URL if it looks like one, otherwise Google Fonts.',
      },
      weight: { type: 'number', description: 'Weight to request from Google (default 400).' },
      style: { type: 'string', enum: ['normal', 'italic'], description: 'Default normal.' },
      subset: { type: 'string', description: 'Preferred Google subset, e.g. "latin".' },
    },
    required: ['font'],
  },
  async handler({ font, source, weight, style, subset }) {
    const r = await resolveAndAnalyze(font, { source, weight, style, subset });
    return {
      family: r.family,
      servedUrl: r.servedUrl,
      source: r.source,
      isVariable: r.isVariable,
      axes: r.axes,
      summary: r.summary,
      figureStyles: r.figureStyles,
      features: r.features,
    };
  },
};
