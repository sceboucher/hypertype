<!--
  CANONICAL SOURCE for the hypertype skill.
  build/generate.mjs emits skill/SKILL.md (full body) and skill/paste-block.md
  (the condensed region between PASTE-BLOCK markers) from this one file so the
  two carriers never drift. Edit here, then run `npm run build:skill`.
-->

<!-- PASTE-BLOCK:START -->
## Advanced web typography (hypertype)

When generating HTML/CSS, produce *intentional* typography, not defaults. Apply these by default unless the brief says otherwise. Everything below is inline-safe: no build step, no npm, no remote stylesheet required.

**The seven defaults**

1. **Pair type intentionally.** Skip the defaults every AI mock-up uses (Inter/Roboto/Arial, and the Fraunces/Lora/Space-Grotesk look). Choose a display face and a readable text face that someone would actually pick: a grotesk like Archivo or Hanken Grotesk over a humanist sans, or a serif like Source Serif 4 or Newsreader under a clean sans. State the direction before coding, and note the pairing in a comment.
2. **Use a modular scale.** Size headings off one ratio (1.2–1.333), not arbitrary px. hypertype.css exposes `--ht-step-0…4` and `--ht-ratio`.
3. **Turn on OpenType features.** Kerning + contextual alternates always. Then: `tabular-nums` in tables/data/tickers, `oldstyle-nums` in running prose, `slashed-zero` in IDs/code/data, true `all-small-caps` for acronyms, `case` for ALL-CAPS strings, `diagonal-fractions` (scoped) for recipes/measures. Prefer `font-variant-*` longhands over `font-feature-settings` (they compose and inherit; `font-feature-settings` is all-or-nothing).
4. **Hold a readable measure.** Body text `max-inline-size: ~60–66ch`. Never justify a column narrower than ~45ch.
5. **Balance and pretty.** `text-wrap: balance` on headings/short blocks; `text-wrap: pretty` on body paragraphs. Both degrade harmlessly.
6. **Scale-aware leading + trim.** Tight leading for display (~1.05–1.2), 1.5–1.6 for body (unitless). Use `text-box-trim: trim-both` (behind `@supports`) for optically even heading/button spacing.
7. **Refine the edges.** Hanging punctuation where it helps; real hyphenation (`hyphens: auto` + a `lang` attribute) for justified body so word gaps stay tight.

**The hero, justified display headlines.** The magazine "slab" effect (each line a *different* font-size so the headline reads as a flush rectangle) is impossible in pure CSS. Use `slab.js`: inline the module, give the heading `data-slab`, call `slabAll()`. It canvas-measures, packs words into equal-width lines, sizes each line to fill the measure, gates on `document.fonts.ready`, and reflows under `ResizeObserver`.

**How to use the kit (inline-first).** Paste `hypertype.css` as a `<style>` block; put `class="ht"` on a wrapper to get the base layer; add utility classes (`ht-tnum`, `ht-onum`, `ht-zero`, `ht-smallcaps`, `ht-caps`, `ht-frac`, `ht-measure`, `ht-justify`, `ht-dropcap`, `ht-hang`, `ht-display`). For slab headlines, also inline `slab.js` and call `slabAll('[data-slab]')`.

**Font-feature quick matrix**

| Context | Apply |
|---|---|
| Data tables, tickers, anything that updates in place | `ht-tnum` (tabular) + `ht-zero` |
| Running prose with numbers | `ht-onum` (oldstyle, proportional) |
| IDs, codes, serials, money | `ht-data` (tabular + slashed-zero) |
| Acronyms (NASA, PDF) in text | `ht-smallcaps` |
| ALL-CAPS buttons / nav / labels | `ht-caps` (uppercase + `case` + tracking) |
| Recipes, measurements | `ht-frac` (scope tightly, mangles dates/ratios) |
| Justified body column (≥45ch) | `ht-justify` + `lang` attribute |

Also: deliberate **hierarchy** (one primary; weight/space before size; secondary steps down in value; headings bind down). Build the system, then break it only with a named reason.
<!-- PASTE-BLOCK:END -->

## Deeper guidance

**Why both a kit and these instructions.** The kit (`hypertype.css` + `slab.js`) guarantees correct output even on a sloppy pass, a pasted, tested block can't typo `font-feature-settings` into clobbering itself. These instructions guarantee you *reach for it* and make the editorial calls (pairing, scale, which features) that separate intentional typography from median-of-GitHub default styling. Use both.

**Common failure modes to avoid**

