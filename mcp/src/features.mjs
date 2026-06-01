// The single source of truth for OpenType features: what each tag does, whether a
// high-level font-variant-* property maps to it, and what the browser does when the
// font does NOT carry it. check_css, analyze_font, and recommend_css all read this.

// `whenMissing` is the crux of the no-op catcher:
//   'noop'        -> the rule does nothing; the feature silently fails to render.
//   'synthesized' -> the browser fakes it (e.g. scaled capitals for small-caps),
//                    which usually looks worse than a real glyph. A degraded result,
//                    not a clean failure.
//   'default'     -> on by default; absence is rarely what you care about.
export const FEATURES = {
  // Figures (font-variant-numeric). Absent => silent no-op.
  lnum: { label: 'lining figures', kind: 'numeric', whenMissing: 'noop' },
  onum: { label: 'oldstyle figures', kind: 'numeric', whenMissing: 'noop' },
  pnum: { label: 'proportional figures', kind: 'numeric', whenMissing: 'noop' },
  tnum: { label: 'tabular figures', kind: 'numeric', whenMissing: 'noop' },
  frac: { label: 'diagonal fractions', kind: 'numeric', whenMissing: 'noop' },
  afrc: { label: 'stacked fractions', kind: 'numeric', whenMissing: 'noop' },
  ordn: { label: 'ordinals', kind: 'numeric', whenMissing: 'noop' },
  zero: { label: 'slashed zero', kind: 'numeric', whenMissing: 'noop' },

  // Caps (font-variant-caps). Absent => the browser SYNTHESIZES fake (scaled) caps.
  smcp: { label: 'small caps', kind: 'caps', whenMissing: 'synthesized' },
  c2sc: { label: 'capitals to small caps', kind: 'caps', whenMissing: 'synthesized' },
  pcap: { label: 'petite caps', kind: 'caps', whenMissing: 'synthesized' },
  c2pc: { label: 'capitals to petite caps', kind: 'caps', whenMissing: 'synthesized' },
  unic: { label: 'unicase', kind: 'caps', whenMissing: 'noop' },
  titl: { label: 'titling caps', kind: 'caps', whenMissing: 'noop' },

  // Ligatures (font-variant-ligatures).
  liga: { label: 'common ligatures', kind: 'ligature', whenMissing: 'default' },
  clig: { label: 'contextual ligatures', kind: 'ligature', whenMissing: 'default' },
  dlig: { label: 'discretionary ligatures', kind: 'ligature', whenMissing: 'noop' },
  hlig: { label: 'historical ligatures', kind: 'ligature', whenMissing: 'noop' },
  calt: { label: 'contextual alternates', kind: 'ligature', whenMissing: 'default' },

  // Position (font-variant-position). Absent => browser synthesizes by scaling.
  sups: { label: 'superscript', kind: 'position', whenMissing: 'synthesized' },
  subs: { label: 'subscript', kind: 'position', whenMissing: 'synthesized' },

  // Raw-tag-only features (no font-variant-* mapping). Absent => silent no-op.
  case: { label: 'case-sensitive forms', kind: 'misc', whenMissing: 'noop' },
  kern: { label: 'kerning', kind: 'misc', whenMissing: 'default' },
  locl: { label: 'localized forms', kind: 'misc', whenMissing: 'noop' },
  swsh: { label: 'swashes', kind: 'alt', whenMissing: 'noop' },
  cswh: { label: 'contextual swashes', kind: 'alt', whenMissing: 'noop' },
  salt: { label: 'stylistic alternates', kind: 'alt', whenMissing: 'noop' },
  hist: { label: 'historical forms', kind: 'alt', whenMissing: 'noop' },
};

// Stylistic sets and character variants are font-specific (ss01..ss20, cv01..cv99).
export function isStyleSet(tag) {
  return /^ss(0[1-9]|1[0-9]|20)$/.test(tag);
}
export function isCharVariant(tag) {
  return /^cv\d{2}$/.test(tag);
}
export function describeTag(tag) {
  if (FEATURES[tag]) return FEATURES[tag].label;
  if (isStyleSet(tag)) return `stylistic set ${tag}`;
  if (isCharVariant(tag)) return `character variant ${tag}`;
  return tag;
}

// font-variant-* keyword -> the OpenType tag(s) it requests.
// `off: true` means the keyword disables the feature; absence is then irrelevant.
const VARIANT_MAP = {
  'font-variant-numeric': {
    'lining-nums': ['lnum'],
    'oldstyle-nums': ['onum'],
    'proportional-nums': ['pnum'],
    'tabular-nums': ['tnum'],
    'diagonal-fractions': ['frac'],
    'stacked-fractions': ['afrc'],
    'ordinal': ['ordn'],
    'slashed-zero': ['zero'],
  },
  'font-variant-caps': {
    'small-caps': ['smcp'],
    'all-small-caps': ['smcp', 'c2sc'],
    'petite-caps': ['pcap'],
    'all-petite-caps': ['pcap', 'c2pc'],
    'unicase': ['unic'],
    'titling-caps': ['titl'],
  },
  'font-variant-ligatures': {
    'common-ligatures': ['liga', 'clig'],
    'no-common-ligatures': ['liga', { off: true }],
    'discretionary-ligatures': ['dlig'],
    'no-discretionary-ligatures': ['dlig', { off: true }],
    'historical-ligatures': ['hlig'],
    'no-historical-ligatures': ['hlig', { off: true }],
    'contextual': ['calt'],
    'no-contextual': ['calt', { off: true }],
  },
  'font-variant-position': {
    'super': ['sups'],
    'sub': ['subs'],
  },
};

// Resolve a declaration like (property, value) -> [{ tag, off }] of requested tags.
export function tagsFromVariant(property, value) {
  const prop = property.trim().toLowerCase();
  const out = [];
  const map = VARIANT_MAP[prop];
  if (!map) return out;
  for (const token of value.trim().toLowerCase().split(/\s+/)) {
    const mapping = map[token];
    if (!mapping) continue;
    const off = mapping.some((m) => typeof m === 'object' && m.off);
    for (const t of mapping) if (typeof t === 'string') out.push({ tag: t, off });
  }
  return out;
}

// Parse a font-feature-settings value: "tnum" 1, "zero" on, "liga" 0
export function tagsFromFeatureSettings(value) {
  const out = [];
  const re = /["']([A-Za-z0-9]{4})["']\s*(?:(on|off|\d+))?/g;
  let m;
  while ((m = re.exec(value)) !== null) {
    const tag = m[1];
    const setting = (m[2] ?? '1').toLowerCase();
    const off = setting === 'off' || setting === '0';
    out.push({ tag, off });
  }
  return out;
}

// Parse a CSS blob into declarations that request OpenType features. Tolerant of both
// full rules ("h1 { font-variant-numeric: tabular-nums; }") and bare declaration lists.
export function parseTypeDeclarations(css) {
  const decls = [];
  // Strip comments and selectors/braces down to declaration text.
  const flattened = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/[{}]/g, ';');
  for (const chunk of flattened.split(';')) {
    const idx = chunk.indexOf(':');
    if (idx === -1) continue;
    const property = chunk.slice(0, idx).trim().toLowerCase();
    const value = chunk.slice(idx + 1).trim();
    if (!property || !value) continue;
    if (property === 'font-feature-settings') {
      decls.push({ property, value, requested: tagsFromFeatureSettings(value) });
    } else if (VARIANT_MAP[property]) {
      decls.push({ property, value, requested: tagsFromVariant(property, value) });
    }
  }
  return decls;
}
