// Turn a font buffer into the ground-truth feature/axis/coverage report. fontkit's
// lazy layout parser proved unreliable on Google's woff2 (it under-reports GSUB/GPOS
// features, missing even kern), so we read the OpenType FeatureList and fvar axes
// straight from the sfnt bytes. fontkit is used only for the name table, which it reads
// reliably. woff2 is decompressed first with wawoff2 (bundled wasm, no network).
import * as fontkit from 'fontkit';
import * as woff2 from 'wawoff2';
import { FEATURES, describeTag, isStyleSet, isCharVariant } from './features.mjs';

const AXIS_NAMES = {
  wght: 'Weight',
  wdth: 'Width',
  opsz: 'Optical size',
  slnt: 'Slant',
  ital: 'Italic',
  GRAD: 'Grade',
};

async function toSfnt(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.length >= 4 && buf.toString('latin1', 0, 4) === 'wOF2') {
    return Buffer.from(await woff2.decompress(buf));
  }
  return buf;
}

function tableDirectory(buf) {
  // A TrueType collection points at multiple sfnts; analyze the first face.
  let base = 0;
  if (buf.toString('latin1', 0, 4) === 'ttcf') base = buf.readUInt32BE(12);
  const numTables = buf.readUInt16BE(base + 4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const o = base + 12 + i * 16;
    const tag = buf.toString('latin1', o, o + 4);
    tables[tag] = { off: buf.readUInt32BE(o + 8), len: buf.readUInt32BE(o + 12) };
  }
  return tables;
}

// FeatureList tags for a GSUB/GPOS table (identical header layout for both).
function featureTags(buf, table) {
  if (!table) return [];
  const flOffset = buf.readUInt16BE(table.off + 6);
  if (!flOffset) return [];
  const fl = table.off + flOffset;
  const count = buf.readUInt16BE(fl);
  const tags = new Set();
  for (let i = 0; i < count; i++) {
    const o = fl + 2 + i * 6;
    tags.add(buf.toString('latin1', o, o + 4));
  }
  return [...tags];
}

function variationAxes(buf, table) {
  if (!table) return [];
  const b = table.off;
  const axesOffset = buf.readUInt16BE(b + 4);
  const axisCount = buf.readUInt16BE(b + 8);
  const axisSize = buf.readUInt16BE(b + 10);
  const axes = [];
  for (let i = 0; i < axisCount; i++) {
    const o = b + axesOffset + i * axisSize;
    const tag = buf.toString('latin1', o, o + 4);
    axes.push({
      tag,
      name: AXIS_NAMES[tag] || tag,
      min: buf.readInt32BE(o + 4) / 65536,
      default: buf.readInt32BE(o + 8) / 65536,
      max: buf.readInt32BE(o + 12) / 65536,
    });
  }
  return axes;
}

function names(sfnt) {
  try {
    let font = fontkit.create(sfnt);
    if (Array.isArray(font.fonts) && font.fonts.length) font = font.fonts[0];
    return {
      family: font.familyName ?? null,
      subfamily: font.subfamilyName ?? null,
      fullName: font.fullName ?? null,
      postscriptName: font.postscriptName ?? null,
    };
  } catch {
    return { family: null, subfamily: null, fullName: null, postscriptName: null };
  }
}

function kindOf(tag) {
  if (FEATURES[tag]) return FEATURES[tag].kind;
  if (isStyleSet(tag)) return 'styleset';
  if (isCharVariant(tag)) return 'charvariant';
  return 'other';
}

export async function analyzeBuffer(input, { servedUrl = null } = {}) {
  const sfnt = await toSfnt(input);
  const tables = tableDirectory(sfnt);
  const features = [
    ...new Set([...featureTags(sfnt, tables.GSUB), ...featureTags(sfnt, tables.GPOS)]),
  ].sort();
  const axes = variationAxes(sfnt, tables.fvar);
  const has = (tag) => features.includes(tag);

  return {
    ...names(sfnt),
    servedUrl,
    isVariable: axes.length > 0,
    axes,
    featureTags: features,
    features: features.map((tag) => ({ tag, label: describeTag(tag), kind: kindOf(tag) })),
    figureStyles: ['lnum', 'onum', 'pnum', 'tnum'].filter(has),
    summary: {
      smallCaps: has('smcp'),
      capsToSmallCaps: has('c2sc'),
      slashedZero: has('zero'),
      tabularFigures: has('tnum'),
      oldstyleFigures: has('onum'),
      liningFigures: has('lnum'),
      fractions: has('frac') || has('afrc'),
      caseSensitive: has('case'),
      kerning: has('kern'),
      styleSets: features.filter(isStyleSet),
      charVariants: features.filter(isCharVariant),
      widthAxis: axes.some((a) => a.tag === 'wdth'),
      weightAxis: axes.some((a) => a.tag === 'wght'),
      slantAxis: axes.some((a) => a.tag === 'slnt' || a.tag === 'ital'),
      opticalSizeAxis: axes.some((a) => a.tag === 'opsz'),
    },
  };
}

export function hasFeature(report, tag) {
  return report.featureTags.includes(tag);
}
