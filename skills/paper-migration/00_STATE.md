# 00 — Workflow State (authoritative)

The migration is a **state machine**, not a narrative. The agent may not rely on its own memory of what
was done: the file below is the record.

> **The JSON state file is the authoritative workflow state. Never advance a page or phase without
> updating the state file first. Never mark a phase as `done` unless all phase requirements are
> satisfied.**

---

## 1. The file

```text
.paper-migration-state.json
```

Committed at the repository root of the application being migrated.

**Read it at the start of every session, before anything else.** It answers "where did I stop?" — resume
from exactly that point instead of re-analysing the project.

---

## 2. Shape

```json
{
  "project": "admin-app-redesign",
  "project_status": "in_progress",
  "active_page": "beaches",
  "pages": {
    "beaches": {
      "route": "/beaches",
      "artboard": "03 — Beaches",
      "ui_state": "populated",
      "status": "ready_for_review",
      "current_phase": 3,
      "phases": {
        "0_discovery":       { "status": "done" },
        "1_paper_extraction": {
          "status": "done",
          "artifacts": { "jsx": true, "screenshot": true, "tree": true, "computed_styles": true }
        },
        "2_implementation":  { "status": "done" },
        "3_automated_eval":  { "status": "done", "result": "pass", "screenshot": "evals/beaches-03.png" },
        "4_human_review":    { "status": "pending", "result": null, "feedback": [] },
        "5_finalization":    { "status": "pending" }
      },
      "out_of_scope_states": ["error — no Paper design"],
      "design_conflicts": [
        {
          "node": "IN-0 · Media manager header",
          "artboard_shows": "a media manager on the handoff screen",
          "decision": "owner 2026-08-21 — photo management must not be duplicated; it lives in the pipeline",
          "recorded_in": "content-ops-combined-launch.contract.test.ts",
          "action": "not transferred; test untouched; raised with the owner"
        }
      ],
      "last_updated": "2026-08-24T16:00:00+04:00"
    },
    "login":   { "status": "approved" },
    "ratings": { "status": "not_started" },
    "hotels":  { "status": "not_started" }
  }
}
```

`pages` is keyed by page. Every page of the migration is listed from the start, including the ones not
begun — the list of pages is itself part of the plan.

---

## 3. Allowed values

`design_conflicts` is **not** `out_of_scope_states`. They answer different questions:

```text
out_of_scope_states  — Paper defines no design for this state
design_conflicts     — Paper defines one, and it contradicts a decision already taken
```

The second never resolves itself by transferring the node. Leave it out, leave any test that encodes
the decision alone, and report it — see **Conflict resolution** in [SKILL.md](SKILL.md).

**Page `status`**

```text
not_started → in_progress → ready_for_review → approved → locked → done
                    ↑                 |
                    └── changes_requested ←┘
```

**Phase `status`**

```text
pending → in_progress → done
```

**Phase 4 `result`**

```text
null | APPROVED | CHANGES_REQUESTED
```

---

## 4. Constrained transitions

Phases advance strictly in order:

```text
0 → 1 → 2 → 3 → 4 → 5
```

The following transitions are the only legal exceptions, and both are backwards:

```text
Phase 3 result = fail            → back to Phase 2
Phase 4 = CHANGES_REQUESTED      → back to Phase 2 → 3 → 4
```

Hard conditions — each one blocks `done`:

| Phase | May be marked `done` only when |
|---|---|
| 0 discovery | framework, styling system, routing and data layer are recorded; nothing was modified |
| 1 extraction | Paper JSX **and** screenshot **and** tree obtained for the target artboard; UI state identified |
| 2 implementation | UI implemented from the Paper export; no backend work performed |
| 3 automated eval | every mandatory check in [03_EVAL.md](03_EVAL.md) ran, on a real browser screenshot of the real route, and `result` is `pass` |
| 4 human review | the human answered **`APPROVED`** explicitly. The agent may never set this itself |
| 5 finalization | UI lock held, backend integrated, regression checks passed, final report produced |

**Phase 4 cannot be self-approved under any circumstance.** Absence of an answer is not approval.
Silence is not approval. "The eval passed" is not approval.

---

## 5. One page at a time

At most **one** page may have `status` in `in_progress`, `ready_for_review` or `changes_requested`.

Starting a second page while another is unapproved is a **failure condition** — see
[03_EVAL.md](03_EVAL.md) §Failure conditions.

---

## 6. Update discipline

Update the state file:

1. **before** starting a phase (`pending` → `in_progress`),
2. **after** the phase gate passes (`in_progress` → `done`),
3. whenever human feedback arrives (append to `feedback`),
4. whenever a state is declared out of scope.

Every update sets `last_updated`.

If the state file and reality disagree, **reality wins and the file is corrected immediately** — but
report the discrepancy, because it means a phase was performed without being recorded.

---

## 7. MCP action log

Alongside the state file, maintain a chronological action log for the migration. Record every Paper MCP
call **as it happens**:

```text
timestamp · phase · artboard · tool · target · purpose · result
```

Example:

```text
[10:04] PHASE 1 · artboard "03 — Beaches"
get_selection    → success
get_tree_summary → success
get_screenshot   → success
get_jsx          → success
get_computed_styles → success

[10:12] PHASE 2
Replaced existing toolbar subtree with Paper JSX. No backend changes.

[10:21] PHASE 3
Visual mismatch: search width · missing spacer · table nesting.

[10:35] PHASE 3
Second screenshot captured. Comparison passed.

[10:37] PHASE 4
READY_FOR_REVIEW → http://localhost:3000/beaches
```

The log must contain every Paper MCP action performed. Do not report only a final list of tools, and
**never claim a tool was used if it was not used**.
