---
title: Getting started
description: Drop hypertype into one HTML file. No build step, no dependencies.
---

hypertype is meant to be pasted into a page rather than installed. That's deliberate: it's the one thing that works inside AI tools that emit a single HTML file and won't run a build or fetch a stylesheet. The kit is three small files; inline whichever you need.

| File | What it does | Gzipped |
|---|---|---|
| `hypertype.css` | OpenType utility classes, modular scale, `@supports`-gated enhancements | 1.8 kB |
| `slab.js` | justified display headlines | 3.2 kB |
| `micro.js` | hanging punctuation + smart quotes (optional) | 1.3 kB |

## The whole install

```html
<!-- 1. Paste hypertype.css into a <style> block; put class="ht" on a wrapper. -->
<div class="ht">
  <h1 data-slab>The future is unevenly distributed</h1>
  <p class="ht-justify" lang="en">Body copy with real hyphenation and a readable measure.</p>
  <table><tr><td class="ht-data">1,024.50</td></tr></table>
</div>

<!-- 2. Paste slab.js into a <script> and call slabAll(). -->
<script>/* …slab.js… */ slabAll('[data-slab]');</script>
```

That is it. No bundler, no dependencies, no network request.

## What each piece does

`class="ht"` on a wrapper turns on the safe defaults: kerning, contextual ligatures, optical sizing, balanced headings, a sensible line length, and tidier body wrapping.

`data-slab` marks a heading for the justified treatment. Call `slabAll('[data-slab]')` once after the script loads, and try it in the [playground](/hypertype/playground/).

The utility classes put each OpenType feature where it belongs: `ht-tnum` in tables, `ht-onum` in prose, `ht-data` for IDs and money, `ht-smallcaps` for acronyms, `ht-caps` for all-caps, `ht-frac` for recipes, plus `ht-justify`, `ht-dropcap`, and `ht-hang`. They're all in the [gallery](/hypertype/opentype/).

## A ready-made template

The repository ships a fully self-contained `dist/hypertype-inline.html` with the CSS and the slab engine already inlined. Copy it, replace the headline, done.

## Using it with AI

If you use Claude Code or another AI coding tool, install the [skill](/hypertype/skill/) and the model will reach for hypertype automatically when you ask for headlines, hero sections, or editorial layouts.
