---
name: paper-migration
description: Deterministic, state-machine-driven workflow for migrating a Paper design into a real React/TypeScript application without redesigning it. Use whenever a Paper frame, artboard or selection is turned into React/JSX, when Paper MCP tools are in play (get_jsx, get_screenshot, get_tree_summary, get_computed_styles), or when the user says "design to code", "export from Paper", "implement this Paper frame", "migrate this artboard", "redesign these pages", "wire this design to the backend", "make it pixel perfect from the design". Enforces one page per human-review cycle, MCP-first extraction, a real-browser screenshot gate, a bidirectional Paper<->App element check, UI LOCK before backend work, an explicit STOP on any state Paper does not define, and a persistent JSON state file that is the authoritative record of progress.
license: MIT
metadata:
  author: DMITRII RYBKIN
  version: "3.1.0"
---

# Paper → React Migration

## Purpose

Produce a React implementation that is **visually and structurally faithful** to the Paper source, then
integrate real application logic and backend data **without changing that UI**.

The agent is not being asked *"can you build something that looks like this design?"*

The agent is being asked: *"can you **prove** the real React application renders the UI this Paper design
represents, and then integrate real behavior without changing it?"*

---

## Top-level rules

**1. Paper is the source of truth for the UI.**
Paper defines structure, hierarchy, element presence, element order, layout, spacing, typography, colors,
borders, radii, shadows, responsive behavior and the visual states its artboards represent.
The existing application does not override Paper. Agent assumptions do not override Paper.
Existing components do not override Paper. Best practices do not override Paper.

**2. One page = one review cycle.**
Process **one page at a time**. Never implement multiple pages before human review.
Maximum unreviewed scope is **one page**. See [04_HUMAN_REVIEW.md](04_HUMAN_REVIEW.md).

**3. MCP-first.**
If information is available through Paper MCP, retrieve it through Paper MCP.
Never infer, approximate or manually recreate what can be exported directly.
Generated implementation is the last resort.

**4. Do not guess.**
Never invent UI, states, copy, controls or styling that Paper does not define.
When uncertain: inspect Paper, measure, compare — then act. If it cannot be resolved, STOP and report.

**5. Build success is never sufficient.**
A migration is validated by a real screenshot of the real route in a real browser, compared against the
Paper screenshot in **both directions**. TypeScript compiling proves nothing about the UI.

**6. The state file is authoritative.**
`.paper-migration-state.json` records progress. Never advance a page or a phase without updating it
first. Never mark a phase `done` unless every requirement of that phase is satisfied.
See [00_STATE.md](00_STATE.md).

---

## Workflow

```text
PHASE 0  DISCOVERY        inspect the project — change nothing
PHASE 1  PAPER EXTRACTION MCP-first: JSX, screenshot, tree, styles, state
PHASE 2  IMPLEMENTATION   UI only — no backend, no refactor, no redesign
PHASE 3  AUTOMATED EVAL   real route, real browser, bidirectional comparison
PHASE 4  HUMAN REVIEW     localhost → APPROVED / CHANGES_REQUESTED
PHASE 5  FINALIZATION     UI lock → backend → animation → regression → report
```

Phases run in order. A phase is not complete until its gate passes. `CHANGES_REQUESTED` at phase 4 sends
the page back to phase 2, then 3, then 4 again — never forward.

| Phase | Instructions |
|---|---|
| state contract (read first) | [00_STATE.md](00_STATE.md) |
| 0 · 1 | [01_DISCOVERY.md](01_DISCOVERY.md) |
| 2 | [02_IMPLEMENTATION.md](02_IMPLEMENTATION.md) |
| 3 | [03_EVAL.md](03_EVAL.md) |
| 4 | [04_HUMAN_REVIEW.md](04_HUMAN_REVIEW.md) |
| 5 | [05_FINALIZATION.md](05_FINALIZATION.md) |

**At the start of every session:** read `.paper-migration-state.json` first and resume from exactly where
it says the work stopped. Do not re-analyse everything from scratch.

---

## Scope

React · TypeScript · Next.js · Vite · other React-based applications, where the app contains real
routing, state, APIs, authentication and backend logic.

---

## Conflict resolution

```text
Paper vs agent assumptions           → Paper wins.
Paper vs existing application UI     → Paper wins for UI.
                                       Application architecture wins for non-visual implementation.
Paper vs a recorded product decision → the decision wins. STOP and report.
```

### A recorded decision outranks the artboard

A design file shows what a screen looks like. It does not know what the owner has already decided
about the product. When an artboard draws something the owner deliberately removed, transferring it
silently reverses that decision, and the migration becomes the vehicle for a product change nobody
approved.

Treat as a recorded decision:

* a test whose name or comment states one — "owner 2026-08-21: photo management must not be duplicated"
* a source comment citing an owner, a date, or a ticket
* an entry in the project's decision log, ADR, or handoff docs

On such a conflict: **do not transfer the node, and do not touch the test.** Record it in the state
file under `design_conflicts` — not `out_of_scope_states`, which means "no design exists"; this one
means "a design exists and it contradicts a decision" — and report it. The owner resolves it. The
artboard does not.

### Never rewrite a test to make the migration pass

A failing test is evidence, not an obstacle. When a test fails because of your change, the default
assumption is that your change is wrong.

Editing an assertion is legitimate in exactly one case: the thing it asserts genuinely moved, and you
can show the measurement — old value, new value, and why they are the same fact under a new name.
Then say so in the PR.

Inverting an assertion — `doesNotMatch` → `match`, "must not be present" → "must be present" — is
never a migration step. It is a product change wearing a test edit, and `design_conflicts` is where
it belongs instead.

Never optimize against the source. Never redesign against the source. Never "improve" against the
source. Never guess against the source.

Replication has higher priority than optimization.
Integration has higher priority than refactoring.
