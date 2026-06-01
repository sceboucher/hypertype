---
description: 'hypertype: intentional web typography, justified display headlines and the underused OpenType features.'
applyTo: '**/*.{html,htm,css,scss,less,jsx,tsx,vue,svelte,astro,md,mdx}'
---

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
