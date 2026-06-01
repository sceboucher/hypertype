import { resolveAndAnalyze } from '../sources.mjs';
import { parseTypeDeclarations, FEATURES, describeTag } from '../features.mjs';

export default {
  name: 'check_css',
  description:
    'The no-op catcher. Given CSS and a font, check every font-variant-* and ' +
    'font-feature-settings declaration against the font\'s real feature set, and report ' +
    'per declaration whether it RESOLVES, is a silent NO-OP (font lacks the feature, the ' +
    'rule renders nothing), or is DEGRADED (the browser synthesizes a faked small-caps / ' +
    'sub-superscript). Use this to catch typography that looks right in the source but ' +
    'will not render.',
  inputSchema: {
    type: 'object',
    properties: {
      css: {
        type: 'string',
        description: 'CSS containing font-variant-* and/or font-feature-settings declarations.',
      },
      font: { type: 'string', description: 'Google family name, font URL, or installed family name.' },
      source: { type: 'string', enum: ['google', 'url', 'installed'] },
      weight: { type: 'number' },
      style: { type: 'string', enum: ['normal', 'italic'] },
      subset: { type: 'string' },
    },
    required: ['css', 'font'],
  },
  async handler({ css, font, source, weight, style, subset }) {
    const r = await resolveAndAnalyze(font, { source, weight, style, subset });
    const set = new Set(r.featureTags);
    const findings = [];

    for (const d of parseTypeDeclarations(css)) {
      for (const { tag, off } of d.requested) {
        if (off) continue; // disabling a feature can never silently fail
        const present = set.has(tag);
        const meta = FEATURES[tag];
        let verdict;
        let note;
        if (present) {
          verdict = 'resolves';
        } else if (meta?.whenMissing === 'default') {
          verdict = 'resolves';
          note = 'on by default in the shaping engine.';
        } else if (meta?.whenMissing === 'synthesized') {
          verdict = 'degraded';
          note = 'font lacks this feature; the browser synthesizes a faked, lower-quality result.';
        } else {
          verdict = 'no-op';
          note = 'font does not carry this feature; the declaration renders nothing.';
        }
        findings.push({
          property: d.property,
          value: d.value,
          tag,
          feature: describeTag(tag),
          verdict,
          ...(note ? { note } : {}),
        });
      }
    }

    const problems = findings.filter((f) => f.verdict === 'no-op' || f.verdict === 'degraded');
    return {
      font: r.family,
      servedUrl: r.servedUrl,
      ok: problems.length === 0,
      summary: problems.length
        ? `${problems.length} declaration(s) will not render as written on ${r.family}.`
        : `All declarations resolve on ${r.family}.`,
      findings,
    };
  },
};
