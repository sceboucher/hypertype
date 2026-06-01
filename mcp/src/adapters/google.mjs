// Resolve a Google Fonts family name to the REAL served woff2. This is where the
// reduced-subset gotcha lives: Google ships a trimmed build (e.g. Source Serif 4 with
// no small caps and no slashed zero), so analyzing the served file is the only honest
// answer. We hit the css2 API with a browser UA and read the @font-face src.
import { BROWSER_UA, fetchFont } from './url.mjs';

const SUBSET_RE = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{[^}]*?src:\s*url\(([^)]+\.woff2)\)/gi;
const ANY_SRC_RE = /src:\s*url\(([^)]+)\)/i;

// family: "Source Serif 4". opts: { weight, style='normal', subset='latin' }.
// By default we do NOT pin a weight: a plain family request yields the variable font
// (with its fvar axes and full feature set) where one exists, instead of a flattened
// static instance. css2 returns one @font-face per subset, ordered with latin LAST, so
// we select by subset name (latin by default) rather than taking the first block.
export async function resolveGoogleUrl(family, { weight, style = 'normal', subset = 'latin' } = {}) {
  const fam = family.trim().replace(/\s+/g, '+');
  let axis = '';
  if (weight != null) axis = style === 'italic' ? `:ital,wght@1,${weight}` : `:wght@${weight}`;
  else if (style === 'italic') axis = ':ital@1';
  const cssUrl = `https://fonts.googleapis.com/css2?family=${fam}${axis}&display=swap`;

  const res = await fetch(cssUrl, { headers: { 'user-agent': BROWSER_UA } });
  if (!res.ok) {
    throw new Error(
      `Google Fonts does not serve "${family}" at weight ${weight} ${style} (css2 HTTP ${res.status}). ` +
        `Check the exact family name, or pass a direct font URL instead.`,
    );
  }
  const css = await res.text();

  // Prefer the requested subset if present; otherwise the first woff2 (all subsets of
  // one family share the same feature set, so any is fine for analysis).
  let chosen = null;
  let firstUrl = null;
  let m;
  SUBSET_RE.lastIndex = 0;
  while ((m = SUBSET_RE.exec(css)) !== null) {
    const [, name, srcUrl] = m;
    firstUrl ??= srcUrl;
    if (subset && name.toLowerCase() === subset.toLowerCase()) chosen = srcUrl;
  }
  const url = (chosen || firstUrl || css.match(ANY_SRC_RE)?.[1])?.replace(/['"]/g, '');
  if (!url) throw new Error(`No woff2 source found in Google css2 response for "${family}".`);
  return url;
}

export async function fetchGoogle(family, opts = {}) {
  const url = await resolveGoogleUrl(family, opts);
  return { buffer: await fetchFont(url), servedUrl: url };
}
