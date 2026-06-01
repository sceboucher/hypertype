// hypertype micro.js, an optional micro-typography pass. Zero dependencies.
// It hangs leading punctuation into the margin (which only Safari does on its
// own) and curls straight quotes. It's optional; the CSS works without it.

// --- Pure transforms (unit-tested) ---

// Curl straight quotes/apostrophes by context and turn "..." into a real ellipsis.
// Educate-quotes style: an opening quote follows start/whitespace/opening bracket;
// everything else closes.
function smartQuotes(text) {
  return text
    .replace(/\.\.\./g, '…')
    .replace(/(^|[\s([{<‘“])"/g, '$1“')   // opening double
    .replace(/"/g, '”')                                  // remaining double -> closing
    .replace(/(^|[\s([{<])'/g, '$1‘')                  // opening single
    .replace(/'/g, '’');                                  // remaining single/apostrophe -> right
}

// The punctuation glyph (if any) at the start of a string, ignoring leading
// whitespace. Returns '' when there is nothing worth hanging.
// Dashes use \u escapes so the source carries no literal em-dash glyph.
const HANGABLE = new Set(['"', "'", '“', '‘', '«', '‹', '(', '[', '\u2014', '\u2013', '•', '*', '„', '‚']);
function leadingPunctuation(text) {
  const ch = text.replace(/^\s+/, '')[0] || '';
  return HANGABLE.has(ch) ? ch : '';
}

// --- DOM pass (browser-only glue; verified in the demo, not unit-tested) ---

function supportsNativeHang() {
  return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('hanging-punctuation', 'first');
}

function glyphWidth(el, glyph) {
  const cs = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return ctx.measureText(glyph).width;
}

// Hang the leading punctuation of an element into the margin so the text edge
// is optically flush. No-op where the browser does it natively (Safari).
function hangPunctuation(el) {
  if (supportsNativeHang()) {
    el.style.hangingPunctuation = 'first allow-end last';
    return;
  }
  const glyph = leadingPunctuation(el.textContent);
  if (!glyph) return;
  const w = glyphWidth(el, glyph);
  el.style.textIndent = `-${w}px`;
}

// Apply the micro pass across matching elements.
// opts: { quotes = true, hang = true }
function micro(selector = '[data-micro]', opts = {}) {
  const { quotes = true, hang = true } = opts;
  for (const el of document.querySelectorAll(selector)) {
    if (quotes) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) node.nodeValue = smartQuotes(node.nodeValue);
    }
    if (hang) hangPunctuation(el);
  }
}
