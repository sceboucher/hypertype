// hypertype slab.js, justified display headlines.
// Pure core takes an injected measure() so the algorithm is testable without canvas.

export function packLines(words, measure, containerWidth) {
  const total = measure(words.join(' '));
  const nLines = Math.max(1, Math.round(total / (containerWidth * 0.9)));
  const ideal = total / nLines;

  const lines = [];
  let cur = [];
  for (const word of words) {
    if (cur.length && measure([...cur, word].join(' ')) > ideal) {
      lines.push(cur.join(' '));
      cur = [word];
    } else {
      cur.push(word);
    }
  }
  if (cur.length) lines.push(cur.join(' '));
  return lines;
}

export function fitLine(text, measure, containerWidth, { probe = 100, min = 8, max = 400 } = {}) {
  const widthAtProbe = measure(text);
  const size = probe * (containerWidth / widthAtProbe);
  return Math.min(max, Math.max(min, size));
}

export function slabModel(text, measure, containerWidth, opts = {}) {
  const fit = (line) => ({ text: line, fontSize: fitLine(line, measure, containerWidth, opts) });

  // Explicit newlines force the line breaks: each line is kept as-is and fitted,
  // so an author can control the breaks instead of letting the packer decide.
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((line) => line.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .map(fit);
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return packLines(words, measure, containerWidth).map(fit);
}

// Binary-search the largest param in [lo, hi] whose width(param) <= target.
// width must be monotonically increasing in param. Used to refine font-size
// against real rendered metrics (letter-spacing/kerning/rounding make the
// linear solve slightly off), and to fit a variable-font width axis.
export function solveFit(width, target, lo, hi, iterations = 24) {
  if (width(hi) <= target) return hi;
  if (width(lo) >= target) return lo;
  let low = lo;
  let high = hi;
  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    if (width(mid) <= target) low = mid;
    else high = mid;
  }
  return low;
}

// Mirror CSS text-transform so canvas measurement matches the rendered (transformed) text.
export function applyTextTransform(text, transform) {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
    default:
      return text;
  }
}

// ---- DOM wiring (browser-only glue; verified via the demo harness, not unit tests) ----

