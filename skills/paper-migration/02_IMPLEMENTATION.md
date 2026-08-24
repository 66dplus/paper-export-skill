# 02 — Implementation (Phase 2)

The first implementation pass reproduces the Paper UI and **nothing else**.

* Do not integrate backend logic during this pass.
* Do not refactor the application at the same time.
* Do not redesign.

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

---

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
✓ no backend work performed in this phase
✓ state file updated
```

→ continue with [03_EVAL.md](03_EVAL.md).
