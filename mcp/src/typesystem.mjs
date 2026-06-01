// Generate a coherent type system: a context-appropriate scale, role tokens (size +
// line-height + weight + tracking), a rem-safe fluid clamp() per display role, and the
// OpenType features that context calls for. The "build the system" half of the
// build-then-break discipline. See docs/TYPE-SYSTEMS.md.

// Scale ratio + density posture per context. Tighten as density rises, widen as the
// surface gets expressive.
export const CONTEXTS = {
  dashboard: { ratio: 1.2, base: 14, body: 1.4, display: 1.2, fluid: false,
    note: 'Data-dense: tight ratio, small body, data as hero, hierarchy via weight + value.' },
  app: { ratio: 1.2, base: 15, body: 1.5, display: 1.2, fluid: false,
    note: 'Product UI: restrained scale, consistent role tokens.' },
  default: { ratio: 1.25, base: 16, body: 1.5, display: 1.2, fluid: false,
    note: 'Balanced default when context is unknown.' },
  docs: { ratio: 1.25, base: 16, body: 1.6, display: 1.25, fluid: false,
    note: 'Scannable: strict, predictable heading steps; space-before >> space-after.' },
  content: { ratio: 1.333, base: 18, body: 1.6, display: 1.2, fluid: true,
    note: 'Content site: confident hierarchy, comfortable reading.' },
  editorial: { ratio: 1.414, base: 19, body: 1.7, display: 1.15, fluid: true,
    note: 'Long-form: generous leading, wide measure, room for drop caps and oldstyle figures.' },
  marketing: { ratio: 1.5, base: 17, body: 1.5, display: 1.05, fluid: true,
    note: 'Marketing: dramatic contrast, one hero, eyebrow -> headline -> dek.' },
  landing: { ratio: 1.6, base: 17, body: 1.5, display: 1.02, fluid: true,
    note: 'Landing: maximal contrast, a single enormous hero headline.' },
};

// OpenType features each context should turn on (and where).
export const CONTEXT_FEATURES = {
  dashboard: ['tabular-nums on numeric columns', 'slashed-zero on IDs/codes'],
  app: ['tabular-nums on numeric columns', 'slashed-zero on IDs/codes'],
  default: ['tabular-nums on tables', 'slashed-zero on IDs/money'],
  docs: ['tabular-nums on tables', 'slashed-zero on code/IDs'],
  content: ['oldstyle-nums in prose', 'common-ligatures', 'all-small-caps on acronyms'],
  editorial: ['oldstyle-nums in prose', 'all-small-caps on acronyms', 'diagonal-fractions (scoped)',
    'hanging punctuation', 'drop cap on lead paragraph'],
  marketing: ['case-sensitive forms on all-caps', 'tabular-nums on stats'],
  landing: ['case-sensitive forms on all-caps', 'tabular-nums on stats'],
};

const ROLES = [
  { role: 'caption', step: -2, weight: 400, leading: 'body', tracking: 0.005 },
  { role: 'label', step: -1, weight: 500, leading: 'body', tracking: 0.04 },
  { role: 'body', step: 0, weight: 400, leading: 'body', tracking: 0 },
  { role: 'title', step: 1, weight: 600, leading: 'mid', tracking: 0 },
  { role: 'headline', step: 2, weight: 700, leading: 'display', tracking: -0.005 },
  { role: 'display', step: 3, weight: 800, leading: 'display', tracking: -0.01 },
];

function round(n, p = 0) {
  const f = 10 ** p;
  return Math.round(n * f) / f;
}

// Rem-safe fluid size: the preferred value mixes rem + vw, so user zoom survives
// (a pure-vw preferred value breaks WCAG 1.4.4). Utopia two-anchor method.
export function fluidClamp(minPx, maxPx, minVw = 320, maxVw = 1240) {
  const slope = (maxPx - minPx) / (maxVw - minVw);
  const vw = round(slope * 100, 2);
  const remIntercept = round((minPx - slope * minVw) / 16, 3);
  return `clamp(${round(minPx / 16, 3)}rem, ${remIntercept}rem + ${vw}vw, ${round(maxPx / 16, 3)}rem)`;
}

export function buildTypeSystem({ context = 'default' } = {}) {
  const c = CONTEXTS[context] || CONTEXTS.default;
  const r = c.ratio;
  const displayStep = context === 'marketing' || context === 'landing' ? 4 : 3;

  const tokens = ROLES.map((role) => {
    const step = role.role === 'display' ? displayStep : role.step;
    const px = round(c.base * r ** step);
    const leading = role.leading === 'body' ? c.body : role.leading === 'display' ? c.display : round((c.body + c.display) / 2, 2);
    const token = {
      role: role.role,
      size: { px, rem: round(px / 16, 3) },
      lineHeight: leading,
      weight: role.weight,
      letterSpacing: role.tracking ? `${role.tracking}em` : 'normal',
    };
    // Fluid display/headline where the context wants it.
    if (c.fluid && step >= 2) {
      const maxPx = round(c.base * (r + 0.067) ** step);
      token.fluidSize = fluidClamp(px, maxPx);
    }
    return token;
  });

  return {
    context,
    ratio: r,
    baseSize: c.base,
    posture: c.note,
    leading: { body: c.body, display: c.display },
    measure: context === 'editorial' || context === 'content' ? '70ch' : '65ch',
    tokens,
    features: CONTEXT_FEATURES[context] || CONTEXT_FEATURES.default,
    breakRule:
      'Follow these role tokens by default. Override only at the component layer with a ' +
      'named reason (hero, table, pull-quote), never by scattering arbitrary font-size values.',
  };
}

export function emitCss(system) {
  const lines = [':root {'];
  for (const t of system.tokens) {
    const size = t.fluidSize || `${t.size.rem}rem`;
    lines.push(`  --text-${t.role}-size: ${size};`);
    lines.push(`  --text-${t.role}-leading: ${t.lineHeight};`);
    lines.push(`  --text-${t.role}-weight: ${t.weight};`);
    if (t.letterSpacing !== 'normal') lines.push(`  --text-${t.role}-tracking: ${t.letterSpacing};`);
  }
  lines.push(`  --measure: ${system.measure};`);
  lines.push('}');
  return lines.join('\n');
}
