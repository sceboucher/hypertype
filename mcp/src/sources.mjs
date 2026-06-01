// Resolve a font reference to bytes through the right adapter, then analyze + cache.
// A reference is a string (URL or family name) or { url } | { google } | { installed }.
import { looksLikeUrl, fetchFont } from './adapters/url.mjs';
import { fetchGoogle } from './adapters/google.mjs';
import { fetchInstalled } from './adapters/local.mjs';
import { analyzeBuffer } from './analyzer.mjs';

const analysisCache = new Map();

async function fromUrl(url) {
  return { buffer: await fetchFont(url), servedUrl: url };
}

export async function resolveFont(font, { source, weight, style, subset } = {}) {
  if (font && typeof font === 'object') {
    if (font.url) return { ...(await fromUrl(font.url)), source: 'url' };
    if (font.google)
      return { ...(await fetchGoogle(font.google, { weight, style, subset })), source: 'google' };
    if (font.installed) return { ...(await fetchInstalled(font.installed)), source: 'installed' };
  }
  const ref = String(font).trim();
  if (source === 'url' || (!source && looksLikeUrl(ref)))
    return { ...(await fromUrl(ref)), source: 'url' };
  if (source === 'installed') return { ...(await fetchInstalled(ref)), source: 'installed' };
  return { ...(await fetchGoogle(ref, { weight, style, subset })), source: 'google' };
}

export async function resolveAndAnalyze(font, opts = {}) {
  const { buffer, servedUrl, source } = await resolveFont(font, opts);
  const cached = analysisCache.get(servedUrl);
  if (cached) return cached;
  const report = await analyzeBuffer(buffer, { servedUrl });
  report.source = source;
  analysisCache.set(servedUrl, report);
  return report;
}
