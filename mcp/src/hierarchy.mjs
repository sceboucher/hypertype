// Detect the known AI typographic-hierarchy tells from rendered CSS. Pure string work,
// no dependencies. Each finding maps to a rule in docs/HIERARCHY.md and carries a fix.
//
// The tells (from the research): flat hierarchy, bold-only hierarchy, sub-1.2x size
// steps, symmetric heading margins (should bind DOWN: space-before > space-after),
// more than ~5 distinct text styles, one global line-height across display + body,
// and runaway measure on long-form text.

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

export function parseRules(css) {
  const rules = [];
  const re = /([^{}]+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(stripComments(css))) !== null) {
    const selectors = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    const decls = {};
    for (const part of m[2].split(';')) {
      const i = part.indexOf(':');
      if (i === -1) continue;
      decls[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
    }
    for (const sel of selectors) rules.push({ selector: sel, decls });
  }
  return rules;
}

export function toPx(value) {
  if (!value) return null;
  const v = String(value).trim();
  const clamp = v.match(/clamp\(([^,]+),([^,]+),([^)]+)\)/i);
  if (clamp) {
    const max = toPx(clamp[3]);
    return max ? { px: max.px, fluid: true } : null;
  }
  const m = v.match(/^(-?[\d.]+)(px|rem|em|pt)?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const unit = m[2] || 'px';
  if (unit === 'rem' || unit === 'em') n *= 16;
  if (unit === 'pt') n *= 4 / 3;
  return { px: n, fluid: false };
}

