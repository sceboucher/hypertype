# Building a type system

How to emit a coherent type system instead of scattering one-off font sizes, and how
to know when context earns a deliberate break from it. The companion to
[HIERARCHY.md](HIERARCHY.md): this file is about the system, that one is about the
relationships inside it.

The discipline in one line: **build the system first, then break it on purpose.** A
scale you can defend makes every deviation intentional and traceable. Scattered sizes
make every choice a guess.

---

## 1. Pick the scale ratio for the context

A type scale is a base size and a ratio. Each step multiplies the last. One ratio does
not fit every surface: tighten it as density rises, widen it as the surface gets
expressive.

| Context | Ratio | Feel |
|---|---|---|
| Data-dense dashboard, tables | 1.125 | Restrained; sizes stay close so density survives |
| Product UI | 1.2 | Calm, utilitarian |
| Balanced default (unsure) | 1.25 | Safe general-purpose |
| Content sites, documentation | 1.333 | Confident hierarchy |
| Editorial, long-form | 1.414 - 1.5 | Generous, room to breathe |
| Marketing, landing | 1.5 - 1.618 | Dramatic, display-led |

If a dashboard feels bloated, the ratio is too wide or the leading too loose. If a
landing page feels flat and generic, the ratio is too tight, the display step is
missing, or the weights are not extreme enough.

Base size: 16px body is the browser default and the accessibility floor. Editorial can
push body to 18-19px; dense UI can drop to 14px.

---

## 2. Model type as roles, not per-element sizes

Mature systems name a small set of roles, each bundling size, line-height, weight, and
tracking under one token. Generate the token set first, then reference it everywhere. A
focused product needs about six roles; only a sprawling system needs fifteen.

A worked reference scale (Material 3 values), useful as a starting point:

| Role | Size | Line-height | Weight | Use |
|---|---|---|---|---|
| Display | 57 / 45 / 36px | ~1.15 | 400-800 | One hero moment per view |
| Headline | 32 / 28 / 24px | ~1.25 | 600-700 | Section openers |
| Title | 22 / 16 / 14px | ~1.3 | 500-600 | Card and block headings |
| Body | 16 / 14px | ~1.5 | 400 | Running text |
| Label | 14 / 12 / 11px | ~1.4 | 500 | UI, captions, meta (slight positive tracking) |

The numbers are a starting point, not scripture. The point is that a role carries its
whole style, so a heading is never a one-off guess.

---

## 3. Line-height is a function of size

Leading is inverse to size. A single global `line-height: 1.5` makes headlines look
loose and is a reliable tell that no system is present.

- Body and labels: 1.4 - 1.6 (1.5 is a good default).
- Titles: ~1.3.
- Headlines and display: 1.05 - 1.25 (tighter as the type gets bigger).

Long-form body can go to 1.6 - 1.8 for reading comfort; dense tables tighten to ~1.4.

---

## 4. Fluid type, the zoom-safe way

For display and marketing type, `clamp()` lets a size scale with the viewport with no
breakpoints. Two rules keep it accessible:

- Use `rem`, not raw `px`, so user font-size preferences still apply.
- The preferred (middle) value of `clamp()` must mix `rem` **and** `vw`. A pure-`vw`
  preferred value breaks zoom and fails WCAG 1.4.4.

The Utopia two-anchor method: pick a small and a large viewport, a size at each, and let
the slope interpolate. A correct result looks like:

```css
--text-display: clamp(2.25rem, 1.4rem + 4.2vw, 3.75rem);
```

Reach for fluid type on display and hero roles. Keep fixed steps inside dense UI and
tables, where fluid scaling is noise and a density liability.

The `design_type_system` MCP tool emits these clamps already rem-safe; you do not have
to compute the slope by hand.

---

## 5. Build, then break

Use a layered token model: primitive values feed role tokens feed component overrides.
You break at the component layer, never by editing a primitive.

**Follow the role token by default.** A paragraph, a list item, a form label, a table
cell: these are generic instances of their role. Reaching for a custom size here is the
smell, not the discipline. This covers the large majority of text.

**Break deliberately when context changes the job of the text:**

- **Hero / above the fold** -> go beyond the top role. Fluid display type, extreme
  weight, tight leading. The scale's job is rhythm in body copy, not a ceiling on a hero.
- **Editorial / long-form** -> wider ratio, generous leading (1.6 - 1.8), oldstyle
  figures, drop caps, hanging punctuation, a serif display face.
- **Data-dense** -> tighter than the system default. Smaller body, ~1.4 leading,
  tabular figures. Density is the requirement, not an exception.
- **A single distinctive moment** (a pull-quote, a stat callout, a 404) -> a bespoke
  size is correct. Do not force it onto a token.

**Two-scale rule:** a product with both a marketing surface and a dense app should ship
two scales in one system, a tight ratio for the app chrome and a wide ratio for content.
That is the standard reconciliation, not a hack.

The rule of thumb: emit the token set, use it by default, and override only at the
component layer with a named reason (hero, table, pull-quote). Never scatter arbitrary
`font-size` values, that is how a system silently dissolves.

---

## 6. Choosing the fonts

State the type direction before writing any CSS, for example: "Direction: editorial.
Display Newsreader, text Source Serif 4." That one sentence forces an intentional
choice instead of a reflexive default.

Map an aesthetic direction to a small, vetted shortlist rather than reaching for the
fonts that dominate every tutorial. Deliberately skip the reflexive picks (Inter,
Roboto, Open Sans, Lato, system stacks) and the over-used display faces (Fraunces,
Space Grotesk, Instrument Serif). A starting map:

| Direction | Display | Text |
|---|---|---|
| Editorial | Newsreader, Spectral, Bodoni Moda | Source Serif 4, Spectral |
| Technical | IBM Plex Sans/Serif, Archivo | IBM Plex Sans, Source Sans 3 |
| Grotesque | Archivo, Hanken Grotesk, Schibsted Grotesk | Hanken Grotesk, Asap |
| Expressive display | Bricolage Grotesque, Big Shoulders, Unbounded | Hanken Grotesk |
| Serif display | DM Serif Display, Bodoni Moda, Newsreader | Source Serif 4 |
| Code | JetBrains Mono, IBM Plex Mono | JetBrains Mono, Fira Code |

High typeface contrast reads as intentional: pair a display face against a text face
(serif against grotesque, display against mono), keep emphasis in the same family
(italic or bold), and never drop a foreign serif word into a sans headline.

A font only delivers a feature if its served file actually carries it. Before you rely
on small caps, oldstyle figures, a slashed zero, or a width axis, verify with the
`analyze_font` MCP tool (or the `design_type_system` tool, which verifies the fonts it
proposes). The most common silent failure is a Google subset that ships fewer features
than the foundry's full release.
