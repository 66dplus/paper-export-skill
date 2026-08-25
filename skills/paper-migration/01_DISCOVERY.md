# 01 — Discovery & Paper Extraction (Phases 0–1)

Covers **PHASE 0 — project inspection** and **PHASE 1 — Paper extraction**.
Nothing is implemented here. No file is modified in phase 0.

---

# PHASE 0 — PROJECT INSPECTION

Before changing any code, inspect the application and record:

* framework
* React version
* TypeScript usage
* routing system
* styling system
* CSS architecture
* Tailwind usage
* existing design tokens
* component library
* data-fetching layer
* state-management layer
* authentication
* the relevant route
* the relevant existing components

**Do not modify code during this phase.**

## Styling system detection

Determine what styling system the project *actually* uses — Tailwind, CSS Modules, global CSS, a
component library's styling, styled-components, or something project-specific.

Do not assume the styling system from filenames alone. Inspect real usage.

## Paper styling format

Paper exports the same design two ways, and the choice is **not** cosmetic:

```text
format: "inline-styles"   → absolute values   style={{ paddingInline: '64px' }}
format: "tailwind"        → class names       className="px-7"
```

### A class name is not a value. It is a lookup into Paper's theme.

`px-7` in a Paper export means whatever `--spacing-7` is **in that design file**. In a default
Tailwind scale it means 28px. In the file that produced this rule it meant 64px. Copy the class into
an app whose theme differs and every transferred value silently changes: the class exists, the code
compiles, the linter is happy, and the page is wrong by 2.3×.

This is the most expensive failure mode in the whole skill, because it is **invisible per element and
global in effect** — one theme mismatch moves every section on the page, and each element still looks
correct beside its own neighbour. The earlier version of this file said *"React + Tailwind project →
use the Tailwind representation"* and stopped there. That instruction produced a page where every
section head sat at 28px instead of 64px, and no gate could see it.

### Default: extract with `inline-styles`

```text
get_jsx(nodeId, format: "inline-styles")
```

Those numbers are the **contract**. Whatever representation the app finally ships, parity is measured
against the numbers, never against the class names.

### Then choose what the app ships — and prove it either way

```text
A. Ship the absolute values (inline styles / a scoped stylesheet built from them)
   + deterministic, no theme to disagree with
   − cannot express breakpoints, hover/focus states
   − many repos' lint gates forbid inline styles in product source

B. Ship the project's own utility classes
   + responsive variants, states, and the repo's conventions come for free
   − REQUIRES the token-parity proof below before a single component is written
```

Most real migrations end at B — a responsive page needs media queries, and a repo gate usually bans
inline styles. That is fine. What is not fine is arriving at B **without the proof**.

### Token-parity check (blocking, before implementation)

Collect every utility class the export uses, and print both sides:

```text
class        Paper value      app value      verdict
px-7         64px             28px           MISMATCH  ← blocks implementation
gap-3        14px             12px           MISMATCH
text-body    15px             15px           ok
rounded-panel 4px             4px            ok
```

Any MISMATCH is resolved **before** transferring markup, by one of:

* porting Paper's `@theme` block verbatim into a scope the migrated page lives in, or
* rewriting the class to the app's equivalent that resolves to Paper's number, or
* falling back to the absolute value for that property.

Resolving it afterwards means finding it as forty separate visual defects instead of four table rows.

### Large or deep artboards

Extract and transfer **per section**, not per artboard. A 8000px-tall artboard exported in one call
produces a tree too large to transfer attentively, and the nodes that go missing are the ones nobody
looked at twice. One Paper frame → one extraction → one component → one parity run.

---

Never blindly convert between styling systems.
Never regenerate an existing Paper representation because another format looks cleaner.
Never let a class name stand in for a number that has not been checked.

---

# PHASE 1 — PAPER EXTRACTION

The design MUST be extracted before it is implemented.

For each target artboard / frame:

1. Identify the exact Paper node.
2. Read the relevant Paper structure.
3. Obtain the Paper **screenshot**.
4. Obtain the Paper **JSX export**.
5. Inspect the tree / hierarchy when necessary.
6. Inspect computed styles only where needed for verification or ambiguity.
7. Identify the visual states the artboard represents.

## MCP-first policy

If information is available through Paper MCP, retrieve it through Paper MCP.

* Never **infer** information that can be obtained directly.
* Never **approximate** information that can be obtained directly.
* Never **manually recreate** information that can be exported directly.

Preference order:

```text
1. Paper-exported JSX
2. Paper-exported styling
3. Paper node / tree information
4. Paper computed styles
5. Agent-generated implementation   ← last resort only
```

## Computed styles are not the primary source

`get_computed_styles` is a **verification and diagnostic** tool. It is not a replacement for the Paper
JSX structure.

Do not take individual numbers from computed styles and rebuild the interface by hand. A value without
its structural context is insufficient:

```text
width: 280px
```

is not equivalent to preserving

```text
width: 280px
flexShrink: 0
```

plus the surrounding layout and spacer nodes.

## Artifacts

For every migration unit, keep:

```text
Paper screenshot
Paper JSX
Paper hierarchy / tree information
relevant style information
the identified visual state
```

These are the reference artifacts for the Eval in [03_EVAL.md](03_EVAL.md). Record their presence in
`.paper-migration-state.json` under `phases.1_paper_extraction.artifacts`.

---

# MIGRATION UNIT

Never migrate a large application as one uncontrolled task.

