// The full tool set, in a sensible listing order (spine, generate-side, discovery).
import analyzeFont from './analyze-font.mjs';
import checkCss from './check-css.mjs';
import recommendCss from './recommend-css.mjs';
import critiqueHierarchy from './critique-hierarchy.mjs';
import designTypeSystem from './design-type-system.mjs';
import slabReadiness from './slab-readiness.mjs';
import pairFonts from './pair-fonts.mjs';
import fontLicense from './font-license.mjs';
import listSources from './list-sources.mjs';
import findFonts from './find-fonts.mjs';

export const TOOLS = [
  analyzeFont,
  checkCss,
  recommendCss,
  critiqueHierarchy,
  designTypeSystem,
  slabReadiness,
  pairFonts,
  fontLicense,
  listSources,
  findFonts,
];
