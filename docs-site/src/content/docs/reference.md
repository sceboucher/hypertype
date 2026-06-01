---
title: API & OpenType reference
description: slab.js and micro.js APIs, the CSS utility classes, variable-font axes, and the browser-support table.
---

## slab.js

```js
slabify(el, { min = 8, max = 1200, lineHeight = 0.88, refine = true, mode = 'auto' });
slabAll(selector = '[data-slab]', opts);   // every matching element
```

`slabify` canvas-measures the text, packs words into lines of equal width, sizes each line to fill the measure, gates on `document.fonts.ready`, reflows under `ResizeObserver` (width-guarded so it can't loop), keeps the real text for accessibility, and honors `text-transform`.

| Option | Default | Meaning |
|---|---|---|
| `min` / `max` | `8` / `1200` | font-size clamp (px), so one long word can't blow the layout |
| `lineHeight` | `0.88` | line-height for the stacked slab lines |
| `refine` | `true` | binary-search each line against real rendered metrics for sub-pixel-flush edges |
| `mode` | `'auto'` | `'auto'` prefers the width axis and falls back to font-size; force with `'width'` or `'size'` |

## micro.js

```js
micro(selector = '[data-micro]', { quotes = true, hang = true });
```

Pulls a leading quote into the margin so the text edge is optically flush, and curls straight quotes. No-ops where the browser hangs punctuation natively (Safari). Entirely optional.

## CSS utility classes

| Class | For |
|---|---|
| `ht` | base layer (kerning, ligatures, optical sizing, balanced headings, measure) on a wrapper |
| `ht-tnum` / `ht-data` | tabular figures / tabular + slashed zero |
| `ht-onum` / `ht-lnum` | oldstyle / lining figures |
| `ht-zero` | slashed zero |
| `ht-smallcaps` | true small caps |
| `ht-caps` | ALL-CAPS with case-sensitive forms + tracking |
| `ht-frac` | diagonal fractions (scope tightly) |
| `ht-justify` | justified body copy with hyphenation (needs a `lang` attribute) |
| `ht-dropcap` / `ht-hang` | drop cap / hanging punctuation |
| `ht-measure` / `ht-display` | readable measure cap / fluid display size |

## Variable-font axes

Prefer the mapped CSS property over raw `font-variation-settings`, which sets all axes at once and bypasses the cascade.

| Axis | Mapped property |
|---|---|
| `wght` | `font-weight` |
| `wdth` | `font-stretch` |
| `slnt` | `font-style: oblique <deg>` |
| `ital` | `font-style: italic` |
| `opsz` | `font-optical-sizing: auto` |
| `GRAD` | `font-variation-settings: "GRAD" <n>` (weight without reflow) |

## Browser support (mid-2026)

hypertype.css gates each progressive-enhancement feature behind `@supports` with a fallback, so the CSS-only subset is safe everywhere.

| Feature | Chromium | Safari | Firefox | Posture |
|---|---|---|---|---|
| `text-wrap: balance` | 114+ | 17.5+ | 121+ | ship unconditionally |
| `text-wrap: pretty` | 117+ | 17.5+ | no | enhancement; FF wraps normally |
| `text-box-trim` | 133+ | 18.2+ | no | gate; fall back to padding |
| `initial-letter` | 110+ | yes (`-webkit-`) | no | gate; fall back to float drop cap |
| `hanging-punctuation` | no | 10+ | no | Safari-only; `micro.js` covers the rest |
| `hyphens: auto` | 88+ | yes | 43+ | safe with a `lang` attribute |
| `font-optical-sizing` | 79+ | 14+ | 62+ | production-safe |
| `font-variant-*` | 52+ | 9.1+ | 34+ | production-safe |

The full OpenType tag catalog (high-level vs low-level mapping, stylistic sets, swashes, the must-use-the-raw-tag cases), the slab algorithm, and the borrow-vs-reject notes on existing tools are in [`docs/REFERENCE.md`](https://github.com/sceboucher/hypertype/blob/main/docs/REFERENCE.md).
