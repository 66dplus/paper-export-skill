---
name: paper-new-screen
description: Build a brand-new screen from a Paper artboard in an existing React/TypeScript app — a page that does not exist yet, as opposed to replacing one that does. Use when the user says "build this screen", "new page from this artboard", "create this screen from Paper", "add this design as a new page", "implement this Paper frame as a new route". Covers the greenfield-only hazards a redesign never hits: deciding where the screen lives, separating the app shell from the screen inside the artboard, and adding the one piece of UI Paper does not draw — the entry point that makes the screen reachable. Shares the fidelity, eval, review and finalization contract with the paper-migration skill; if the screen already exists and is being redesigned, use paper-migration instead.
license: MIT
metadata:
  author: DMITRII RYBKIN
  version: "1.0.0"
---

# Paper → New Screen

## When this skill applies

```text
The screen does not exist yet   → this skill
The screen exists, redesigned   → paper-migration
```

Everything about **fidelity to Paper** is identical in both. What differs is the four questions a
redesign never has to answer:

1. Where does this screen live — route, layout, auth?
2. Which part of the artboard is the **app shell** that already exists, and which part is the new screen?
3. How does a user **reach** it — and is that entry point allowed to be built at all?
4. What does the backend actually have for it?

This skill answers those. Everything else is delegated to the shared contract.

---

## Top-level rules

Identical to `paper-migration`, and they still bind here:

**Paper is the source of truth for the UI.** Structure, hierarchy, element presence and order, layout,
spacing, typography, colors, borders, radii, shadows, responsive behavior. Existing components do not
override Paper. Best practices do not override Paper.

**MCP-first.** Retrieve from Paper what Paper can export. Never infer, approximate or hand-rebuild it.

**Do not guess.** Never invent UI, states, copy or controls Paper does not define — with exactly one
scoped exception, the entry point, defined in [02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md).

**One screen = one review cycle.** Never build several screens before a human looks at one.

**Build success is never sufficient.** Proof is a real screenshot of the real route in a real browser,
compared against Paper in both directions.

**The state file is authoritative.** `.paper-migration-state.json`, with `"mode": "new_screen"`.

---

## Workflow

```text
PHASE 0  PLACEMENT & DISCOVERY  where it lives, what to reuse, what data exists — change nothing
PHASE 1  PAPER EXTRACTION       MCP-first: JSX, screenshot, tree, styles, states
PHASE 2  IMPLEMENTATION         route + screen + entry point; no backend, no redesign
PHASE 3  AUTOMATED EVAL         real route, real browser, bidirectional comparison
PHASE 4  HUMAN REVIEW           localhost → APPROVED / CHANGES_REQUESTED
PHASE 5  FINALIZATION           UI lock → backend → animation → regression → report
```

| Phase | Instructions |
|---|---|
| greenfield hazards — **read before phase 2** | [02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md) |
| 0 · 1 | [01_DISCOVERY.md](01_DISCOVERY.md) — this skill's own |
| state contract | [../paper-migration/00_STATE.md](../paper-migration/00_STATE.md) + [03_OVERRIDES.md](03_OVERRIDES.md) |
| 2 | [../paper-migration/02_IMPLEMENTATION.md](../paper-migration/02_IMPLEMENTATION.md) + [03_OVERRIDES.md](03_OVERRIDES.md) |
| 3 | [../paper-migration/03_EVAL.md](../paper-migration/03_EVAL.md) + [03_OVERRIDES.md](03_OVERRIDES.md) |
| 4 | [../paper-migration/04_HUMAN_REVIEW.md](../paper-migration/04_HUMAN_REVIEW.md) + [03_OVERRIDES.md](03_OVERRIDES.md) |
| 5 | [../paper-migration/05_FINALIZATION.md](../paper-migration/05_FINALIZATION.md) + [03_OVERRIDES.md](03_OVERRIDES.md) |

**The shared files are the contract; [03_OVERRIDES.md](03_OVERRIDES.md) lists every place a new screen
reads them differently.** There is no third source. If a shared file and an override disagree, the
override wins — and only for the clauses it names.

Both skills ship together, so `../paper-migration/` always exists. If it does not, the installation is
broken: stop and say so rather than working from memory of what those files say.

---

## Conflict resolution

```text
Paper vs agent assumptions              → Paper wins.
Paper vs existing application UI        → Paper wins for the screen.
                                          The app shell wins for the shell (02_SHELL_AND_ENTRY).
Paper vs a recorded decision by the owner → the recorded decision wins.
```

Never optimize against the source. Never redesign against the source. Never "improve" against the
source. Never guess against the source.
