<div align="center">

# hypertype

### Justified display headlines and the OpenType features almost nobody turns on.<br>For AI coding tools, and the humans cleaning up after them.

[Docs](https://sceboucher.github.io/hypertype/) · [Install](https://sceboucher.github.io/hypertype/install/) · [MCP server](https://sceboucher.github.io/hypertype/mcp/) · [Guides](https://sceboucher.github.io/hypertype/type-systems/) · [Reference](https://sceboucher.github.io/hypertype/reference/)

![MIT License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Zero dependencies](https://img.shields.io/badge/kit_dependencies-0-brightgreen?style=flat-square)
![~6 kB gzipped](https://img.shields.io/badge/kit_gzipped-~6%20kB-brightgreen?style=flat-square)
![53 tests](https://img.shields.io/badge/tests-53%20passing-brightgreen?style=flat-square)
[![npm](https://img.shields.io/npm/v/@sceboucher/hypertype?style=flat-square&color=cb3837&label=npm%20mcp%20server)](https://www.npmjs.com/package/@sceboucher/hypertype)

</div>

CSS can justify a paragraph but not a display headline. There is no way in plain CSS to make every line of a big heading stretch to fill the column the way a magazine does. hypertype does that, and turns on the OpenType features most generated markup ignores: tabular and oldstyle figures, real small caps, fractions, a slashed zero. It is built to survive the AI tools that write a whole HTML file at once and won't run a build.

## Before and after

<div align="center">

| Plain CSS | With hypertype |
|:---:|:---:|
| <img src="docs/media/before.png" width="380" alt="An editorial layout in a default sans-serif at one heading size"> | <img src="docs/media/after.png" width="380" alt="The same layout with a justified headline, drop cap, small caps, and OpenType figures"> |

</div>

Same words, same layout. The only thing that changed is the type: a justified headline, a serif at a sane line length, a drop cap, small caps on the labels, figures that line up, and quotes that hang into the margin.

## What you get

hypertype is three things that share one source:

- **An inline kit** you paste into a page (`hypertype.css` + `slab.js` + `micro.js`, about 6 kB, zero dependencies). The justified-slab headline CSS can't do, plus OpenType utility classes that compose. The one format that lands in AI tools that won't run a build or fetch a stylesheet. → [Getting started](https://sceboucher.github.io/hypertype/getting-started/)
- **An agent skill**, so Claude and other AI coding tools reach for intentional typography on their own when you ask for a headline, a hero, an editorial layout, or "make the type less generic." → [Use as a skill](https://sceboucher.github.io/hypertype/skill/)
- **A local MCP server** (`@sceboucher/hypertype`, ten tools) that verifies fonts against the real served file, generates context-fit type systems, and critiques typographic hierarchy. No API key, no hosting. → [The MCP server](https://sceboucher.github.io/hypertype/mcp/)

The typographic judgment behind the skill and the server is written up in two guides: [building a type system](https://sceboucher.github.io/hypertype/type-systems/) and [using hierarchy well](https://sceboucher.github.io/hypertype/hierarchy/).

## Install

Point any AI assistant at one file:

> "Set up hypertype by following https://raw.githubusercontent.com/sceboucher/hypertype/main/INSTALL.md"

It figures out its own tool and installs the server and skill. Or do it yourself in one command:

```sh
npx -y @sceboucher/hypertype install
```

That detects your tools (Claude Code, Claude Desktop, Cursor, VS Code), registers the MCP server, and installs the skill. Per-tool steps, the chat-only paste path, and the one-click buttons are on the [install page](https://sceboucher.github.io/hypertype/install/).

## Use the kit by hand

If you just want the typography in one file, paste the inline bundle:

```html
<!-- Paste hypertype.css into a <style> block; put class="ht" on a wrapper. -->
<div class="ht">
  <h1 data-slab>The future is unevenly distributed</h1>
  <p class="ht-justify" lang="en">Body copy with real hyphenation and a readable measure.</p>
</div>
<script>/* …slab.js… */ slabAll('[data-slab]');</script>
```

A ready-to-copy file is at [`dist/hypertype-inline.html`](dist/hypertype-inline.html). The full `slab.js` / `micro.js` API, the utility classes, the OpenType tag catalog, and the browser-support table live in the [reference](https://sceboucher.github.io/hypertype/reference/) (deep version: [`docs/REFERENCE.md`](docs/REFERENCE.md)).

## Develop

```bash
npm test       # node --test, 30 tests, zero deps
npm run build  # regenerate the skill, the inline bundle, and the docs-site guides
```

`build/generate.mjs` keeps `SKILL.md`, the paste-block, and the guide pages in sync with their sources, so nothing drifts. The MCP server lives in [`mcp/`](mcp/) with its own suite (`cd mcp && npm test`) and [README](mcp/README.md). Design notes are in [`docs/SYNTHESIS.md`](docs/SYNTHESIS.md); how it was tested is in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## License

[MIT](LICENSE)
