# Using hierarchy well

Hierarchy is not a property of any single element; it lives in the relationships between
elements on the screen. The common automated failure is to make everything roughly
equal, lean only on size and bold, and never establish a deliberate order. This file is
the fix. The companion [TYPE-SYSTEMS.md](TYPE-SYSTEMS.md) builds the scale; this one puts
it in relationship.

The `critique_hierarchy` MCP tool detects most of the failures below directly from
rendered CSS, so you can check a layout instead of eyeballing it.

---

## 1. Establish one primary per view

Every screen has a single most-important thing. Decide what it is before styling
anything, then make it unambiguously dominant. If two elements compete for "loudest,"
the hierarchy has already failed. This is the highest-leverage decision and the most
common thing automated output gets wrong: it spreads emphasis evenly and leaves the eye
with no entry point.

---

## 2. Reach for weight and space before size

The contrast tools, in the order an expert reaches for them:

1. **Weight** (400 against 700+, sometimes 200 against 800)
2. **Space** (proximity and separation)
3. **Value / color** (step secondary text down to a lighter tint)
4. **Size**
5. **Style** (italic, small caps, case)
6. **Typeface** (display against text)

Automated output reaches for size and bold and stops. Weight and space do most of the
work without disturbing the document's flow, and value is the single most underused
lever. As much variation as necessary, as little as possible.

To make a level decisive, stack two or three signals in the same direction (bigger plus
bolder plus more space above). To keep a level subtle, isolate one signal (space alone,
or a weight bump at the same size).

---

## 3. The relationship targets

Hierarchy is in the gaps between levels, so set the gaps deliberately:

- **Size:** adjacent levels differ by at least one scale step (~1.2x). A 16px to 18px
  jump (1.125x) reads as a mistake, not a level. If you cannot make a clean size step,
  switch tools (weight or space) rather than nudging.
- **Weight:** jump at least 300 on the numeric axis (400 to 700), not 400 to 500.
  Adjacent 400/500 is invisible at reading distance.
- **Value:** secondary and tertiary text steps down in value (body near-black, meta and
  captions a mid gray). Lower contrast reads as lower in the hierarchy.
- **Space encodes grouping.** Equal gaps say "same group"; a larger gap says "new
  section." Build all spacing on one 4px or 8px unit so the rhythm stays predictable.
- **Headings bind downward.** Space before a heading should be at least twice the
  paragraph spacing, and greater than the space after it. A heading belongs to the
  content below, so it sits closer to its body than to the section above. Symmetric
  heading margins are a top automated tell.

Named patterns worth reusing:

- **Eyebrow -> headline -> dek.** A small uppercase letter-spaced label (category, three
  to five words), then the headline carrying the message, then a deck that expands it.
  The eyebrow is distinguished by case, tracking, and color, never by being large.
- **Label + value (data UI).** The value is prominent; the label is the small, quiet
  one. Inverting this (a bold label over a plain number) is a frequent automated error:
  the data is the hero, the label recedes.

Reading comfort: cap the measure at 50-75 characters (`max-width: ~65ch`), with body
line-height 1.5 - 1.8 for long-form and tighter for headings and dense UI.

---

## 4. Per-context playbooks

An expert reads the surface first, then picks a strategy. The same scale is wrong in
different contexts.

- **Editorial / long-form.** Comfort and a deep but quiet hierarchy. Wide ratio, body
  18-21px, leading 1.6 - 1.8, measure 60-75ch. Few but strong levels; subheads lean on
  weight and space rather than huge sizes. Whitespace is the main tool.
- **Marketing / landing.** Maximal contrast, one hero, ordered for conversion. Dramatic
  ratio, one enormous headline with no competition, the eyebrow -> headline -> dek -> CTA
  stack. The risk is multiple competing heroes; enforce exactly one.
- **Dashboard / data-dense.** Tight and restrained, data as hero. Small ratio, one
  typeface, three weights or fewer, four sizes or fewer. Hierarchy from weight, value,
  and alignment rather than size. Tabular figures on numeric columns. The dominant
  element is the most important metric or action, never a decorative chart title.
- **Forms.** Linear flow, grouping over drama. Title 24-32px, section headers 18-24px,
  labels 14-16px and consistently quiet. Group related fields by proximity. One primary
  action (submit) visually dominant; secondary actions recede.
- **Documentation.** Scannable and navigable. Three bands: attention (H1/H2, sparing),
  structure (H3-H5 and section labels, the scannability layer), and reading (body, small,
  captions). Strict, predictable heading steps; space before far greater than space
  after. Cap at four or five heading levels even for deep content.

---

## 5. The squint test and the failure checklist

Blur the design (or squint). Only size, weight, value, and position survive a blur. If
the primary element is not still the most prominent when blurred, the hierarchy is
decorative, not functional. Adjacent levels that look identical when blurred are not
actually two levels.

The detectable failure modes (`critique_hierarchy` flags these):

1. **Flat hierarchy:** adjacent levels differ by under 1.2x size and under 300 weight,
   with no value change. The most common failure.
2. **Bold-only hierarchy:** every level is the same size and color, separated only by
   weight.
3. **Insufficient step:** 16px to 18px sizes, 400 to 500 weights. Increments that read
   as inconsistency.
4. **Symmetric heading margins:** equal space above and below a heading. Headings should
   bind downward.
5. **Too many focal points:** several elements at near-equal prominence, no single
   primary; or visual weight on a low-value element while the real action is small.
6. **Too many levels:** more than five distinct text styles, or more than three weights
   or colors in one view. Distinctions stop registering.
7. **No measure / broken rhythm:** body lines past 75ch, arbitrary off-scale spacing, one
   line-height across both display and body.
8. **Inverted data pairs:** labels bolder or larger than their values.
