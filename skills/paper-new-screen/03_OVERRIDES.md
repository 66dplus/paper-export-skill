# 03 — Overrides on the shared contract

<!-- depends-on
../paper-migration/01_DISCOVERY.md § Styling system detection
../paper-migration/01_DISCOVERY.md § PHASE 1 — PAPER EXTRACTION
../paper-migration/02_IMPLEMENTATION.md § No UI invention
../paper-migration/02_IMPLEMENTATION.md § A migrated control may lead off the migrated page
../paper-migration/02_IMPLEMENTATION.md § JSX rules
../paper-migration/02_IMPLEMENTATION.md § Structural fidelity
../paper-migration/02_IMPLEMENTATION.md § Portals and DOM context
../paper-migration/03_EVAL.md § Bidirectional UI check
../paper-migration/03_EVAL.md § Regression cases
../paper-migration/03_EVAL.md § Failure conditions
../paper-migration/03_EVAL.md § The real screenshot gate
../paper-migration/03_EVAL.md § the original route still works
../paper-migration/03_EVAL.md § no unrelated UI changed
../paper-migration/04_HUMAN_REVIEW.md § READY_FOR_REVIEW
../paper-migration/04_HUMAN_REVIEW.md § CHANGES_REQUESTED
../paper-migration/05_FINALIZATION.md § UI LOCK
../paper-migration/05_FINALIZATION.md § Data rule
../paper-migration/05_FINALIZATION.md § States created by the backend
../paper-migration/05_FINALIZATION.md § Final regression
../paper-migration/05_FINALIZATION.md § Definition of Done
../paper-migration/05_FINALIZATION.md § Final report
../paper-migration/05_FINALIZATION.md § original route still works
../paper-migration/00_STATE.md § changes_requested
-->


Phases 2–5 run from the `paper-migration` files. This is the complete list of places a **new screen**
reads them differently. Nothing else changes; anything not listed here applies verbatim.

If an override and a shared file disagree, the override wins — **only** for the clause it names.

---

## 00_STATE.md — the state file

Same file, same transitions, same gates, same rule that phase 4 can never be self-approved.

Additions:

```json
{
  "mode": "new_screen",
  "pages": {
    "trip-planner": {
      "route": "/trip-planner",
      "route_exists_before": false,
      "shell": "app layout (header + sidebar)",
      "auth": "authenticated",
      "artboard": "07 — Trip Planner",
      "entry_point": {
        "type": "nav_item",
        "host": "primary navigation",
        "label": "Trip Planner",
        "status": "built"
      },
      "reuse": {
        "reused": ["Button", "Card", "PageContainer", "tokens"],
        "created": ["ItineraryRow", "DayColumn"]
      },
      "data_blockers": []
    }
  }
}
```

`entry_point.type` is one of `nav_item · link · button · direct_url · none_yet`.
`entry_point` is **required** — `direct_url` and `none_yet` are answers, absence is not.

A page may not leave phase 1 with `data_blockers` unreported.

---

## 02_IMPLEMENTATION.md — building the screen

Applies in full: JSX rules, styling rules, structural fidelity, allowed technical differences, portals.

| Clause | Override |
|---|---|
| §No UI invention | The **entry point** is a scoped exception — see [02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md) §B. Nothing else is. |
| §No UI invention | Shell chrome the artboard draws but the layout already renders is **not** implemented — see [02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md) §A. Omitting it is not "removing an element". |
| §A migrated control may lead off the migrated page | Reads the same, and applies harder: on a new screen most destinations are outside this wave. Name every one in the review request. |
| — | **New:** creating the route file, the router entry and the page component is part of phase 2. "UI only" excludes backend logic, not routing scaffolding. |
| — | **New:** reuse follows [01_DISCOVERY.md](01_DISCOVERY.md) §2 — reuse a primitive only when it renders identically to Paper; never fork the design system. |

---

## 03_EVAL.md — the eval

Applies in full: the real screenshot gate, the bidirectional check, structure/layout/typography/
appearance/components/responsive/operability inspection, evidence requirement, failure conditions.

| Clause | Override |
|---|---|
| §Bidirectional UI check, Direction B | Compare **the screen region only**. The shell is not a Paper-foreign element — it is the app. Do not flag the real header as extra UI. The entry point on its host screen is likewise expected, not extra. |
| §Runtime — `the original route still works` | There is no original route. Replace with: **existing routes still work** — the ones sharing this layout, this provider tree or any touched global CSS. |
| §Runtime — `no unrelated UI changed` | Replace with: **the new route changed nothing outside itself** — no global CSS leak, no provider/layout edit affecting siblings, no altered route table entry, no restyled shared primitive. Verify by opening at least one pre-existing route that shares the layout. |
| §Regression cases | Three cases are added below. |

### Additional regression cases

| # | Case | What to check |
|---|---|---|
| N1 | **Double shell** | Header/footer/page-container rendered twice because the artboard's chrome was implemented on top of the layout's. Only visible when the route is opened in place — never in an isolated component preview. |
| N2 | **Design-system fork** | The screen ships its own button/spacing/tokens instead of the project's, because a primitive was "close enough" to avoid but not close enough to reuse. Looks correct in isolation; diverges from every other screen. |
| N3 | **Unreachable screen** | The route exists, the eval passes, and nothing in the product links to it — because the entry point was never decided. `direct_url` is an acceptable answer; silence is not. |

---

## 04_HUMAN_REVIEW.md — review

Applies in full, including: one screen at a time, `CHANGES_REQUESTED` returns to phase 2 → 3 → 4, and
the agent may never self-approve.

The `READY_FOR_REVIEW` message carries four additional lines:

```text
Route:        /trip-planner   (new)
Entry point:  nav_item "Trip Planner" in the primary navigation   ← added by this wave
Shell:        app layout — header/sidebar rendered by the layout, not by this screen
Reused:       Button, Card, PageContainer, tokens
Created:      ItineraryRow, DayColumn
Off-scope destinations: "View all" → /trips (not part of this wave)
```

The entry point must be visible to the reviewer as an **addition**, because it is the one piece of UI
Paper did not specify. A reviewer who finds it by accident cannot evaluate it.

---

## 05_FINALIZATION.md — lock, backend, regression, report

Applies in full: UI LOCK, the data rule, STOP on backend states without a Paper design, the animation
pass, the final report.

| Clause | Override |
|---|---|
| §Final regression — `original route still works` | Replace as in 03_EVAL above: existing routes sharing layout/providers/global CSS still work. |
| §Definition of Done | Two conditions added: **the screen is reachable through the recorded entry point** (or `direct_url`/`none_yet` is recorded and was shown at review), and **no existing route regressed**. |
| §Final report | Retitle `# New Screen Report`, and add sections: `## Placement` (route, shell, auth) · `## Entry point` · `## Reuse` (reused vs created) · `## Data blockers`. |
| §States created by the backend | Unchanged and load-bearing: a new screen produces more undefined states than a redesign. STOP and request a design; never improvise one. |