function contentWidth(el) {
  const cs = getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

function canvasMeasurer(el, probe) {
  const cs = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${probe}px ${cs.fontFamily}`;
  const transform = cs.textTransform;
  return (text) => ctx.measureText(applyTextTransform(text, transform)).width;
}

// Offscreen DOM measurer: real kerning, ligatures, OpenType features, and
// letter-spacing scaled in em like the rendered line. Used for the refine pass.
// Returns measure(text, fontSizePx) -> rendered text width; call .dispose() when done.
function offscreenMeasurer(el) {
  const cs = getComputedStyle(el);
  const fontSizePx = parseFloat(cs.fontSize) || 1;
  const lsEm = cs.letterSpacing === 'normal' ? 0 : (parseFloat(cs.letterSpacing) || 0) / fontSizePx;
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.style.cssText =
    'position:absolute;left:-99999px;top:0;visibility:hidden;white-space:nowrap;margin:0;padding:0;display:inline-block;';
  for (const p of ['fontFamily', 'fontWeight', 'fontStyle', 'fontStretch', 'textTransform',
    'fontFeatureSettings', 'fontVariationSettings', 'fontKerning']) {
    span.style[p] = cs[p];
  }
  document.body.appendChild(span);
  const measure = (text, size) => {
    span.style.fontSize = `${size}px`;
    span.style.letterSpacing = `${lsEm * size}px`;
    span.textContent = text;
    return span.getBoundingClientRect().width;
  };
  measure.dispose = () => span.remove();
  return measure;
}

function render(el, model, lineHeight) {
  el.replaceChildren();
  const divs = [];
  for (const { text, fontSize } of model) {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `white-space:nowrap;font-size:${fontSize}px;line-height:${lineHeight};`;
    el.appendChild(div);
    divs.push(div);
  }
  return divs;
}

// Refine each line's font-size against real rendered metrics so right edges
// land sub-pixel-flush. Seeds the search with the already-good linear size.
function refine(el, divs, model, width, min, max) {
  const measure = offscreenMeasurer(el);
  try {
    divs.forEach((div, i) => {
      const text = model[i].text;
      const size = solveFit((s) => measure(text, s), width, min, max);
      div.style.fontSize = `${size}px`;
    });
  } finally {
    measure.dispose();
  }
}

// Offscreen measurer that varies the font-stretch (width) axis as well as size.
// Returns measure(text, sizePx, stretchPct) -> width; call .dispose() when done.
function stretchMeasurer(el) {
  const cs = getComputedStyle(el);
  const fontSizePx = parseFloat(cs.fontSize) || 1;
  const lsEm = cs.letterSpacing === 'normal' ? 0 : (parseFloat(cs.letterSpacing) || 0) / fontSizePx;
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.style.cssText =
    'position:absolute;left:-99999px;top:0;visibility:hidden;white-space:nowrap;margin:0;padding:0;display:inline-block;';
  for (const p of ['fontFamily', 'fontWeight', 'fontStyle', 'textTransform', 'fontFeatureSettings', 'fontKerning']) {
    span.style[p] = cs[p];
  }
  document.body.appendChild(span);
  const measure = (text, size, stretchPct) => {
    span.style.fontSize = `${size}px`;
    span.style.letterSpacing = `${lsEm * size}px`;
    span.style.fontStretch = `${stretchPct}%`;
    span.textContent = text;
    return span.getBoundingClientRect().width;
  };
  measure.dispose = () => span.remove();
  return measure;
}

// Does the loaded font actually respond to the width axis (font-stretch)?
function hasWidthAxis(measure) {
  const narrow = measure('Width Axis Probe', 100, 60);
  const wide = measure('Width Axis Probe', 100, 180);
  return wide > narrow * 1.03;
}

// Fit every line to the measure by varying the width axis at ONE shared font-size,
// so all lines keep the same cap-height (the most editorially authentic slab).
// Returns { size, lines:[{text,stretch}] }, or null when the axis range can't fill
// the lines cleanly (the caller then falls back to font-size scaling).
function widthAxisModel(sizeModel, measure, width, { min, max, wmin = 50, wmax = 200, tol = 0.02 }) {
  const size = Math.max(min, Math.min(max, Math.min(...sizeModel.map((m) => m.fontSize))));
  const lines = [];
  let worst = 0;
  for (const { text } of sizeModel) {
    const stretch = solveFit((s) => measure(text, size, s), width, wmin, wmax);
    worst = Math.max(worst, Math.abs(measure(text, size, stretch) - width) / width);
    lines.push({ text, stretch });
  }
  return worst > tol ? null : { size, lines };
}

function renderWidth(el, model, lineHeight) {
  el.replaceChildren();
  for (const { text, stretch } of model.lines) {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText =
      `white-space:nowrap;font-size:${model.size}px;line-height:${lineHeight};font-stretch:${stretch}%;`;
    el.appendChild(div);
  }
}

// Turn an element into a justified display slab. Returns a disposer.
// mode: 'auto' (prefer width-axis if the font supports it, else size scaling),
//       'size' (always font-size scaling), 'width' (width-axis, size fallback).
export function slabify(el, opts = {}) {
  const { probe = 100, min = 8, max = 1200, lineHeight = 0.88, refine: doRefine = true, mode = 'auto' } = opts;

  // Preserve the source text once so re-runs don't read back the wrapped DOM.
  if (el.dataset.slabSource == null) el.dataset.slabSource = el.textContent.trim();

  // Re-rendering writes into the observed element, which would retrigger the
  // ResizeObserver forever. Guard on container width: only real width changes
  // re-render; force=true is for the post-font-load pass at the same width.
  let lastWidth = -1;
  const run = (force = false) => {
    const w = contentWidth(el);
    if (!(w > 0) || (!force && w === lastWidth)) return;
    lastWidth = w;
    const measure = canvasMeasurer(el, probe);
    const model = slabModel(el.dataset.slabSource, measure, w, { probe, min, max });

    // Prefer the width-axis slab when the font supports it and the lines fill cleanly.
    if (mode !== 'size') {
      const sm = stretchMeasurer(el);
      try {
        if (hasWidthAxis(sm)) {
          const wm = widthAxisModel(model, sm, w, { min, max });
          if (wm) {
            renderWidth(el, wm, lineHeight);
            return;
          }
        }
      } finally {
        sm.dispose();
      }
    }

    // Fallback: per-line font-size scaling (+ refine).
    const divs = render(el, model, lineHeight);
    if (doRefine) refine(el, divs, model, w, min, max);
  };

  // Gate the authoritative pass on web-font load so measurements are correct.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => run(true));
  else run(true);

  const ro = new ResizeObserver(() => run(false));
  ro.observe(el);
  return () => ro.disconnect();
}

// Convenience: slabify every element matching a selector.
export function slabAll(selector = '[data-slab]', opts = {}) {
  const disposers = [...document.querySelectorAll(selector)].map((el) => slabify(el, opts));
  return () => disposers.forEach((d) => d());
}
