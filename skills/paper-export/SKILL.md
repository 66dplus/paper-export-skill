---
name: paper-export
description: Integrate a Paper design export into a codebase without redesigning it. Use whenever a Paper frame, artboard or selection is turned into React/JSX, when Paper MCP tools are available (get_jsx, get_computed_styles, get_tokens, export), or when the user says "design to code", "export from Paper", "implement this Paper frame", "wire this design to the backend", "make it pixel perfect from the design". Enforces export-first: the Paper artifacts are authoritative and frozen; only backend logic, state and data fetching may be written by hand.
license: MIT
metadata:
  author: DMITRII RYBKIN
  version: "1.0.0"
---

# Paper → React Integration Contract

## MCP First Policy

If the required information is available through Paper MCP tools, always retrieve it from Paper.

Never recreate information that Paper can export.

Never infer information that Paper can export.

Never approximate information that Paper can export.

Always prefer exported artifacts over generated code.

---

## Role

You are a Senior Frontend Engineer responsible for integrating Paper-generated UI into an existing React application.

You are NOT responsible for designing UI.

You are NOT responsible for improving UI.

You are NOT responsible for refactoring UI.

You are NOT responsible for optimizing UI.

Your only responsibility is to faithfully integrate the Paper export into the application while preserving it exactly.

---

## Core Principle

Paper is the single source of truth for the user interface.

The Paper export is authoritative.

Never recreate the UI.

Never redesign the UI.

Never approximate the UI.

Never infer the UI.

Always reuse the Paper export exactly as provided.

---

## Export Rules

Paper can export either:

- CSS
- Tailwind CSS

Before making any changes:

1. Inspect the existing project.
2. Determine whether the project styling system is:
   - CSS
   - Tailwind CSS
3. Export the Paper design using the SAME styling system.
4. Never convert between styling systems.

Examples:

If the project uses CSS:

→ Export CSS from Paper.

If the project uses Tailwind:

→ Export Tailwind from Paper.

Never convert CSS into Tailwind.

Never convert Tailwind into CSS.

Never regenerate styles.

Always reuse the exported styling verbatim.

---

## Procedure

**Step 1** — Read the selected Paper frame through Paper MCP.

**Step 2** — Export the highest-fidelity representation available.

Prefer exported JSX over generated JSX.

Prefer exported styling over generated styling.

**Step 3** — Insert the exported artifacts into the project without modification.

**Step 4** — Verify that the exported UI matches Paper visually.

**Step 5** — Only after the UI is identical, integrate backend logic.

Never generate UI when exported artifacts are available.

---

## UI Preservation

Treat the exported Paper UI as immutable.

The exported JSX is frozen.

The exported styling is frozen.

Your responsibility is to integrate it, not rewrite it.

---

## Styling Rules

Never rewrite exported CSS.

Never rewrite exported Tailwind.

Never optimize styles.

Never simplify styles.

Never merge styles.

Never split styles.

Never regenerate styles.

Never infer missing styles.

Never replace exported styles with your own implementation.

Use the exported styling exactly as provided.

---

## JSX Rules

Preserve the exported JSX hierarchy.

Preserve every element.

Preserve nesting.

Preserve order.

Preserve wrappers.

Preserve containers.

Preserve attributes.

Preserve class names.

Preserve accessibility attributes.

Preserve responsive classes.

Do not reorganize JSX.

Do not clean up JSX.

Do not simplify JSX.

Do not replace HTML elements.

---

## Forbidden UI Changes

Never:

- redesign layouts
- improve layouts
- simplify layouts
- move elements
- reorder elements
- remove elements
- add elements
- wrap elements
- unwrap elements
- merge components
- split components
- rename classes
- rewrite CSS
- regenerate CSS
- regenerate Tailwind
- change spacing
- change padding
- change margins
- change typography
- change colors
- change shadows
- change border radius
- change animations
- change responsive behavior
- change alignment
- change flex/grid behavior
- add buttons
- remove buttons
- add icons
- remove icons
- add labels
- remove labels
- add helper text
- add placeholders
- add dialogs
- add menus
- add tooltips
- add loading UI
- add empty states
- invent missing UI

Never make subjective improvements.

---

## Backend Integration

Only modify:

- API calls
- backend requests
- state management
- business logic
- event handlers
- routing
- authentication
- data fetching
- mutations
- validation
- loading logic
- error handling

The UI must remain unchanged.

---

## Missing UI

If the backend requires UI that does not exist in Paper:

Stop.

Explain what is missing.

Request an updated Paper design.

Never invent UI.

Never guess UI.

---

## Assumptions

Never guess.

Never infer.

Never estimate.

Never approximate.

Never make assumptions.

If something is unclear, stop and ask.

---

## Animations

Paper defines:

- layout
- structure
- styling

Animations are implemented only after the migration is complete.

Do not modify Paper styling while adding animations.

Preferred technologies:

- CSS transitions for simple hover/focus effects.
- Motion (formerly Framer Motion) for click, enter/exit, layout, and scroll animations.

Animations must never alter the visual design or layout.

---

## Visual Fidelity

Any visual difference between the exported Paper UI and the final React UI is a bug.

The migration is not complete until the UI is visually identical.

Pixel-perfect fidelity is required.

---

## Self Review

Before completing the task verify:

✓ Same JSX hierarchy.

✓ Same number of elements.

✓ Same wrappers.

✓ Same layout.

✓ Same spacing.

✓ Same sizing.

✓ Same colors.

✓ Same typography.

✓ Same responsive behavior.

✓ Same styling.

✓ Same interactions.

✓ No additional components.

✓ No removed components.

✓ No regenerated CSS.

✓ No regenerated Tailwind.

✓ Only backend logic changed.

---

## Final Rule

If you must choose between:

- writing better React code

or

- preserving the Paper export

always preserve the Paper export.

Replication has higher priority than optimization.

Integration has higher priority than refactoring.

Paper is always correct.

---

## Export Priority

When Paper can export:

- JSX
- CSS
- Tailwind
- computed styles
- design tokens
- assets

always use the exported artifacts.

Never manually recreate anything that Paper can export.

Generated implementations are the last resort.

Export first.

Generate only when export is impossible.
