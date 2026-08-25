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

Every screen is evaluated in **both** directions, **over the Paper node tree** — never over the
strings the design happens to contain. See [06_PARITY_HARNESS.md](06_PARITY_HARNESS.md) for the
instrument; this section states the contract it implements.

### Direction A — Paper → App

For every Paper **node** (not every Paper string):

```text
Does a live element render it?   MAPPED · DEFERRED-with-reason · DEFECT
```

Rules, hairlines, dividers, badges, chips, spacers, empty containers, icons and legend swatches are
nodes. None of them are text, and a text-keyed check is blind to all of them by construction.

### Direction B — App → Paper

For every visible application element:

```text
Does it exist in the Paper artboard?
```

Anything failing either direction is a mismatch. Direction B is the one agents skip; it is the one that
catches invented UI. Direction A is the one agents *think* they ran, because a string comparison feels
like an element comparison and reports a clean result.

---

# What the Eval inspects

### Structure
missing elements · extra elements · wrong hierarchy · wrong nesting · wrong ordering

### Layout — **measured, not looked at**
widths · heights · alignment · spacing · margins · padding · flex/grid behavior · wrapping · positioning

These are numbers, and they are compared as numbers (±2px), per
[06_PARITY_HARNESS.md](06_PARITY_HARNESS.md) pass 2. **Containers before children** — one wrong value
on a shared wrapper moves every section at once, and each child then looks correct next to its own
neighbour.

Both overflow directions count: content spilling **past** the container, and a full-bleed node that
fails to **reach** the viewport edge. A `scrollWidth > viewport` check sees only the first; white
gutters down the sides of a hero pass it silently.

Wrapping is geometry too: a line the artboard draws once and the app renders twice is a defect, and
it is invisible to any check that compares the string.

### Typography
font family · size · weight · line height · letter spacing · casing

### Appearance
colors · borders · shadows · radii · backgrounds · opacity

### Components
buttons · inputs · selects · tabs · badges · cards · dialogs · drawers · icons

### Responsive behavior
wrapping · width constraints · overflow · responsive visibility · breakpoint behavior

**Check the composition, not just the overflow.** At every sampled width, ask which artboard
composition owns that width (see the Responsive Contract in [01_DISCOVERY.md](01_DISCOVERY.md))
and confirm that is what actually rendered. "No horizontal overflow" is not a responsive result:
a phone layout stretched across a 1280px window overflows nothing and is still wrong.

Sample at minimum: **each artboard width**, plus **at least one width that is neither** — a real
laptop viewport such as 1280. The in-between widths are where responsive defects live; the
artboard widths are the two places guaranteed to look right.

Produce a **composition table** — the whole range in one artifact, step ≤ 40px, each row naming
what actually rendered:

```text
width   overflow   composition   columns   headline
 320       none      mobile         1        36px
 …
 900       none      mobile         1        36px   ← a stretched band, and the table shows it
1280       none      desktop        3      49.8px
```

Sampling three widths cannot show a *band*; the table can. It is also what stops the usual wrong
fix — raising the breakpoint moves a stretched band instead of removing it, and the table makes
the moved band visible immediately.

### Operability

A screen is not verified until it has been **operated**. Count the affordances the artboard draws
and exercise each one in the browser: click a card and land on its target, type in the input,
switch the toggle and see the switch, apply the sort and see the order change. Report what you
clicked and what happened.

