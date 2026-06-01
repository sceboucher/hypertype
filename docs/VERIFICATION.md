# Verification status

## Automated (green, every commit)

`npm test`, 28 tests, `node --test`, zero dependencies. Covers the full pure core:

- **slab algorithm:** `packLines` (greedy equal-width line-fill), `fitLine` (linear font-size solve + min/max clamp), `slabModel` (compose, whitespace-normalize, empty-safe, single-word), `applyTextTransform` (measurement matches rendered case), `solveFit` (binary-search refine, linear + non-linear + under/overflow clamps).
- **hypertype.css guards:** token-budget gate (~1196 / 2000), production-safe layer present, every progressive-enhancement feature behind `@supports`, fallback present for each gated feature.
- **skill/bundle:** paste-block extraction, frontmatter shape, inline-bundle inlines CSS + slab with no module syntax, and the export-stripped classic script **parses and exposes `slabAll`/`slabify`** (guards the artifact-sandbox path).
- **micro.js:** `smartQuotes` (curls double/single quotes by context, ellipsis, leaves curly text alone) and `leadingPunctuation` (reports the hangable glyph, skips leading whitespace).

## Browser-verified (Chromium, headless Edge)

Captured with a headless Chromium screenshot (`--headless=old --screenshot`) against the demo, after `document.fonts.ready`.

- **slab.js hero, confirmed flush.** Each line sized to fill the measure, every line flush against both container edges. Two bugs were caught and fixed this way: uppercased text overflowing (the canvas measurer now honors `text-transform`) and a `ResizeObserver` feedback loop (now width-guarded). The refine pass renders without error.
- **Width-axis slab mode, confirmed.** With a variable font carrying a `wdth` axis (Archivo), all lines render at one shared font-size and are stretched by the width axis to fill, uniform cap-height.
- **Font-size fallback, confirmed.** With a font that has no width axis (Archivo Black), the same source falls back automatically to per-line font-size scaling (varying heights, still flush).
- **micro.js, confirmed.** A blockquote marked `data-micro` rendered with straight quotes curled and the leading quote hanging past the left rule into the margin.

## Remaining: real Firefox and WebKit

Only Chromium (Edge) was available locally. Not yet eyeballed in real Firefox or Safari/WebKit:

- Every `@supports` fallback degrading cleanly in Firefox (no `text-wrap: pretty`, no `text-box-trim`, no `initial-letter`, no `hanging-punctuation`, no `hyphenate-limit-chars`).
- The CSS-only subset standing alone with all JS removed.

### How to run it

```bash
npm run build
node demo/serve.mjs                 # http://localhost:5050/demo/index.html
INDEX=dist/hypertype-inline.html PORT=5060 node demo/serve.mjs   # the inline bundle
```

Open in Firefox and Safari. Confirm slab headlines sit flush; OpenType utilities render; and in Firefox the page still looks right where the gated features are absent (micro.js supplies hanging punctuation there).

## Not built (intentional, per locked decisions)

- `micro.js` widow control (the smart-quotes + hanging-punctuation core shipped; widow handling can follow).
- cdnjs / npm publish, the thesis is inline-first; publish is a later convenience.
