import { localSourcesInfo } from '../adapters/local.mjs';
import { readJsonCache } from '../cache.mjs';
import { loadFeatureIndex } from '../index-data.mjs';

export default {
  name: 'list_sources',
  description:
    'Report which font sources this machine can actually reach: Google Fonts and direct ' +
    'URLs are always available; Adobe Fonts and other installed faces are reachable only ' +
    'because the server runs locally. Honest about reach so discovery results are not ' +
    'promised beyond what is installed.',
  inputSchema: { type: 'object', properties: {} },
  async handler() {
    const local = localSourcesInfo();
    const installedIndex = await readJsonCache('installed-index.json');
    const featureIndex = await loadFeatureIndex();

    return {
      sources: [
        { id: 'google', available: true, note: 'Google Fonts (served subset is analyzed honestly).' },
        { id: 'url', available: true, note: 'Any direct woff2/ttf/otf URL.' },
        {
          id: 'installed',
          available: local.dirs.length > 0,
          note: local.dirs.length
            ? `Installed fonts on ${local.platform}. ${installedIndex ? `${Object.keys(installedIndex.families).length} families indexed.` : 'Index not built yet; find_fonts with sources:["installed"] will build it.'}`
            : 'No readable font directories found.',
        },
        {
          id: 'adobe',
          available: local.adobeActivated,
          note: local.adobeActivated
            ? 'Adobe Fonts (Creative Cloud) activated faces are present and analyzable.'
            : 'No activated Adobe Fonts directory detected.',
        },
      ],
      fontDirs: local.dirs,
      discoveryIndexBuilt: !!featureIndex,
    };
  },
};
