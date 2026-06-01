# hypertype REFERENCE

The deep layer behind the skill. OpenType tag catalog, variable-font axes, the `@supports` gating table with mid-2026 browser-support reality, the slab.js algorithm, and which existing tools to borrow from vs reject.

---

## 1. The two OpenType APIs in CSS

CSS exposes OpenType features two ways:

- **`font-variant-*` longhands**, high-level, semantic, **composable, and inheritable**. The browser maps them to the right tags and knows the defaults. **Prefer these.**
- **`font-feature-settings`**, low-level raw tags. **All-or-nothing**: any new declaration replaces the entire feature list, so setting one tag can silently disable others, and it does not merge across the cascade. Use **only** for features with no high-level mapping.

Tag value syntax for `font-feature-settings`: `"tag" 1` / `"tag" on` = enabled, `"tag" 0` / `"tag" off` = disabled.

### Features with no `font-variant` mapping (must use the raw tag)

`case` (case-sensitive forms), `ss01`–`ss20` (stylistic sets), `cv01`–`cv99` (character variants), `swsh`/`cswh` (swashes), `titl` (titling caps), `salt` (stylistic alternates), `hist` (historical forms), `sinf` (scientific inferiors), `ornm` (ornaments). The named-function route (`font-variant-alternates` + `@font-feature-values`) can give some of these readable names.

---

## 2. OpenType tag catalog (high-level vs low-level)

| Feature | Tag(s) | High-level CSS | Use for |
|---|---|---|---|
| Kerning | `kern` | `font-kerning: normal` | everything (on by default) |
| Standard ligatures | `liga` | `font-variant-ligatures: common-ligatures` | running text (default on) |
| Contextual alternates | `calt` | `font-variant-ligatures: contextual` | script/handwriting, code joins |
| Discretionary ligatures | `dlig` | `font-variant-ligatures: discretionary-ligatures` | display/branding only |
| Historical ligatures | `hlig` | `font-variant-ligatures: historical-ligatures` | period settings |
| Small caps | `smcp` | `font-variant-caps: small-caps` | lead-ins, lowercase→small caps |
| Caps→small caps | `c2sc`+`smcp` | `font-variant-caps: all-small-caps` | acronyms (NASA, PDF) |
| Petite caps | `pcap`/`c2pc` | `font-variant-caps: all-petite-caps` | where the font ships them |
| Oldstyle figures | `onum` | `font-variant-numeric: oldstyle-nums` | running prose |
| Lining figures | `lnum` | `font-variant-numeric: lining-nums` | all-caps, UI |
| Tabular figures | `tnum` | `font-variant-numeric: tabular-nums` | **tables, tickers, anything updating in place** |
| Proportional figures | `pnum` | `font-variant-numeric: proportional-nums` | prose |
| Diagonal fractions | `frac` | `font-variant-numeric: diagonal-fractions` | recipes/measures (**scope tightly**) |
| Stacked fractions | `afrc` | `font-variant-numeric: stacked-fractions` | nut fractions |
| Superscript | `sups` | `font-variant-position: super` | footnote markers |
| Subscript | `subs` | `font-variant-position: sub` | chemical formulas |
| Ordinals | `ordn` | `font-variant-numeric: ordinal` | 1st, 2nd, Nº |
| Slashed zero | `zero` | `font-variant-numeric: slashed-zero` | **IDs, code, data, money** |
| Case-sensitive forms | `case` | *(none, raw tag)* | ALL-CAPS punctuation/figures |
| Stylistic sets | `ss01`–`ss20` | `font-variant-alternates: styleset(...)` via `@font-feature-values` | font-specific alternates |
| Character variants | `cv01`–`cv99` | `font-variant-alternates: character-variant(...)` | single-glyph alternates |
| Swashes | `swsh`/`cswh` | `font-variant-alternates: swash(...)` | display flourishes |
| Titling caps | `titl` | *(named-function only)* | large display caps |
| Localized forms | `locl` | *(drive via `lang` attribute)* | multilingual correctness |

**Highest-ROI underused features:** `tnum` (stops number jitter in any live/aligned data), `zero` (kills 0/O confusion in IDs/code), `all-small-caps` (acronyms read far better), `case` (fixes hyphens/parens sitting too low in ALL-CAPS), `onum` (numbers that sit in running prose instead of shouting).

**Discovering what a font's `ssNN`/`cvNN` do:** there is no standard meaning. Inspect with [Wakamai Fondue](https://wakamaifondue.com), the foundry's specimen, or fontkit/opentype.js reading the GSUB FeatureList + `name` table labels.

### `@font-feature-values` (readable names for sets)

```css
@font-feature-values "Inter" {
  @styleset { disambiguation: 1; }       /* maps to ss01 */
  @character-variant { single-story-a: 11; } /* maps to cv11 */
}
.brand {
  font-family: "Inter";
  font-variant-alternates: styleset(disambiguation) character-variant(single-story-a);
}
```

---

## 3. Variable fonts

Prefer the **mapped properties** over raw `font-variation-settings`, they cascade, inherit, and animate cleanly. Reach for the raw property only for custom axes or values the high-level props can't express.

| Axis | Range | Mapped property |
|---|---|---|
| `wght` (weight) | 1–1000 | `font-weight` |
| `wdth` (width) | % | `font-stretch` |
| `slnt` (slant) | degrees | `font-style: oblique <deg>` |
| `ital` (italic) | 0/1 | `font-style: italic` |
| `opsz` (optical size) | pt | `font-optical-sizing: auto` (automatic) |
| `GRAD` (grade) | custom | `font-variation-settings: "GRAD" <n>`, changes weight **without reflow** |

