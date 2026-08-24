# 04 — Human Review (Phase 4)

**One page = one review cycle.** This is the hardest constraint in the workflow.

The redesign is processed one page at a time. Never implement multiple pages before human review.

```text
Maximum unreviewed scope: one page.
```

---

# The cycle

For each page, the agent completes the full cycle independently:

1. Extract the page from Paper — [01_DISCOVERY.md](01_DISCOVERY.md)
2. Implement the page in React — [02_IMPLEMENTATION.md](02_IMPLEMENTATION.md)
3. Run the automated Eval — [03_EVAL.md](03_EVAL.md)
4. Make the real page available on **localhost**
5. Request human review
6. Apply all requested changes
7. Re-run the automated Eval
8. Request review again if changes were made
9. Mark the page `APPROVED` only after **explicit human approval**
10. Lock the approved page before moving to the next page

**The agent MUST NOT start implementing the next page until the current page is explicitly approved.**

---

# Requesting review

When the Eval passes, set the page status to `ready_for_review` in the state file and post:

```text
READY_FOR_REVIEW

Page:      beaches
Route:     http://localhost:3000/beaches
State:     populated
Artboard:  03 — Beaches

Eval:      PASS
  Paper → App: PASS
  App → Paper: PASS
  Runtime:     PASS

Screenshots:
  Paper: <path>
  Real:  <path>

Widths verified:
  390 (mobile artboard) · 1280 (in-between) · 1440 (desktop artboard)

Out of scope (no Paper design): error state

Reply APPROVED or CHANGES_REQUESTED.
```

The localhost URL must actually be serving, and it must land on the exact state under review.
Telling the user to review a page that is not running is not a review request.

**State the widths, and include one that is not an artboard width.** The human opens the page in
whatever window they already have — almost never an artboard width. Evidence captured only at
artboard widths shows the two views guaranteed to look correct, so a broken in-between renders as
a green report and the human finds it in the first five seconds. If the screenshots and the
human's screen disagree, suspect the sampled width before anything else, and re-measure at theirs.

---

# The two answers

### `APPROVED`

Only the human sets this. Record it, then:

```text
page.status              → approved
phases.4_human_review    → done, result: APPROVED
```

Proceed to [05_FINALIZATION.md](05_FINALIZATION.md).

### `CHANGES_REQUESTED`

Append every requested change to `phases.4_human_review.feedback`, then return the page to phase 2:

```text
Phase 4  →  Phase 2  →  Phase 3  →  Phase 4
```

Not straight back to phase 4, and never forward. Every change re-enters the Eval; a fix that was not
re-evaluated has not been verified.

Repeat until the human answers `APPROVED`.

---

# What approval is not

The agent may **never** self-approve. None of the following is approval:

* the Eval passed
* the screenshots look identical to the agent
* the user replied about something else
* the user did not reply
* the user said "ok" to a different question
* time passed

**Silence is not approval. Absence of an answer is not approval.**

If the session cannot obtain a human answer (non-interactive run, batch job, scheduler), the correct
outcome is to **stop** with the page at `ready_for_review` and report the queue of pages waiting for
review — never to advance, and never to start the next page.

---

## Gate — phase 4

```text
✓ real page served on localhost at the exact target state
✓ review requested with evidence
✓ all CHANGES_REQUESTED items applied and re-evaluated
✓ explicit human APPROVED recorded in the state file
✓ page locked before the next page begins
```

→ continue with [05_FINALIZATION.md](05_FINALIZATION.md).
