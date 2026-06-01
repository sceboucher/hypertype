import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildTypeSystem, emitCss, CONTEXTS } from '../typesystem.mjs';
import { resolveAndAnalyze } from '../sources.mjs';

const here = dirname(fileURLToPath(import.meta.url));

async function loadShortlist() {
  return JSON.parse(await readFile(join(here, '../../data/font-shortlist.json'), 'utf8'));
}

// Map a context + optional tone to an aesthetic direction in the shortlist.
function chooseDirection(context, tone, directions) {
  const names = Object.keys(directions);
  if (tone) {
    const hit = names.find((n) => tone.toLowerCase().includes(n.split('-')[0]));
    if (hit) return hit;
  }
  const byContext = {
    editorial: 'editorial',
    content: 'serif-display',
    marketing: 'expressive-display',
    landing: 'expressive-display',
    dashboard: 'technical',
    app: 'grotesque',
    docs: 'technical',
    default: 'grotesque',
  };
  return byContext[context] || 'grotesque';
}

// Tags the context's features imply, so we can verify the chosen fonts actually carry them.
function contextTags(system) {
  const tags = new Set();
  for (const f of system.features) {
    if (/tabular/.test(f)) tags.add('tnum');
    if (/slashed/.test(f)) tags.add('zero');
    if (/oldstyle/.test(f)) tags.add('onum');
    if (/small-caps/.test(f)) tags.add('smcp');
    if (/case-sensitive/.test(f)) tags.add('case');
    if (/fractions/.test(f)) tags.add('frac');
  }
  return [...tags];
}

export default {
  name: 'design_type_system',
  description:
    'Emit a coherent, context-appropriate type system: a scale ratio chosen for the ' +
    'context, role tokens (size + line-height + weight + tracking), a rem-safe fluid ' +
    'clamp() per display role, the OpenType features that context calls for, and ready CSS ' +
    'custom properties. If fonts are given, they are verified against the served files so ' +
    'the system is guaranteed renderable; if not, a de-AI\'d shortlist is suggested.',
  inputSchema: {
    type: 'object',
    properties: {
      context: {
        type: 'string',
        enum: Object.keys(CONTEXTS),
        description: 'The surface this type system serves. Drives ratio, leading, and features.',
      },
      tone: { type: 'string', description: 'Optional aesthetic hint, e.g. "editorial", "technical".' },
      fonts: {
        type: 'object',
        description: 'Optional explicit fonts to verify.',
        properties: {
          display: { type: 'string', description: 'Display/headline family.' },
          text: { type: 'string', description: 'Body/text family.' },
        },
      },
    },
  },
  async handler({ context = 'default', tone, fonts }) {
    const system = buildTypeSystem({ context });
    const css = emitCss(system);
    const tags = contextTags(system);

    let chosenFonts;
    let verification;

    if (fonts && (fonts.display || fonts.text)) {
      chosenFonts = fonts;
      verification = {};
      for (const [slot, fam] of Object.entries(fonts)) {
        if (!fam) continue;
        try {
          const r = await resolveAndAnalyze(fam);
          const missing = tags.filter((t) => !r.featureTags.includes(t));
          verification[slot] = {
            family: r.family,
            servedUrl: r.servedUrl,
            carries: tags.filter((t) => r.featureTags.includes(t)),
            missing,
            ok: missing.length === 0,
            ...(missing.length
              ? { warning: `${r.family} does not carry: ${missing.join(', ')}. Pick a different ${slot} font or drop those features.` }
              : {}),
          };
        } catch (e) {
          verification[slot] = { family: fam, error: e.message };
        }
      }
    } else {
      const shortlist = await loadShortlist();
      const dir = chooseDirection(context, tone, shortlist.directions);
      const d = shortlist.directions[dir];
      chosenFonts = { direction: dir, display: d.display[0], text: d.text[0], alternates: { display: d.display, text: d.text } };
    }

    return {
      ...system,
      fonts: chosenFonts,
      ...(verification ? { verification } : {}),
      requiredFeatureTags: tags,
      css,
    };
  },
};
