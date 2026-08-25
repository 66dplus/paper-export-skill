# 01 — Placement & Discovery (Phases 0–1)

A redesign inherits its route, its shell, its auth and its data. A new screen inherits none of that, and
every one of them is a decision that must be made **before** any code is written — not discovered at
phase 5 when the UI is already locked.

**Do not modify code during phase 0.**

---

# PHASE 0 — PROJECT INSPECTION

Record, as in the shared contract:

framework · React version · TypeScript usage · routing system · styling system · CSS architecture ·
Tailwind usage · design tokens · component library · data-fetching layer · state-management layer ·
authentication

Determine the styling system from **real usage**, not from filenames, and extract Paper in the
representation that matches it — see
[../paper-migration/01_DISCOVERY.md](../paper-migration/01_DISCOVERY.md) §Styling system detection.

Then answer the four questions below. All four go into the state file before phase 1 ends.

---

## 1. Placement

```text
route path:        /...
router entry:      the file that must be created
layout / shell:    which existing layout does it nest under
auth:              public · authenticated · role-gated
locale / domain:   if the app serves more than one
```

A route that nests under an existing layout inherits that layout's header, navigation, padding and
background. **That is the single most common cause of a broken new screen** — see
[02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md).

If the app has more than one shell (marketing vs app, public vs admin), name which one this screen
belongs to and why. Guessing here produces a screen that looks right in isolation and wrong in place.

## 2. Reuse

For a redesign the question is "is this existing code in the way?" For a new screen it inverts:
**what does the project already provide that this artboard implies?**

Inventory before implementing:

```text
design tokens          colors, spacing, radii, typography scale
primitives             button, input, select, card, badge, dialog, drawer, toast
layout components      page container, grid, section, header, sidebar
behavioral hosts       modal host, toast host, error boundary, query provider
formatting             dates, numbers, currency, i18n strings
```

Rules:

* **Reuse a primitive when it renders identically to Paper.** Verify by rendering, not by name — a
  `Button` that matches the artboard's padding, radius, font and states is reuse; one that merely shares
  the word "button" is a substitution, and substitution is forbidden by the shared styling rules.
* **Never introduce a parallel design system.** A new screen that ships its own token set, its own button
  and its own spacing scale is a maintenance fork, and the next screen will inherit the fork.
* **Where a primitive is close but not identical, Paper still wins.** Extend the primitive with a variant
  that matches Paper, or use the Paper markup locally — do not bend the screen to the primitive.
* Record what was reused and what was created new. The reviewer needs to know which is which.

## 3. Entry point

**How does a user reach this screen?** Answer before phase 2, because the answer is usually UI that the
artboard does not draw. This is the one place where a new screen is allowed to add UI, under strict
conditions — read [02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md) before deciding.

Record one of:

```text
nav_item      added to an existing navigation surface
link          added to a named existing screen
button        added to a named existing screen
direct_url    intentionally unreachable from the UI for now
none_yet      the entry point is a separate, later decision
```

`direct_url` and `none_yet` are legitimate answers — an unreachable screen is honest; an invented menu
is not. But they must be **stated**, not defaulted into by silence.

## 4. Data availability

A new screen usually needs data nobody has exposed yet. Establish this at phase 0, not at phase 5:

For every value the artboard displays:

```text
already available from an existing endpoint      → name it
available but not in the shape the screen needs  → name the transformation
does not exist in the backend at all             → BLOCKER, report now
```

A blocker found at phase 0 costs a message. The same blocker found after UI LOCK costs the lock — the
screen either ships with data that cannot exist, or the locked UI has to be reopened.

**This does not license inventing placeholder content.** If the data does not exist, the screen is built
against the real absence and the state is handled by the rules in
[../paper-migration/05_FINALIZATION.md](../paper-migration/05_FINALIZATION.md) §States created by the
backend — never with fabricated values.

---

# PHASE 1 — PAPER EXTRACTION

Identical to the shared contract —
[../paper-migration/01_DISCOVERY.md](../paper-migration/01_DISCOVERY.md) §PHASE 1 — with one addition
specific to a new screen:

**Split the artboard before extracting it.** Mark, on the Paper tree, which nodes are the app shell
(header, sidebar, footer, page chrome) and which are the screen. Extract and implement only the screen
half. See [02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md).

Obtain, for the screen half: JSX · screenshot · tree · computed styles where ambiguous · the visual
states the artboard represents.

Computed styles remain a **diagnostic**, never the source — a number without its structural context
(`flexShrink`, spacers, wrappers) is not the design.

## State inventory

Build the state inventory exactly as the shared contract requires: every state the route can reach, each
one marked `Paper design exists → migrate it` or `OUT OF SCOPE — NO PAPER DESIGN`.

A new screen hits undefined states **more often** than a redesign, because there is no previous
implementation whose loading/empty/error behavior can be kept. Enumerate them here, against the answers
from §4 above, rather than discovering them one at a time during backend integration.

---

## Gate — phases 0 and 1

```text
✓ project inspected; framework, styling, routing, data layer recorded
✓ nothing modified during phase 0
✓ route path, shell, auth recorded
✓ reuse inventory recorded — what is reused, what is new
✓ entry point decided and recorded (including direct_url / none_yet)
✓ data availability resolved per displayed value; blockers reported
✓ artboard split into shell vs screen
✓ Paper JSX, screenshot and tree obtained for the screen half
✓ state inventory written; undefined states marked OUT OF SCOPE
✓ state file updated with mode: "new_screen"
```

→ read [02_SHELL_AND_ENTRY.md](02_SHELL_AND_ENTRY.md), then implement with
[../paper-migration/02_IMPLEMENTATION.md](../paper-migration/02_IMPLEMENTATION.md) and
[03_OVERRIDES.md](03_OVERRIDES.md).