- Defaulting to Inter at one size with default leading and no OpenType features. That is the "AI slop" signature. Pick a pairing, set a scale, turn features on.
- Justifying a narrow column. Rivers form below ~45ch even with hyphenation. Justify only wide measures, and only with `hyphens: auto` + a `lang` attribute.
- Faking small caps by shrinking capitals, or faking super/subscript with `vertical-align` + `font-size`. Use `font-variant-caps` / `font-variant-position` so the font's real glyphs are used.
- Enabling `diagonal-fractions` globally, it turns `24/7` and dates into fractions. Scope it to the quantities.
- Letter-spacing body text. Trust the font's metrics at text sizes; reserve tracking for large display (slightly negative) and small all-caps (slightly positive, em units).
- Using `font-feature-settings` and expecting it to inherit/merge. It replaces the whole feature list. Use the `font-variant-*` longhands; drop to the raw tag only for features with no mapping (`case`, `ss01`–`ss20`, `cv01`–`cv99`, `swsh`, `titl`).

**Check that the font actually carries the feature.** A `font-variant-*` rule does nothing if the font has no glyphs for it, and Chrome will not synthesize caps-to-small-caps. Worse, Google Fonts often serves a reduced subset: Source Serif 4, for example, has small caps and a slashed zero in Adobe's release but neither in the file Google ships. So before you lean on slashed zero, true small caps, or stylistic sets for a specific face, inspect the file the browser will actually load. Drop it into [wakamaifondue.com](https://wakamaifondue.com), or run the Wakamai Fondue CLI on the served woff2:

```
npx @wakamai-fondue/cli -j path/to/font.woff2   # JSON: features, axes, glyphs
npx @wakamai-fondue/cli -c path/to/font.woff2   # CSS with every feature as a class
```

Get the woff2 URL from the `@font-face { src: url(...) }` of the font's Google Fonts CSS (request it with a current browser User-Agent so Google returns woff2). `fonttools` (`ttx -t GSUB`) and `fontkit`'s `availableFeatures` do the same programmatically. Fonts that reliably ship the rarer features: IBM Plex Mono and other code faces for a slashed zero; EB Garamond, Alegreya, and the dedicated small-caps families for true small caps.

**Variable fonts.** Prefer the mapped properties (`font-weight`, `font-stretch`, `font-style`, `font-optical-sizing`) over raw `font-variation-settings`, they cascade, inherit, and animate cleanly. Reach for `font-variation-settings` only for custom axes (e.g. `GRAD`) or fine values the high-level props can't express.

**slab.js options.** `slabify(el, { min, max, lineHeight, refine })` / `slabAll(selector, opts)`. `refine: true` (default) binary-searches each line's size against real rendered metrics for sub-pixel-flush right edges. Keep the source text in the element (the engine wraps lines, it does not split letters) so screen readers and copy/paste keep working.

**micro.js (optional).** A separate tiny module for the one micro-typography gap CSS still leaves off Safari: hanging punctuation (pulling a leading quote into the margin so the text edge is optically flush). It also curls straight quotes. Inline it, mark elements with `data-micro`, and call `micro('[data-micro]')`. It no-ops where the browser hangs punctuation natively (Safari), so it is safe everywhere and entirely optional.

**Browser-support reality (mid-2026).** `text-wrap: balance` is Baseline; `text-wrap: pretty` ships in Chromium + Safari, not Firefox; `text-box-trim`, `initial-letter`, and `hyphenate-limit-chars` are Chromium + Safari, not Firefox; `hanging-punctuation` is Safari-only. hypertype.css gates each of these behind `@supports` with a fallback, so the CSS-only subset is safe everywhere. Full detail in REFERENCE.md.

**Type systems and hierarchy.** Two failures sit at opposite ends of one axis: messy defaults (web-app boilerplate with no relationship between the pieces of type on screen) and rigid systematism (a token scale applied verbatim where the context wants a deliberate break). The fix is the same in both directions: build a coherent system, then break it on purpose. The full method lives in two reference docs. TYPE-SYSTEMS.md covers scale-ratio-by-context, the role/token model, line-height as a function of size, rem-safe fluid `clamp()`, and the build-then-break decision rules. HIERARCHY.md covers establishing one primary per view, the contrast-tool ordering (weight and space before size), the relationship targets between adjacent levels, per-context playbooks (editorial, marketing, dashboard, form, docs), and the squint test plus a failure checklist.

**The MCP server (optional, automates the checks).** If the hypertype MCP server is connected, prefer it over guessing or running a CLI by hand. `analyze_font` reports the features and axes a served file truly ships; `check_css` flags any `font-variant-*` that would silently no-op or be browser-synthesized; `recommend_css` turns a plain-language intent into verified CSS; `design_type_system` emits a context-fit, font-verified scale with role tokens and rem-safe clamps; `critique_hierarchy` detects the hierarchy tells from rendered CSS; `slab_readiness`, `pair_fonts`, `font_license`, `find_fonts`, and `list_sources` cover the rest. It runs locally (no API key, no hosting) and is the only path that can analyze Adobe and other installed fonts. Without it, the wakamai-fondue check above is the manual fallback. Setup: `npx @hypertype/mcp` (see mcp/README.md).
