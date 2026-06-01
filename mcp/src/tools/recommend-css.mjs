import { resolveAndAnalyze } from '../sources.mjs';
import { FEATURES, describeTag } from '../features.mjs';

// Intent phrase -> OpenType tag. Order matters (longer/more specific first).
const INTENT = [
  [/all[-\s]?small[-\s]?caps|caps to small/, 'c2sc'],
  [/small[-\s]?caps/, 'smcp'],
  [/slashed[-\s]?zero|\bzero\b/, 'zero'],
  [/tabular|monospaced figures|aligned numbers|table numbers/, 'tnum'],
  [/old[-\s]?style|oldstyle|text figures/, 'onum'],
  [/proportional/, 'pnum'],
  [/lining/, 'lnum'],
  [/diagonal fraction|fraction/, 'frac'],
  [/stacked fraction/, 'afrc'],
  [/ordinal/, 'ordn'],
  [/superscript|superior/, 'sups'],
  [/subscript|inferior/, 'subs'],
  [/case[-\s]?sensitive|all[-\s]?caps punctuation|uppercase punctuation/, 'case'],
  [/discretionary ligature/, 'dlig'],
  [/ligature/, 'liga'],
];

// tag -> [property, keyword]. Numeric tags collapse into one font-variant-numeric.
const TAG_DECL = {
  tnum: ['font-variant-numeric', 'tabular-nums'],
  onum: ['font-variant-numeric', 'oldstyle-nums'],
  lnum: ['font-variant-numeric', 'lining-nums'],
  pnum: ['font-variant-numeric', 'proportional-nums'],
  zero: ['font-variant-numeric', 'slashed-zero'],
  frac: ['font-variant-numeric', 'diagonal-fractions'],
  afrc: ['font-variant-numeric', 'stacked-fractions'],
  ordn: ['font-variant-numeric', 'ordinal'],
  smcp: ['font-variant-caps', 'small-caps'],
  c2sc: ['font-variant-caps', 'all-small-caps'],
  sups: ['font-variant-position', 'super'],
  subs: ['font-variant-position', 'sub'],
  liga: ['font-variant-ligatures', 'common-ligatures'],
  dlig: ['font-variant-ligatures', 'discretionary-ligatures'],
  case: ['font-feature-settings', '"case" 1'],
};

function tagsFromIntent(intent) {
  const tags = [];
  const text = intent.toLowerCase();
  for (const [re, tag] of INTENT) if (re.test(text) && !tags.includes(tag)) tags.push(tag);
  return tags;
}

function buildCss(tags) {
  const numeric = [];
  const others = [];
  for (const tag of tags) {
    const decl = TAG_DECL[tag];
    if (!decl) continue;
    if (decl[0] === 'font-variant-numeric') numeric.push(decl[1]);
    else others.push(decl);
  }
  const lines = [];
  if (numeric.length) lines.push(`font-variant-numeric: ${numeric.join(' ')};`);
  for (const [prop, kw] of others) lines.push(`${prop}: ${kw};`);
  return lines.join('\n');
}

export default {
  name: 'recommend_css',
  description:
    'Turn a plain-language typographic intent ("tabular figures and a slashed zero", ' +
    '"real small caps for acronyms") into the correct font-variant-* CSS, verified against ' +
    'the font. Features the font does not carry are reported as unavailable instead of being ' +
    'emitted as CSS that silently fails. The generate-side partner to check_css.',
  inputSchema: {
    type: 'object',
    properties: {
      intent: { type: 'string', description: 'What you want, in plain language.' },
      font: { type: 'string', description: 'Google family name, font URL, or installed family name.' },
      source: { type: 'string', enum: ['google', 'url', 'installed'] },
      weight: { type: 'number' },
      style: { type: 'string', enum: ['normal', 'italic'] },
    },
    required: ['intent', 'font'],
  },
  async handler({ intent, font, source, weight, style }) {
    const wanted = tagsFromIntent(intent);
    if (!wanted.length) {
      return { intent, recognized: [], note: 'No known OpenType features matched this intent.' };
    }
    const r = await resolveAndAnalyze(font, { source, weight, style });
    const set = new Set(r.featureTags);
    const available = wanted.filter((t) => set.has(t) || FEATURES[t]?.whenMissing === 'default');
    const unavailable = wanted.filter((t) => !available.includes(t));

    return {
      font: r.family,
      servedUrl: r.servedUrl,
      recognized: wanted.map(describeTag),
      css: available.length ? buildCss(available) : '',
      available: available.map(describeTag),
      unavailable: unavailable.map((t) => ({
        feature: describeTag(t),
        why: `${r.family} does not carry "${t}"; emitting this CSS would silently do nothing. Pick a font that ships it (try find_fonts).`,
      })),
    };
  },
};