export function toWeight(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (v === 'normal') return 400;
  if (v === 'bold') return 700;
  if (v === 'lighter') return 300;
  if (v === 'bolder') return 700;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function isHeading(sel) {
  return /(^|[\s,>+~])h[1-6]\b/i.test(sel) || /(title|heading|headline|display|eyebrow|kicker)/i.test(sel);
}
function isBodyish(sel) {
  return /(^|[\s,>+~])(p|article|body)\b/i.test(sel) || /(prose|body|content|copy|measure)/i.test(sel);
}

// margin-top / margin-bottom, honoring the `margin:` shorthand (1-4 values).
function blockMargins(decls) {
  let top = null;
  let bottom = null;
  if (decls.margin) {
    const parts = decls.margin.trim().split(/\s+/).map((p) => toPx(p)?.px ?? null);
    if (parts.length === 1) [top, bottom] = [parts[0], parts[0]];
    else if (parts.length === 2) [top, bottom] = [parts[0], parts[0]];
    else if (parts.length >= 3) [top, bottom] = [parts[0], parts[2]];
  }
  if (decls['margin-top'] != null) top = toPx(decls['margin-top'])?.px ?? top;
  if (decls['margin-bottom'] != null) bottom = toPx(decls['margin-bottom'])?.px ?? bottom;
  return { top, bottom };
}

export function critiqueHierarchy(css) {
  const rules = parseRules(css).map((r) => ({
    selector: r.selector,
    size: toPx(r.decls['font-size']),
    weight: toWeight(r.decls['font-weight']),
    lineHeight: r.decls['line-height'] ? parseFloat(r.decls['line-height']) : null,
    color: r.decls.color ?? null,
    maxWidth: r.decls['max-width'] ?? null,
    margins: blockMargins(r.decls),
    heading: isHeading(r.selector),
    bodyish: isBodyish(r.selector),
  }));

  const typed = rules.filter((r) => r.size || r.weight != null);
  const findings = [];
  const add = (id, severity, message, fix, selectors) =>
    findings.push({ id, severity, message, fix, selectors });

  // Distinct sizes (largest representative) and the style fingerprints.
  const sizes = [...new Set(typed.filter((r) => r.size).map((r) => Math.round(r.size.px)))].sort(
    (a, b) => a - b,
  );
  const styleKeys = new Set(
    typed.map((r) => `${r.size ? Math.round(r.size.px) : '?'}/${r.weight ?? '?'}`),
  );
  const weights = [...new Set(typed.map((r) => r.weight).filter((w) => w != null))];

  // 1. Flat hierarchy: little size range AND little weight range.
  if (sizes.length >= 2) {
    const overall = sizes[sizes.length - 1] / sizes[0];
    const weightRange = weights.length ? Math.max(...weights) - Math.min(...weights) : 0;
    if (overall < 1.5 && weightRange < 300) {
      add(
        'flat-hierarchy',
        'high',
        `Type sizes span only ${overall.toFixed(2)}x and weights vary by ${weightRange}. ` +
          `Nothing is decisively dominant; the page reads as one flat band.`,
        'Establish one primary element. Use a real size step (>=1.5x display-to-body) or an ' +
          'extreme weight jump (e.g. 400 vs 800), not timid increments.',
        typed.filter((r) => r.size).map((r) => r.selector),
      );
    }
  }

  // 2. Bold-only hierarchy: one size, multiple weights doing all the work.
  if (sizes.length <= 1 && weights.length >= 2) {
    add(
      'bold-only-hierarchy',
      'high',
      'Hierarchy is carried by font-weight alone at a single size. Weight differences ' +
        'mostly vanish at reading distance.',
      'Add a real size step and/or step secondary text DOWN in color value. Combine 2-3 ' +
        'signals (size + weight + space) for a level that actually reads.',
      typed.map((r) => r.selector),
    );
  }

  // 3. Sub-1.2x adjacent steps: increments that read as mistakes, not levels.
  for (let i = 1; i < sizes.length; i++) {
    const ratio = sizes[i] / sizes[i - 1];
    if (ratio > 1.0 && ratio < 1.2) {
      add(
        'tiny-step',
        'medium',
        `Adjacent sizes ${sizes[i - 1]}px and ${sizes[i]}px differ by only ${ratio.toFixed(2)}x.`,
        'Make adjacent levels differ by at least one modular-scale step (>=1.2x), or merge ' +
          'them and distinguish with weight/space instead.',
        [],
      );
    }
  }

  // 4. Symmetric (or top<bottom) heading margins: headings must bind DOWN.
  for (const r of typed) {
    if (!r.heading) continue;
    const { top, bottom } = r.margins;
    if (top == null || bottom == null || (top === 0 && bottom === 0)) continue;
    if (Math.abs(top - bottom) <= Math.max(top, bottom) * 0.1) {
      add(
        'symmetric-heading-margins',
        'medium',
        `${r.selector} has near-symmetric margins (top ${top}px, bottom ${bottom}px). ` +
          `A heading belongs to the content below it.`,
        'Set space-before > space-after (target space-before >= 2x paragraph spacing), so the ' +
          'heading binds to its body rather than floating.',
        [r.selector],
      );
    } else if (top > 0 && top < bottom) {
      add(
        'inverted-heading-margins',
        'medium',
        `${r.selector} has more space below (${bottom}px) than above (${top}px), which detaches ` +
          `it from its own section.`,
        'Flip it: more space above the heading than below.',
        [r.selector],
      );
    }
  }

  // 5. Too many distinct text styles.
  if (styleKeys.size > 5) {
    add(
      'too-many-styles',
      'medium',
      `${styleKeys.size} distinct size/weight combinations. Past ~5, level distinctions stop ` +
        `registering.`,
      'Collapse to <=3 primary levels (5 total). Reuse a token per role instead of one-off sizes.',
      [],
    );
  }

  // 6. One global line-height across display + body.
  const lhVals = [...new Set(typed.map((r) => r.lineHeight).filter((v) => v != null))];
  const bigType = typed.some((r) => r.size && r.size.px >= 32);
  const smallType = typed.some((r) => r.size && r.size.px <= 18);
  if (lhVals.length === 1 && bigType && smallType) {
    add(
      'global-line-height',
      'medium',
      `A single line-height (${lhVals[0]}) is applied across both display and body sizes.`,
      'Leading is a function of size: ~1.2 for display/headline, ~1.5 for body/label. Split them.',
      [],
    );
  }

  // 7. Runaway measure on long-form text.
  for (const r of typed) {
    if (!r.bodyish) continue;
    if (!r.maxWidth) {
      add(
        'no-measure',
        'medium',
        `${r.selector} sets no max-width, so prose runs the full container width.`,
        'Cap the measure: max-width ~65ch (45-75 characters per line).',
        [r.selector],
      );
    } else {
      const ch = r.maxWidth.match(/([\d.]+)ch/);
      if (ch && parseFloat(ch[1]) > 75) {
        add(
          'wide-measure',
          'low',
          `${r.selector} measure is ${ch[1]}ch, beyond the comfortable 45-75 range.`,
          'Bring the measure down toward ~65ch.',
          [r.selector],
        );
      }
    }
  }

  const bySeverity = { high: 0, medium: 0, low: 0 };
  for (const f of findings) bySeverity[f.severity]++;

  return {
    ok: findings.length === 0,
    summary: findings.length
      ? `${findings.length} hierarchy issue(s): ${bySeverity.high} high, ${bySeverity.medium} medium, ${bySeverity.low} low.`
      : 'No hierarchy tells detected. Type levels read as deliberately related.',
    stats: {
      distinctSizes: sizes,
      distinctWeights: weights.sort((a, b) => a - b),
      distinctStyles: styleKeys.size,
    },
    findings,
  };
}
