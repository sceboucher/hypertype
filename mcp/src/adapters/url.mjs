// Fetch a font file directly from a URL. Most precise source: zero name ambiguity.
import { cachedBuffer } from '../cache.mjs';

// A current-browser UA so any server that varies by client (Google especially) hands
// back the same woff2 a real browser would load.
export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchFont(url) {
  return cachedBuffer(url, async () => {
    const res = await fetch(url, { headers: { 'user-agent': BROWSER_UA } });
    if (!res.ok) throw new Error(`fetch failed for ${url} (HTTP ${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  });
}

export function looksLikeUrl(s) {
  return /^https?:\/\//i.test(s.trim());
}
