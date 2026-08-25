# 06 — Parity harness (the instrument phase 3 runs on)

Phase 3 asks whether the implementation matches the design. This file defines the **instrument** that
answers it. Without the instrument, phase 3 has an opinion, not a result.

> Written after a migration where the agent's harness compared text only, reported no mismatches, and
> the owner then found nine geometric defects by looking at the page:
> [postmortems/2026-08-25-geometry-blindness.md](../../postmortems/2026-08-25-geometry-blindness.md).

---

## 1. What the harness must compare

Four passes, in this order. **A later pass may not run while an earlier one has open findings** —
text styling on a node that sits in the wrong box is noise, and a box measured against a mistranslated
token is noise twice over.

```text
PASS 0  TOKENS      every utility class the export uses resolves to the same number on both sides
PASS 1  STRUCTURE   every Paper node exists, once, in the right order
PASS 2  GEOMETRY    every matched node's box and its container's spacing
PASS 3  APPEARANCE  type, colour, border, radius, shadow on matched nodes
```

Most migration defects live in PASS 2. It is the one agents skip, because text is easy to extract and
boxes are not. Most of *those* defects are caused by PASS 0 — one mistranslated token moves every
section at once, and pass 2 then reports the same cause forty times.

## PASS 0 — tokens (runs once, before any markup is transferred)

`get_jsx(format: "tailwind")` returns **lookups into Paper's theme**, not values. Print both sides for
every class the export uses and resolve every MISMATCH before implementation — the full contract and
the table format are in [01_DISCOVERY.md](01_DISCOVERY.md) §Token-parity check.

Extracting with `format: "inline-styles"` skips this pass by construction: absolute values have no
theme to disagree with. That is the reason it is the default extraction format.

---

## 2. PASS 1 — structure, over the node tree

Direction A is defined over **Paper nodes**, never over strings.

Build the reference inventory from MCP, recursively:

```text
get_children(artboardId)          → id, name, component, x, y, childCount
  ↓ recurse to leaves
inventory = [{ id, name, component, box, parentId, indexInParent }]
```

Then, for every node in the inventory, one of exactly three outcomes:

```text
MAPPED     → a live element is claimed for it (selector recorded)
DEFERRED   → recorded in the state file with a reason the owner can read
DEFECT     → nothing renders it, and nothing explains why
```

There is no fourth outcome, and **silence is not an outcome**. A node that is neither mapped nor
deferred is a defect, including:

* rules, hairlines, dividers, borders — a `border-top` is a node, not a decoration
* badges, chips, pills — including ones whose label is empty in the current data
* spacers, empty containers, alignment boxes — they carry the layout
* icons, dots, legend swatches
* scroll affordances, controls, and the second state of any switcher the artboard draws

Anything whose live counterpart cannot be found by a selector is a defect **whatever the reason** —
"the data is empty" is a phase-2 explanation, not a phase-1 mapping.

---

## 3. PASS 2 — geometry (the mandatory one)

For every MAPPED pair, compare the numbers below. Tolerance is **±2px**, and the report prints the
observed pair, not a verdict word.

### Per node

```text
x, y        relative to the node's own section origin (not the page — sections shift)
width, height
lineCount   ceil(height / lineHeight) — a wrap the artboard does not draw is a defect
```

### Per container (this is where the defects actually are)

```text
paddingTop / Right / Bottom / Left
gap (row-gap, column-gap)
content-box width
```

A container whose padding is wrong shifts every child, and each child looks individually fine
against its own neighbour. **Compare containers before children**, or the report will list forty
symptoms of one cause.

### Per section

```text
overflow:  child.right  >  parent.contentRight   (or child.left < parent.contentLeft)
bleed:     a full-bleed node's width vs the viewport width
```

Both directions matter. The 2026-08-25 page had a hero that did **not** reach the viewport edges
(white gutters) — an under-bleed, which no `scrollWidth > viewport` check can ever see.

### The check that catches the whole class in one line

```text
for every section: does its FIRST child start at the same x as the artboard's first child?
```

A single wrong value on a shared wrapper (`w-content` nested inside `px-7`, a token scale that maps
`px-7` to 28px instead of 64px) moves every section head at once. One assertion, whole class.

---

## 4. PASS 3 — appearance

Only on nodes that survived passes 1 and 2:

```text
font-family · font-size · font-weight · line-height · letter-spacing · text-transform
color · background · border-color · border-width · border-radius · box-shadow · opacity
```

Two traps this pass carries:

* **SVG fills are not `color`.** A chart label rendered as `<text fill="…">` reports `color:
  rgb(0,0,0)` on both sides regardless. Compare `fill`/`stroke` for SVG nodes.
* **Duplicate strings cross-match.** If the page shows `27°` twice, a text-keyed matcher pairs the
  wrong two and invents a mismatch. Key by node id (pass 1's mapping), never by string.

---

## 5. Rendering the reference

The comparison needs the artboard rendered at the artboard's own width, in a real browser.

**MCP screenshots and file exports are not interchangeable with the design.** Both are rasterisers
with their own fallbacks — a PNG export can render a display face with a system fallback, and an HTML
export can ship a stylesheet build that does not match the design tool's. When the reference and the
implementation disagree on something as basic as a font, resolve it with
`get_computed_styles(nodeId)` on the Paper node: **the file is the source of truth, its exports are
conveniences.**

If a downloaded export renders unstyled, fix the export's own harness (its CSS build, its font links)
in a **copy**. Never edit the owner's file, and never diff against a broken render.

---

## 6. Visual review — resolution rule

Never compare below **1:1**.

```text
too tall → split into crops of the same width, stack them vertically
too wide → the artboard width IS the width; do not fit it into a smaller frame
```

A composite that scales a 1440px section into a 660px half hides every defect smaller than ~4px and
softens every one smaller than ~20px. The agent that built such a composite in 2026-08 looked at it
honestly and saw nothing wrong — the picture had no defects left in it to see.

---

## 7. Reference implementation

Ship the harness with the migration, in the app's own repo (it needs the app's Playwright):

```text
tools/paper-parity/
  inventory.mjs   Paper node tree → JSON (via MCP output pasted or fetched by the agent)
  extract.mjs     live page → node records (box + computed styles), keyed by a data-attribute
  diff.mjs        passes 1-3, prints findings, exits non-zero on any DEFECT
  README.md       how to run, what each pass proves, what it cannot prove
```

**Mapping mechanism:** tag implemented nodes with the Paper node id
(`data-paper-node="DFV-0"`) as they are built. This is what makes pass 1 machine-checkable and pass 3
key-safe. It costs one attribute per node and turns "did I transfer everything?" from a memory
question into a set difference.

The attribute is added **when the node is written**, not in a later sweep — a sweep re-derives the
mapping from the same eyes that missed it the first time.

---

## Gate — the harness itself

Before phase 3 may report anything:

```text
✓ pass 0 ran (or was skipped by extracting inline-styles); zero token MISMATCH
✓ reference rendered at artboard width, in a browser, from the design (not from a stale export)
✓ pass 1 ran over the node tree; every node MAPPED or DEFERRED-with-reason
✓ pass 2 ran; container spacing compared before children; overflow AND bleed both checked
✓ pass 3 ran; SVG fills compared as fills; matching keyed by node id
✓ findings printed as observed pairs (paper → live), not as verdict words
✓ the report is attached to the state file
```

A phase-3 `pass` without this report is a **failure condition**, listed in
[03_EVAL.md](03_EVAL.md) §Failure conditions.