A migration unit is:

```text
one artboard  +  one route  +  one explicit UI state
```

Examples:

```text
Login    — default
Beaches  — populated
Ratings  — populated
Hotels   — selected
Hotels   — drawer open
```

**Do not assume one artboard represents every state of the application.**

---

# STATE INVENTORY

Before implementing, build a state inventory for the route:

```text
Hotels

1. initial
2. loading
3. empty
4. populated
5. selected
6. drawer open
7. error
```

For every state:

```text
Paper design exists          → migrate it
Paper design does not exist  → do not invent it
```

An undefined state is marked explicitly, and recorded in the state file under `out_of_scope_states`:

```text
OUT OF SCOPE — NO PAPER DESIGN
```

## Not every undefined state may be declared out of scope

Separate undefined states into two kinds before using that label:

```text
avoidable    — the app can decline to enter it   (a drawer, an empty list, an error panel)
unavoidable  — it renders whether or not Paper drew it
               (every viewport width · every focus ring · every text length the data produces)
```

`OUT OF SCOPE — NO PAPER DESIGN` is legitimate **only for an avoidable state**. For an
unavoidable one there is no "not designed" option — something will render, and declining to
decide means shipping whatever falls out by accident.

For an unavoidable state: derive it from the artboards you do have, record the derivation, and
raise it with the derivation **already implemented**. Never use "Paper does not define it" as a
reason to ship the undefined behaviour and hand the owner a question instead of a page.

## "Paper does not define it" is not the same as "the human must decide it"

The same confusion has a second form, and it produces question lists instead of work.

Most things an artboard leaves unspecified have exactly **one** sensible answer, and it follows
from the product rather than from taste: a Search button searches · a card links to the thing it
depicts · a Grid/Map toggle goes to the map · an English page is in English · "Load more" loads
more. Asking about these is not caution. It is handing back work.

Run every "Paper does not say" through one test:

```text
Does the product's own logic give this exactly one reasonable answer?
   yes → implement it, record it as a derivation, do not ask
   no  → it is genuinely the human's call, ask
```

What survives the test is narrow: taste, strategy, money, anything irreversible, and choices
where two answers are both defensible and lead to different products. Everything else is the job.

**A report field named "owner decisions" tends to get filled.** If the deliverable asks for such
a list, each entry must carry the reason it failed the test above — otherwise the list silently
becomes a place to park ordinary engineering.

## Artboards contain mockup artefacts, not only design intent

An artboard is a drawing, and drawings carry incidental properties the designer never meant as
spec: two languages mixed on one screen because the mockup was assembled from parts, lorem
placeholders, a schematic count, a stray alignment. Transcribing those faithfully reproduces the
accident, not the design.

Separate the two before implementing:

```text
design intent   — the artboard states it on purpose (layout, type, colour, order, affordances)
mockup artefact — a property of how the drawing was assembled, not of the product
```

When something reads as an artefact, resolve it from the product (a localized page is in one
language) and record that you did. Ask only when you genuinely cannot tell which it is. Paper
sometimes says so itself — a schematic value may carry an annotation naming it as such; read the
annotations before treating a number as a fact.

---

# RESPONSIVE CONTRACT

An artboard is a **composition sampled at one width**, not a layout that exists only at that
width. A 1440 desktop artboard and a 390 mobile artboard define two compositions, and the browser
renders one of them at **every** width in between. Those widths are an unavoidable state.

Before implementing, write down which range each composition owns, and record it in the state file:

```text
mobile composition    390 → N-1
desktop composition   N   → ∞
```

Then decide how the design scales inside each range:

* **An artboard's pixel widths are proportions of that artboard's content box, not constants.**
  `820px` inside a `1312px` content box is `62.5%`. Reproduce the proportion; the artboard width
  is the anchor at which it must still equal the original number *exactly*.
* **Compute the hard minimum before choosing the breakpoint.** Sum the widest fixed run in the
  artboard (`padding + columns + gaps`). Transcribed literally, that sum is the narrowest width at
  which the composition fits.
* **Display type scales with the composition; small UI text does not** (labels, captions, body
  ≤ 17px are one size in both artboards — leave them alone).

**A breakpoint set to "where the fixed widths stop fitting" is a bug, not a measurement.** That
number is an artefact of transcription, and it routinely lands above ordinary laptop widths —
handing 1200–1380px viewports the phone composition stretched across the screen. If the computed
minimum lands anywhere near common viewports, the literal transcription is the wrong reading:
scale the proportions instead, and keep the artboard width as the exactness anchor.

---

# Existing application UI is not automatically reusable

Existing DOM structure may differ from Paper. Existing CSS may conflict with Paper. Existing components
may contain elements that do not exist in Paper.

Do not preserve an existing implementation merely because it already exists. If the Paper structure
differs, **replace the relevant UI subtree with the Paper structure.**

Reuse an existing component only when its rendered structure and behavior are compatible with Paper.

---

## Gate — phases 0 and 1

```text
✓ project inspected; framework, styling system, routing and data layer recorded
✓ nothing modified during phase 0
✓ target artboard identified
✓ Paper JSX obtained
✓ Paper screenshot obtained
✓ hierarchy inspected
✓ styling information obtained
✓ UI state identified
✓ state inventory written; undefined states marked OUT OF SCOPE
✓ state file updated
```

→ continue with [02_IMPLEMENTATION.md](02_IMPLEMENTATION.md).