`font-variation-settings` sets **all** axes at once and bypasses the high-level cascade, re-list every axis you need. `font-optical-sizing: auto` is production-safe and a no-op on non-variable fonts.

Runtime axis/feature detection: opentype.js or fontkit reading `fvar` (axes) and GSUB (features); or probe by setting `font-variation-settings: "wdth" 50` vs `150` and measuring whether width changes.

---

## 4. The `@supports` gating table (mid-2026 reality)

| Feature | Chromium | Safari/WebKit | Firefox | Posture |
|---|---|---|---|---|
| `text-wrap: balance` | 114+ | 17.5+ | 121+ | **Baseline, ship unconditionally** |
| `text-wrap: pretty` | 117+ | 17.5+ | ❌ | enhancement; FF wraps normally (no harm) |
| `text-box-trim`/`-edge` | 133+ | 18.2+ | ❌ (flagged) | gate; fall back to manual padding |
| `initial-letter` | 110+ | 9+ (`-webkit-`) | ❌ | gate; fall back to `::first-letter` float |
| `initial-letter-align` | ❌ | ❌ | ❌ | unimplemented everywhere, do not use |
| `hanging-punctuation` | ❌ | 10+ | ❌ | Safari-only ~10 yrs; cosmetic; `text-indent` approximation |
| `hyphens: auto` | 88+ | 5.1+ (`-webkit-`) | 43+ | production-safe **with a `lang` attribute** |
| `hyphenate-limit-chars` | 109+ | 17+ | ❌ | gate; fall back to plain `hyphens: auto` |
| `font-optical-sizing: auto` | 79+ | 14+ | 62+ | **production-safe** |
| `font-variant-*` longhands | 52+ | 9.1+ | 34+ | **production-safe** |
| `widows`/`orphans` | 25+ | 7.1+ | ❌ | only in multicol/paged media |

**Rule:** don't rely on a Firefox-or-Safari-only feature for legibility. hypertype.css puts each gated row behind `@supports` with the fallback above.

---

## 5. The slab.js algorithm (justified display headlines)

The slab effect, every line stretched edge to edge with its own font size so the block reads as a rectangle, is a per-line sizing problem rather than a spacing one. No CSS property sizes a line to its container:

- `text-align: justify` (+ `text-align-last: justify`) only stretches **word-spacing** at one fixed font-size → short lines get river gaps, not a uniform slab. (It *is* the right tool for justified **body** copy.)
- `text-wrap: balance`/`pretty` only choose **break points**, never sizes.

### The recipe (what slab.js does)

1. Measure with canvas `ctx.measureText` at a 100px probe (mirror `text-transform`, or uppercased text overflows).
2. `totalW = measure(allWords)`; `nLines = round(totalW / (W * 0.9))`; `ideal = totalW / nLines`.
3. Greedily pack words into lines, starting a new line when adding a word would exceed `ideal` → lines of roughly equal measured width.
4. Per line: `fontSize = probe * (W / lineWidthAtProbe)` (linear solve), clamped to `[min, max]`.
5. Wrap each line in a `white-space: nowrap` block at `line-height ~0.88`.
6. **Refine (default on):** binary-search each line's size against a real offscreen DOM measurer (kerning, ligatures, em-scaled letter-spacing) so right edges land sub-pixel-flush, the linear solve is only exact for plain canvas metrics.

### Non-negotiables

- Gate the authoritative pass on `document.fonts.ready`, measuring before web-font load gives wrong widths and a visible reflow on swap (the #1 way naive slabs look broken).
- Re-run under `ResizeObserver`, **with a width-change guard**, the engine writes into the element it observes, so without the guard it self-triggers an infinite reflow loop.
- Measure an inner content width (parent horizontal padding corrupts `clientWidth`).
- Clamp `min`/`max` so one very long word can't blow the layout.
- Keep real text: **wrap lines, never split into per-letter spans**, screen readers and copy/paste must keep working.

### Variable-font path (deferred)

If the loaded font ships a `wdth` axis, fit each line by **width axis at a fixed font-size** instead of scaling font-size, every line keeps the same cap-height, the most editorially authentic slab. Requires a `wdth`-axis font and real-browser verification.

---

## 6. Existing tools, borrow patterns, reject as dependency

The binding constraint (artifact sandboxes forbid build steps, npm, remote stylesheets; CSP only reliably whitelists cdnjs for scripts) disqualifies every library below **as the primary format**. We borrow their ideas, not their dependencies.

| Tool | What's worth taking | Why not adopt |
|---|---|---|
| slabText / BigText / FitText | the row-split-then-fit slab algorithm | jQuery-era, archived/dead; sandbox forbids the dependency anyway |
| fitty | read/write batching to avoid layout thrash | single-line only; dormant (2020) |
| textFit / Lorp fit-to-width | binary-search-on-size; wdth-axis fitting idea | not a per-line slab tool |
| Capsize / `@capsizecss` | precise cap-height/baseline trim math | native `text-box-trim` supersedes it where supported; megabytes + bundling |
| Hyphenopoly / Hyphenopoly.js | real client-side hyphenation dictionaries | heavy + per-language pattern-license vetting; `hyphens: auto` + `lang` covers most |
| Tailwind Typography (`prose`) | sensible body defaults | needs a build step |
| Open Props | design-token discipline | tokens only, no typographic behavior |
| Typeset.js | hanging punctuation + soft-hyphen insertion | build-time pre-processor; orthogonal to slab/justify |
| Lettering.js | (avoid) per-letter spans | sizes nothing; a11y cost, wrong tool for slabs |

**The gap no existing tool fills:** a maintained, dependency-free, inline-emittable justified-display-headline engine. That gap is the reason hypertype exists.
