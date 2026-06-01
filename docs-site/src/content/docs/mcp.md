---
title: The MCP server
description: A local MCP server that verifies fonts against the real file, generates type systems, and critiques hierarchy. Ten tools, no API key.
---

The skill tells a model to verify a font carries a feature before using it. [`@sceboucher/hypertype`](https://www.npmjs.com/package/@sceboucher/hypertype) lets it actually check. It is a local MCP server (runs over stdio via `npx`, no API key, no hosting) that reads the OpenType features and variable axes straight from the served font file. So `font-variant-caps: small-caps` on a font with no small caps comes back as a real warning instead of a silent fake.

It does three jobs: **verify** what a font can do, **generate** a type system that's guaranteed renderable, and **critique** the hierarchy of CSS you already have. Running locally is also the only way to analyze your installed and Adobe-activated fonts (they live in the OS font directory, where a hosted server can't see them).

## Install

```sh
npx -y @sceboucher/hypertype install
```

Or point any AI assistant at the [install runbook](/hypertype/install/). In Claude Code: `claude mcp add hypertype -- npx -y @sceboucher/hypertype`.

## The ten tools

### Verify

| Tool | What it does |
|---|---|
| `analyze_font` | Report the OpenType features and variable axes a font actually ships, read from the served file. Accepts a Google family name, a font URL, or an installed family name. Catches the Google reduced-subset gotcha. |
| `check_css` | The no-op catcher. Check every `font-variant-*` / `font-feature-settings` declaration against the font's real features and report whether each **resolves**, is a silent **no-op**, or is **degraded** (the browser synthesizes a faked small-caps). |
| `slab_readiness` | Whether a font ships a width axis, so `slab.js` can do the authentic same-cap-height justified slab instead of scaling font size per line. |
| `font_license` | OFL / Apache (self-hostable) vs Adobe (CDN-only) vs verify. The "safe to ship in a repo?" check. |

### Generate

| Tool | What it does |
|---|---|
| `recommend_css` | Turn a plain-language intent ("tabular figures and a slashed zero") into correct `font-variant-*` CSS, verified against the font. Features it lacks are reported, not emitted as CSS that silently fails. |
| `design_type_system` | Emit a context-fit type system: a scale ratio chosen for the surface, role tokens (size, line-height, weight, tracking), rem-safe fluid `clamp()`, the OpenType features that context calls for, and ready CSS. Proposed fonts are verified, so the system is guaranteed renderable. |
| `pair_fonts` | Suggest a display + text pairing where both fonts carry the features you need, drawn from a de-AI'd shortlist and verified against the served files. |

### Critique and discover

| Tool | What it does |
|---|---|
| `critique_hierarchy` | Analyze CSS or an HTML document and flag the known hierarchy tells (flat hierarchy, bold-only hierarchy, sub-1.2x size steps, symmetric heading margins, too many styles, one global line-height, runaway measure). Each finding includes a fix. |
| `list_sources` | Which font sources this machine can reach: Google and URLs always; Adobe and installed fonts only because the server runs locally. |
| `find_fonts` | Find fonts that carry a set of OpenType features (and optional axes) across the sources you have, from a prebuilt verified index. "Which fonts ship real small caps and a slashed zero?" |

## How it works

The server reads the OpenType `FeatureList` (GSUB/GPOS) and `fvar` axes straight from the sfnt bytes, decompressing woff2 first. That is deliberate: the high-level font libraries under-report features on Google's woff2, and the Google CSS API serves a reduced subset (for example, Source Serif 4 ships neither small caps nor a slashed zero in Google's file). Analyzing the file the browser actually loads is the only honest answer.

The judgment behind `design_type_system` and `critique_hierarchy` is written up in two guides: [building a type system](/hypertype/type-systems/) and [using hierarchy well](/hypertype/hierarchy/).

Full tool schemas and config are in the [package README](https://github.com/sceboucher/hypertype/tree/main/mcp).
