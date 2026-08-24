# 03 — Automated Eval (Phase 3)

This is the phase that decides whether the migration is real.

A migration is **NOT** successful because:

* TypeScript compiles
* Next.js builds
* tests pass
* the component renders
* the CSS looks plausible
* the DOM contains similar classes

**Build success alone is NEVER sufficient.**

---

# The real screenshot gate

For each migration unit:

1. Open the **real route** in a **real browser**.
2. Reach the **exact target state** (log in, load data, open the drawer — whatever the state requires).
3. Take a screenshot.
4. Compare it against the Paper screenshot.
5. Identify differences.
6. Fix the implementation.
7. Take another screenshot.
8. Repeat until the gate passes.

Use the actual application, the actual route and a real session where one is required.
**Do not validate against a mock HTML stand.**

No "looks good enough" completion is allowed. A screenshot comparison is required **even when the agent
believes the implementation is correct** — the agent may never self-certify from code inspection alone.

---

# Bidirectional UI check (mandatory)

Every screen is evaluated in **both** directions.

### Direction A — Paper → App

For every Paper element:

```text
Does it exist in the real screen?
```

### Direction B — App → Paper

For every visible application element:

```text
Does it exist in the Paper artboard?
```

Anything failing either direction is a mismatch. Direction B is the one agents skip; it is the one that
catches invented UI.

---

# What the Eval inspects

### Structure
missing elements · extra elements · wrong hierarchy · wrong nesting · wrong ordering

### Layout
widths · heights · alignment · spacing · margins · padding · flex/grid behavior · wrapping · positioning

### Typography
font family · size · weight · line height · letter spacing · casing

### Appearance
colors · borders · shadows · radii · backgrounds · opacity

### Components
buttons · inputs · selects · tabs · badges · cards · dialogs · drawers · icons

### Responsive behavior
wrapping · width constraints · overflow · responsive visibility · breakpoint behavior

### Runtime
no console errors · no runtime errors · build passes · TypeScript passes · the original route still works ·
no unrelated UI changed

---

# Pass / fail criteria

`result: "pass"` requires **all** of:

```text
✓ real route opened in a real browser
✓ real target state reached
✓ real screenshot captured
✓ Paper → App comparison passed
✓ App → Paper comparison passed
✓ structural checks passed
✓ layout / typography / appearance checks passed
✓ responsive checks passed
✓ runtime checks passed
✓ portal-rendered surfaces validated in the browser (if any)
```

Anything less is `result: "fail"` → return to [02_IMPLEMENTATION.md](02_IMPLEMENTATION.md).
Phase 3 may not be marked `done` with a failing or partial result.

---

# Regression cases

Concrete failures seen in real migrations. Check each one explicitly — they are cheap to check and
expensive to miss. **Append new cases here as they are found.**

| # | Case | What to check |
|---|---|---|
| 1 | **Missing spacer node** | Paper produced a flex row with an explicit spacer element; the implementation dropped it and widened a neighbour instead. Same visual width, different layout mechanism — breaks at the next breakpoint. |
| 2 | **Native `<select>` substitution** | A custom Paper select replaced by a native `<select>`. Different height, font, caret, focus ring and open behavior. |
| 3 | **Extra buttons** | Actions that exist in the app but not in the artboard (a "refresh", an extra "cancel", a helper link). Caught only by Direction B. |
| 4 | **Rebuilt from computed styles** | Widths copied as numbers while `flexShrink`, `flexBasis` and wrappers were dropped. Looks identical at one viewport only. |
| 5 | **Portal loses CSS variables** | A Radix dialog/drawer/popover rendered outside the styled subtree; tokens resolve to fallbacks. Only visible in the browser, never in the JSX. |
| 6 | **Invented empty/loading state** | The backend produced a state Paper does not define and the agent designed one. See [05_FINALIZATION.md](05_FINALIZATION.md). |

---

# Evidence requirement

Do not report:

```text
"looks correct"
```

Report evidence. Every PASS carries a corresponding artifact or verification step:

```text
Paper screenshot
Real browser screenshot
MCP tool result
Route URL
State reached
Screenshot comparison result
```

---

# Failure conditions

The task MUST be considered **FAILED** if any of the following occurs:

* Paper JSX was not retrieved when it was available
* Paper screenshot was not retrieved
* the real route was not tested
* visual comparison was not performed
* extra UI was introduced
* Paper UI was missing
* existing UI structure was preserved despite a Paper structure mismatch
* styling was manually recreated when direct export was available
* computed styles were used as a substitute for structural export
* an undefined state was invented
* a backend state was designed without Paper approval
* final visual verification was skipped
* a second page was started while another page was still unapproved
* a phase was marked `done` in the state file without meeting its requirements

---

## Gate — phase 3

```text
✓ every check above ran against a real browser screenshot of the real route
✓ result = pass
✓ screenshot artifact recorded in the state file
```

→ continue with [04_HUMAN_REVIEW.md](04_HUMAN_REVIEW.md).