`0 links · 0 inputs · 0 selects` under a grid of cards is a failure, not a phase boundary.

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
✓ parity harness report attached (06_PARITY_HARNESS.md passes 1-3, zero DEFECT)
✓ geometry compared as numbers — boxes, container padding/gap, overflow AND bleed
✓ visual comparison done at 1:1 (tall content split, never scaled down)
✓ Paper → App comparison passed, over the node tree
✓ App → Paper comparison passed
✓ structural checks passed
✓ layout / typography / appearance checks passed
✓ each artboard composition verified at its own artboard width
✓ at least one non-artboard width verified, and it rendered the composition that owns it
✓ composition table produced across the full range — no band renders a stretched composition
✓ the page is operable: every affordance the artboard draws was exercised in the browser
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
| 7 | **Mobile composition on a desktop viewport** | The desktop breakpoint was set to where the artboard's fixed widths stop fitting, so an ordinary laptop width (1200–1380) falls into the mobile branch and renders the phone layout stretched across the screen. The overflow check passes — a stretched mobile layout overflows nothing. Verify which composition rendered, and derive the breakpoint per the Responsive Contract instead. |
| 8 | **Verified only at artboard widths** | Screenshots at exactly 390 and 1440 look perfect while every width between them is wrong. Those two widths are the only ones guaranteed to pass; capturing only them makes the defect invisible in the agent's own evidence. Always capture a non-artboard width in the same pass. |
| 9 | **Inert page** | Every pixel matches and nothing works — cards do not open, inputs do not type, toggles do not toggle. Count the interactive elements the artboard implies and operate them; `0 links / 0 inputs` under a grid of cards is the signature. See "UI only does not mean inert" in [02_IMPLEMENTATION.md](02_IMPLEMENTATION.md). |
| 10 | **Raising the breakpoint instead of fixing the class** | A stretched composition is found at one width, the breakpoint is moved, and the same stretch reappears in the band below the new threshold. The fix is the composition rule (grids reflow by available width, controls appear when they fit), not the number. Prove it with the composition table, which shows every band at once. |
| 11 | **Mockup artefact transcribed as spec** | Two languages on one screen, a lorem string, a schematic count — properties of how the drawing was assembled, reproduced faithfully into the product. Read the artboard's own annotations, and resolve artefacts from the product instead of copying them. |
| 12 | **Real data leaks a field Paper never drew** | A reused component brings its own currency symbol, its own badge, its own field labels (`WATER`/`NATURE` where Paper's criteria section says "Water cleanliness"/"Facilities") along with the value it was wired for. Only visible once real data is behind the card — a static pass with sample data cannot show it. Re-run Direction B after wiring. |
| 13 | **Layout only tested at the artboard's sample count** | Paper's card shows N photos; production sometimes gives fewer. A grid that was never asked "what do you look like at 3" ships whatever the generic math produces — an unbalanced, untested arrangement nobody designed. Treat content count like viewport width: derive a rule for the range, don't assume the sample count is the only count. |
| 14 | **Text-only parity check** | The harness matched strings and compared fonts/colours, and reported clean. Padding, offsets, wrapping and overflow were never compared — the boxes were *collected* and never diffed. Every geometric defect on the page survives such a check. Compare numbers (06_PARITY_HARNESS.md pass 2), or the report means nothing. |
| 15 | **Non-text nodes never enumerated** | A missing `border-top` above a provenance line, a badge whose label is empty in current data, a divider, a legend swatch — none are strings, so a string-keyed Direction A cannot fail on them. Enumerate the node tree. |
| 16 | **Shared-wrapper offset read as forty separate defects** | One wrong value on a container (a token scale mapping `px-7` to 28px instead of 64px, a `w-content` nested inside another padded box) shifts every section head on the page. Compared child-by-child it looks like many small unrelated errors, or like nothing at all. Compare containers first. |
| 17 | **Under-bleed invisible to the overflow check** | A hero that should span the viewport renders with white gutters. `document.scrollWidth === viewport` passes — nothing overflowed. Check that full-bleed nodes *reach* the edges, not only that nothing exceeds them. |
| 18 | **"It's dev data" absorbing a real defect** | Missing badges, prices and chips were filed as data gaps with no probe. Some were; some were code paths that never rendered. A data-gap claim without endpoint + field + observed value attached is an unverified excuse, and it converts defects into accepted behaviour. |
| 19 | **A Paper node deleted on the agent's own judgment** | Rank chips the artboard draws were removed because the reused feed carried no rank — a value that was derivable from data already on the page. Removal is as unilateral as invention, and the owner meets it as "you lost it". Derive, or raise it as a conflict; never drop silently. |
| 20 | **Downscaled visual comparison** | Sections rendered side by side at half scale hide every defect under ~4px and soften everything under ~20px. The agent looks honestly and sees nothing, because the image no longer contains the defect. Compare at 1:1; split tall content instead of scaling it. |
| 21 | **Export mistaken for the design** | A PNG export rasterised a display face with a system fallback; an HTML export shipped a CSS build that did not match the design tool's. Both made the *reference* wrong, so the implementation was "fixed" toward a lie. On any disagreement about a fundamental (font, token, spacing), resolve with `get_computed_styles` against the Paper node. |

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
* a node was transferred although it contradicts a recorded product decision
* an existing test was inverted or weakened so the migration would pass
* a backend state was designed without Paper approval
* final visual verification was skipped
* a second page was started while another page was still unapproved
* a phase was marked `done` in the state file without meeting its requirements
* **phase 3 reported `pass` without a parity-harness report** ([06_PARITY_HARNESS.md](06_PARITY_HARNESS.md))
* **geometry was "checked" by looking at images instead of comparing numbers**
* **a Paper node was dropped without an owner decision or a recorded, owner-visible derivation**
* **a missing element was attributed to data without the probe that proves it**

## When the human finds a defect the harness missed

Phase 4 exists to judge taste, product fit and intent. It is **not** the place where geometric and
structural defects are discovered — those are the machine's job, and the human is the last line, not
the first.

So when the reviewer reports a defect the harness could have caught:

```text
1. do NOT start fixing the defect
2. find the hole in the harness that let it through
3. fix the harness, re-run it, and see the defect appear in its output
4. fix everything the widened harness now reports — not only the one the human named
5. only then request review again
```

Fixing the named defect first is how a list of ten becomes a list of ten more: the reviewer keeps
finding what the instrument still cannot see. **If the human is asked to enumerate defects, the
instrument is the defect.**

---

## Gate — phase 3

```text
✓ every check above ran against a real browser screenshot of the real route
✓ result = pass
✓ screenshot artifact recorded in the state file
```

→ continue with [04_HUMAN_REVIEW.md](04_HUMAN_REVIEW.md).
