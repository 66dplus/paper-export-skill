# 05 — Finalization (Phase 5)

Runs **only after** the page is explicitly `APPROVED` ([04_HUMAN_REVIEW.md](04_HUMAN_REVIEW.md)).

```text
UI LOCK → backend integration → animation → regression → final report
```

---

# UI LOCK

Once visual validation and human approval pass, the UI enters **LOCKED** state.

After UI LOCK, do not change:

* layout
* structure
* styles
* dimensions
* visual hierarchy
* element presence

Backend integration happens **around** the locked UI, not through it.

---

# Backend integration

Only now may the agent integrate:

API calls · data fetching · mutations · state · authentication · routing · business logic · validation ·
loading logic · error handling

The goal is:

```text
same UI  +  real data
```

not:

```text
new UI  +  real data
```

## Data rule

Hardcoded Paper data is replaced by real application data **without changing the visual structure**:

```text
Paper:   <Metric value="602" />
becomes: <Metric value={data.total} />
```

The component structure remains unchanged unless a real interaction requirement makes a technical change
unavoidable.

## States created by the backend

Backend integration may introduce states Paper does not represent — loading, error, empty, unavailable,
invalid input.

**Do NOT invent a visual treatment for them.** If a required state has no approved design:

```text
STOP

Report:
State:           [name]
Reason:          no Paper design exists
Required action: provide Paper design
```

Record it in the state file under `out_of_scope_states` and continue with the rest of the work.

---

# Animations

Animations are a **separate implementation pass**. Do not redesign static UI while adding animation.

| Interaction | Approach |
|---|---|
| simple hover / focus | CSS transitions |
| click / press | Motion, when necessary |
| enter / exit | Motion |
| layout animation | Motion |
| scroll-triggered | Motion or an appropriate browser API |

Animations must not introduce UI elements absent from Paper, and must not change layout in a way that
contradicts the design.

Validate hover · focus · active · click · enter · exit · scroll · layout transitions — **only when those
interactions are specified by the product or design requirements.** Do not invent animations because the
screen looks static.

---

# Final regression

```text
✓ original route still works
✓ no unrelated UI changed
✓ no console errors
✓ no runtime errors
✓ build passes
✓ TypeScript passes
```

---

# Definition of Done

A page migration is DONE only when:

```text
Paper source exists
AND Paper JSX was retrieved
AND Paper screenshot was retrieved
AND the real route was rendered
AND a real screenshot was captured
AND Paper → App comparison passed
AND App → Paper comparison passed
AND the human answered APPROVED
AND backend integration preserved the locked UI
AND runtime checks passed
AND the state file records all of the above
```

Build success alone is NEVER sufficient.

---

# Final report

Every completed migration ends with:

```text
# Paper Migration Report

## Scope
Artboards:
Routes:
States:

## Paper MCP Usage
[Every tool actually used, per artboard]

## Implementation
[What was changed]

## Visual Validation
Paper screenshot:      ✓
Real route screenshot: ✓
Paper → App: PASS
App → Paper: PASS

## Human Review
APPROVED by: [who] at [when]
Changes requested and applied: [list or "None"]

## Backend Integration
[Summary]

## Undefined States
[List or "None"]

## Runtime Validation
TypeScript: PASS/FAIL
Build:      PASS/FAIL
Runtime:    PASS/FAIL

## Final Status
PASS / FAIL

## Remaining Issues
[List]
```

Report the Paper MCP usage honestly — **do not claim a tool was used if it was not used.**

---

## Gate — phase 5

```text
✓ UI lock held through backend integration
✓ mock data replaced with real data
✓ data states verified
✓ backend-only states without a Paper design reported, not invented
✓ regression checks passed
✓ final report produced
✓ page status → done in the state file
```

→ the next page may now begin at [01_DISCOVERY.md](01_DISCOVERY.md).
