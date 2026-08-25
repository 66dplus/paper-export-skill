# Post-mortem — 2026-08-25 · the agent shipped a page it had "verified", and the owner found the defects by looking

**Page:** beach detail (`2 — Beach page`, Desktop DF-0 + Mobile XU-0), design file «Vibrant fern».
**Agent:** Claude Fable 5, three sessions, phases 0–3 marked `done`, `result: pass`.
**Outcome:** the owner opened the page and listed ~10 defects in one pass. Every one of them was
invisible to the agent's own eval. The owner then asked the question this document exists to answer:

> «Как ты вообще проверяешь? Неужели ты их не заметил? Если да — то почему?»
> «Мне надо тебе указать на все?»

The second question is the failure. **A human being asked to enumerate defects is a harness bug,
not a review.** The human's job in phase 4 is to judge taste, product fit and intent — never to be
the linter that the agent should have been.

---

## 1. What the owner found (ground truth)

| # | Defect | Class |
|---|---|---|
| 1 | White gutters down both sides — hero not full-bleed | container geometry |
| 2 | Byline text wrapped onto a second line | text-box geometry |
| 3 | Section-head padding wrong **almost everywhere** (Hotels, Activities, What you need to know…) | container geometry |
| 4 | Hairline rule above the EEA provenance text missing | non-text node |
| 5 | Map section text overflows the side padding | container geometry |
| 6 | Keep exploring — rank chips (#2 #3 #4) gone | node removed by the agent |
| 7 | Hotels lost the badges (Nearest / Best price) and the price | non-text node / data claim |
| 8 | Activities lost their badges too | non-text node / data claim |
| 9 | Water quality & safety — different wording, type and layout, both widths | wording + geometry |
| 10 | Map — a list of missing elements, pinned in Paper by the owner | declared out of scope |

Nine of ten are **geometry or non-text nodes**. One is a node the agent deleted on its own judgment.

---

## 2. Why the agent's eval could not see them

### RC1 — The parity harness compared text, not geometry

The agent built `text-audit.mjs`: it walks text leaves on both sides, matches them by string, and
diffs `fontFamily / fontSize / fontWeight / color / letterSpacing / textTransform`.

It extracted `x, y, width, height` into the record **and never diffed them.** The data was collected
and thrown away. A padding of 28px where the artboard says 64px produces *identical* text records on
both sides — same string, same font, same size, same colour. The harness reports `no mismatch`.

Every defect in rows 1, 2, 3, 5 of the table above is exactly this shape.

### RC2 — Only text nodes were enumerated at all

Direction A ("for every Paper element, does it exist in the app?") was implemented as
"for every Paper **string**, does it exist in the app?".

A `border-top` is not a string. A badge whose label comes from data that happens to be null is not a
string. A divider, a spacer, a chip, an empty container — none are strings. Rows 4, 7, 8 were
structurally unreachable by the check that was supposed to catch them.

### RC3 — "It's dev data" was accepted without a probe

The agent classified the hotel badges, the price and the activity chips as *dev-data gaps* and moved
on. Some of that was true. It was never **measured**: no request to the endpoint, no field read, no
observed value recorded. An unfalsifiable excuse absorbed real defects, and — worse — it made the
final report read as "the code is right, the data is thin", which is a claim the agent had not
earned.

### RC4 — The agent deleted a node the artboard draws

Keep exploring shows rank chips `#2 #3 #4`. The nearby-beach feed carries no `rank`, so the agent
**removed the chips** and wrote a justification about not fabricating data.

The skill forbids *inventing* UI. It never said that *removing* UI is the same class of act. It is:
both are unilateral edits to what the owner designed. And the value was derivable — the page already
renders `#1 in Sardegna` for the beach itself from a real rank; the neighbours' ranks come from the
same ranking the CTA links to. The agent chose deletion over derivation and told nobody in a way the
owner would see before opening the page.

### RC5 — Visual review happened on downscaled composites

Section comparisons were rendered side by side at 660px per half — a 1440px section scaled by 0.46.
A 36px padding error becomes 16px; a 1px hairline disappears entirely; a wrapped line looks like a
slightly taller block. The agent looked at these images and honestly saw nothing. **The image was
below the resolution of the defect.**

### RC6 — Every green gate measured a dimension that could not fail

`check:qa` (static rules), `next build` (compiles), composition table (`scrollWidth > viewport`),
console/network (clean) — all passed, and **none of them can observe a padding value**. The agent
then wrote `3_automated_eval: pass`. This is the project's own rule — *verify by the dimension that
reveals the failure mode, not the convenient one* — violated inside the tool built to enforce it.

### RC7 — Phase 4 was entered with a broken phase 3

The skill's phase order exists so that the human sees a page that already passed a machine check.
The agent entered human review with a harness that was blind to nine of the ten defect classes, so
the human became the detector. Every defect the owner found by eye is proof the phase-3 gate was not
a gate.

---

## 3. The fixes (all shipped in this PR)

| RC | Change |
|---|---|
| 1 | **Geometry diff is mandatory** and defines the phase-3 verdict — [06_PARITY_HARNESS.md](../skills/paper-migration/06_PARITY_HARNESS.md) |
| 2 | **Direction A runs over the Paper node tree**, not over strings — every node id must map or be recorded |
| 3 | **A "data gap" claim needs its probe attached** (endpoint · field · observed value) or it is a defect |
| 4 | **Removing a node Paper draws needs the same authority as inventing one** — derive it, or raise it as a conflict |
| 5 | **No visual comparison below 1:1** — split tall crops, never scale them |
| 6 | Phase 3 `pass` is **impossible** without a clean geometry report attached to the state file |
| 7 | A geometric defect found by a human ⇒ **fix the harness first**, re-run, then re-request review |

---

## 4. The lesson, stated once

The agent verified the dimensions it had a tool for, and declared the page correct.
A green report from a blind instrument is worse than no report: it converts *unknown* into *verified*
and hands the owner a page that has never been checked along the axis where it is wrong.

**Before writing `pass`: name the failure modes, then name the instrument that would have caught each
one. Any failure mode without an instrument is an unverified claim — say so, or build the
instrument.**
