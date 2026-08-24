# 02 — Implementation (Phase 2)

The first implementation pass reproduces the Paper UI and **nothing else**.

* Do not integrate backend logic during this pass.
* Do not refactor the application at the same time.
* Do not redesign.

---

# "UI only" does not mean "inert"

The line above is about *business logic*, not about whether the page works. Read as "no behaviour
at all", it produces a screenshot with a URL: cards that do not open, inputs that do not type,
toggles that do not toggle, a search button that searches nothing. That is not a migrated page —
it is a mockup that happens to be served over HTTP, and **it cannot be reviewed**, because the
only question a human can answer in front of it is whether it resembles the picture they already
have.

An affordance drawn in Paper is part of the UI, not part of the backend:

```text
in scope — a card links to the thing it depicts · inputs accept input · toggles change state
           · a control that navigates, navigates · the active/selected state a control shows
out of scope — new business rules · new endpoints · schema changes · auth flows
```

If reaching that bar needs the real list, the real photos or the real query, **wire them**. Reusing
a data path the application already has is not "integrating the backend"; it is the cheapest way to
make the page real, and it exposes what a mockup hides — an empty result, a name that overflows two
lines, a missing photo, a slow response.

The constraint that stays absolute is the visual one: **wiring data must not move the UI.** Keep
the artboard-comparison screenshots from before the wiring and prove the geometry did not drift
after it. That is what the reference artifacts are for.

**Ship a page a human can operate.** A review of an inert page tells you nothing you did not
already know from the export.

## Wiring brings the data. Paper still owns the labels.

Reusing the application's real data path is right — but the object you reuse often carries its
own field names, its own formatting, its own extra badge, alongside the values you actually
wanted. A currency symbol appearing on a card because the reused hotel-price component always
renders one, a score breakdown showing `WATER` / `NATURE` because that is what the reused presenter
calls its fields — neither was drawn in Paper, and both are now on the page because the data path
was adopted wholesale instead of read from.

```text
from the real data source — values: the number, the name, the count, the coordinate
from Paper                — labels, structure, which fields appear at all, formatting, presence
```

Wiring a reused component means mapping its values onto Paper's structure, not rendering the
component and calling the result wired. Re-run the bidirectional check (Direction B especially)
**after** wiring, against the live page with real data — not only after the static JSX pass. A
static pass has no prices, no badges, no currency symbols to leak; they only appear once a real
object is behind the card, which is exactly when Direction B needs to run again.

## Content count is an unavoidable state too

Viewport width was already established as unavoidable — something renders at every width whether
or not Paper drew that width. The same is true of any count real data decides: how many photos a
listing has, how many amenity chips it earns, how many list rows a section gets. Paper's artboard
shows *one* sample count; production data will not respect it, and it will sometimes land on an
edge Paper never pictured — three photos where the mock had five, one amenity where it had four.

Derive a layout rule for the realistic range of counts, the same way a breakpoint is derived for
the realistic range of widths — do not ship whatever a generic grid produces for the count the
artboard happened to have and call the gap between it and reality "not our data's fault."

## A migrated control may lead off the migrated page

Some controls' correct destination is a route this wave did not touch — a quiz that hands off to
an existing guide page, a "view all" that lands on an unmigrated list. The navigation is not wrong,
but a reviewer who lands there mid-flow experiences an abrupt design discontinuity and reasonably
reads it as broken, because from their side of the screen there is no difference between "correctly
left migrated scope" and "actually broken." Say so directly in the review request — name the
control and the fact that its destination is out of this migration's scope — instead of leaving the
reviewer to discover it by clicking and guess which one it is.

---

# JSX rules

The Paper JSX export is the primary structural reference.

**Preserve:**

* DOM hierarchy
* nesting
* element count
* element order
* wrappers
* containers
* semantic elements
* classes
* attributes
* responsive classes
* data attributes
* accessibility attributes

**Do not:**

* simplify JSX
* reorganize JSX
* merge wrappers
* remove wrappers
* add wrappers
* replace elements
* merge components merely for cleanliness
* split components merely for abstraction
# Styling rules

Preserve the visual result of the Paper export.

**Do not:**

* invent styles
* simplify styles
* optimize styles
* "clean up" styles
* rewrite layout
* normalize spacing
* replace custom controls with native controls
* replace visual components with defaults

Concretely:

```text
A native <select>        ≠  a custom Paper select
A generic button         ≠  a Paper button
A larger flexible input  ≠  a flex layout with a spacer node
```

---

# Structural fidelity

Preserve not only numeric style values but **the mechanisms producing the layout**:

* flex direction
* flex grow
* flex shrink
* flex basis
* grid structure
* spacer elements
* wrappers
* alignment containers
* explicit width constraints
* min / max widths
* positioning context

Do not copy only the visible numbers. Preserve the layout system.

---

# No UI invention

The following are **forbidden unless represented in Paper**:

buttons · icons · labels · controls · navigation · cards · badges · helper text · tooltips · dialogs ·
drawers · empty states · status indicators · additional actions · additional navigation · additional copy

If something is absent from Paper, it must not appear in the migrated state.

---

# Allowed technical differences

The implementation does not have to reproduce Paper's internal mechanism if the **rendered result is
identical**. These are acceptable:

* different React component boundaries
* different state management
* different API layer
* different portal mechanism
* different event handling

However:

```text
different implementation
≠
different UI
```

The rendered output must remain equivalent.

---

# Portals and DOM context

Special care is required for Radix portals, dialogs, drawers, popovers, dropdowns, tooltips and modals.

A portal can change CSS inheritance and variable scope. **Do not assume inherited CSS variables remain
available after portaling** — portal-rendered surfaces must be validated in the real browser
([03_EVAL.md](03_EVAL.md)).

Technical changes here are allowed only when necessary to preserve the exact Paper visual result.

---

## Gate — phase 2

```text
✓ Paper structure represented
✓ no unexplained extra UI
✓ no unexplained missing UI
✓ styling system preserved
✓ no NEW business logic, endpoints, schema or auth work in this phase
✓ the page is operable — affordances the artboard draws actually work
✓ wiring data did not move the UI (compared against the pre-wiring reference)
✓ state file updated
```

→ continue with [03_EVAL.md](03_EVAL.md).
