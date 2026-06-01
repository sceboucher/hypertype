# hypertype: Architecture Synthesis

Why hypertype is built the way it is: the constraints, the four carriers, the slab algorithm, and the decisions behind them.

## The binding constraint

Claude Design / Desktop / Cowork artifacts run in a sandbox with **no build step, no npm, no remote `@import`/stylesheet, and a CSP that only reliably whitelists `cdnjs.cloudflare.com` for scripts.** Every design decision flows from one rule: *must work pasted inline, must degrade gracefully.*

This disqualifies every existing library as the primary format:
- Tailwind Typography needs a build.
- Capsize / Hyphenopoly / opentype.js / fontkit ship megabytes and assume bundling.
- Open Props is a token library with no typographic behavior.
- react-wrap-balancer is React-only and superseded by native `text-wrap: balance`.

The only format that ports to all the named harnesses is a literal `<style>` block plus an optional tiny `<script>` pasted verbatim. **Inline is canonical; CDN is convenience.** We borrow patterns (Tailwind prose defaults, Open Props token discipline, the slabText row-split-then-fit algorithm, fitty's read/write batching) without inheriting dead jQuery dependencies or build requirements.

## The four carriers (one source of truth)

| # | Carrier | Form | Role |
|---|---------|------|------|
| 1 | `slab.js` | single-file vanilla JS | **HERO**, justified display headlines (the one thing CSS cannot do) |
| 2 | `hypertype.css` | inlineable CSS | production-safe OpenType + balance/pretty + `@supports`-gated enhancements |
| 3 | `SKILL.md` + paste-block | Agent Skill + instruction module | teaches the model WHEN/WHY; both generated from one canonical markdown |
| 4 | `REFERENCE.md` | markdown | deep OpenType / `@supports` / algorithm doc |

Plus `micro.js` (optional hanging-punctuation/widow polyfill, fast-follow) and a dev-only `build/` generator that keeps the skill and paste-block in sync and enforces the CSS token budget in CI.

### Why both a kit AND a skill

They cover two distinct failure modes:
- The **kit** guarantees correct output even when the model is sloppy (it can't typo `font-feature-settings` into clobbering itself if it pastes a tested block).
- The **skill** guarantees the model *chooses* to reach for it and makes the editorial decisions (pairing, scale, which features) that turn median-of-GitHub AI-slop into intentional typography.

A perfect kit the model never invokes changes nothing. A perfect skill with no kit produces well-intentioned but buggy hand-rolled CSS.

## The hero: `slab.js` algorithm

The magazine slab effect (every line stretched edge-to-edge, each line a *different* font-size so the block reads as a flush rectangle) is **fundamentally a per-line font-size problem, not a spacing problem.** CSS `text-align: justify` only stretches word-spacing at a fixed size; `text-wrap: balance` only moves break points. Neither can size a line to its container.

Algorithm:
1. Measure with canvas `ctx.measureText` at a 100px probe (font-load-safe once `document.fonts.ready`).
2. Greedily pack words into lines of roughly equal measured width.
3. Per line: `font-size = probeSize * (containerWidth / lineWidthAtProbe)`.
4. Wrap each line in a `white-space: nowrap` block at `line-height ~0.88`.
5. Opt-in binary-search refine pass (~8 iterations, seeded by the linear solve) for pixel-perfect right edges.
6. Optional variable-font path: if a `wdth` axis exists, fit by width-axis so every line keeps the same cap-height (the most editorially authentic slab).

Non-negotiables: gate on `document.fonts.ready`; re-run under `ResizeObserver` on an inner wrapper (parent padding corrupts `clientWidth`); clamp min/max font-size so one long word can't blow layout; keep real text (wrap lines, never per-letter spans, a11y).

**Design note for testability:** the pure core (line-breaking + size-solving) takes an injected `measure(text, size)` function. In the browser that's canvas; in tests it's a synthetic width model. This makes the algorithm unit-testable with no canvas shim.

## Locked decisions (2026-05-31)

- **Plain JS is the canonical inline form** (authored cleanly; the inline path is the whole thesis).
- **`wdth`-axis fitting is opt-in; font-size scaling is the default.**
- **Curated font-pairing list** leaning yes (fights slop harder than pure principles), settled at the skill phase.
- **`micro.js` is fast-follow, not a v1 blocker.**

## Build plan

- **Phase 0**, Scaffold (`src/`, `skill/`, `docs/`, `build/`, `demo/`). No runtime deps, ever.
- **Phase 1**, HERO: `slab.js` core, TDD'd (canvas probe, greedy line-fill, linear size solve, line wrapping, fonts.ready gate, ResizeObserver, clamps, real-text a11y).
- **Phase 2**, `slab.js` refine: binary-search pass + variable-font `wdth`-axis path.
- **Phase 3**, `hypertype.css` core (type scale, measure caps, `font-variant-*` layer, balance/pretty, `@supports`-gated enhancements + fallbacks, token-budget gate).
- **Phase 4**, `micro.js` optional enhancement (hanging-punctuation polyfill, widow control, smart quotes, one composable DOM pass).
- **Phase 5**, `REFERENCE.md` (OpenType tag catalog, axis-to-property table, `@supports` gating + mid-2026 support reality, algorithm explainer).
- **Phase 6**, `SKILL.md` + chat paste-block from one source (seven anti-slop defaults, font-feature decision matrix, the inline-and-reach-for-slab workflow).
- **Phase 7**, Cross-harness verification (artifact-style HTML, no build, Chromium/Firefox/WebKit; confirm slab fits, OpenType renders, every Firefox fallback degrades cleanly, CSS-only subset works JS-free).
- **Phase 8**, Package + publish (cdnjs-publishable minified build, README inline-first usage, demo as canonical "what good looks like").

## Top risks

- **Token-budget creep** in `hypertype.css`, if it grows past the inline budget, the model omits it on chat artifacts and the system silently stops working. CI gate must be enforced, not advisory.
- **Webfont-load reflow**, measuring before `document.fonts.ready` is the single most common way naive slab implementations look broken. Easy for a sloppy re-emit to drop.
- **Firefox feature gaps are wide** (no `pretty`, no `text-box-trim`, no `initial-letter`, no hanging-punctuation, no `hyphenate-limit-chars`). Phase 7 must actually test Firefox, not assume it.
- **Skill-vs-paste-block drift**, the one-source generator must be the only way both are produced.
- **Behavioral risk**, a perfect kit the model never reaches for changes nothing. Skill trigger accuracy needs an eval pass.
