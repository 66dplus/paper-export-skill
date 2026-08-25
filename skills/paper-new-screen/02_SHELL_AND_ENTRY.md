# 02 — The Shell Boundary and the Entry Point

The two hazards that exist **only** when the screen is new. Read this before writing any code.

---

# A. The shell is not the screen

An artboard is drawn as a complete picture. It shows the header, the sidebar, the footer, the page
background — because a designer has to draw the whole frame for the screen to read correctly.

**The application already renders those.** The new route nests inside a layout that supplies them.

If the artboard is implemented as one block, the result is a page that renders the header twice, the
footer twice, or a container inside an identical container. It compiles, it matches the artboard when
screenshotted alone, and it is visibly broken in place.

## Split before implementing

On the Paper tree, classify every top-level node:

```text
SHELL    the app already renders this   → do not implement
SCREEN   the route's own content        → implement from Paper
UNCLEAR  looks like shell but differs   → resolve before phase 2
```

`UNCLEAR` is the interesting case, and it has exactly two resolutions:

* **The difference is a mockup artefact** — the designer drew an approximation of the real header.
  The app's real shell wins. Implement nothing; note it in the review request.
* **The difference is intentional** — this screen genuinely has a different header, no sidebar, a
  full-bleed background. Then the *change to the shell* is its own decision with its own visual
  consequences for every other screen using that layout. It is **not** silently implemented inside the
  new screen. Report it and get an answer.

Never resolve `UNCLEAR` by implementing both and letting the layout sort it out.

## Verify in place, not in isolation

The screenshot gate in [../paper-migration/03_EVAL.md](../paper-migration/03_EVAL.md) must capture the
route **as the application renders it**, inside its real layout — not the component in isolation, not a
standalone preview. A screen that only matches Paper when rendered alone has not been verified.

Check explicitly:

```text
✓ exactly one header
✓ exactly one footer
✓ no nested duplicate page container
✓ no double padding / double max-width
✓ the shell's own spacing is not re-implemented by the screen
```

---

# B. The entry point

A new screen has to be reachable. A menu item, a link, a button. **The artboard of the new screen does
not contain it** — it lives on some *other* screen, which this wave may not be touching.

This collides head-on with the shared rule
[../paper-migration/02_IMPLEMENTATION.md](../paper-migration/02_IMPLEMENTATION.md) §No UI invention,
which forbids adding navigation Paper does not define. Without a resolution the agent has two bad
options: violate the rule, or ship a screen nobody can open.

## The scoped exception

> Adding the minimum UI required to **reach** the new screen is permitted. Adding anything beyond
> reaching it is invention and remains forbidden.

Permitted, under all four conditions:

1. **Minimum.** One nav item, one link, or one button. Not a section, not a card, not a banner, not a
   redesigned menu.
2. **Native to its host, not to Paper.** The entry point is built in the style of the screen that hosts
   it — the existing navigation's own markup, spacing and typography. It is **not** styled from the new
   artboard, and it does not import the new screen's tokens. Paper owns the new screen; the host owns
   the entry point.
3. **Recorded.** Written into the state file as `entry_point` with its type, host screen and label
   before it is built.
4. **Declared at review.** Named explicitly in `READY_FOR_REVIEW` — what was added, where, and what it
   says — so the reviewer evaluates it as an addition rather than discovering it.

Still forbidden, with no exception:

```text
✗ a nav section, a menu redesign, a reordered navigation
✗ a promotional card, banner, badge or callout pointing at the new screen
✗ copy invented to describe the screen beyond its label
✗ changing an existing entry point's destination
✗ styling the host's navigation to match the new artboard
```

## When the label itself is a decision

The entry point needs a word. If the artboard, the route name and the owner's recorded decisions do not
supply one, **the label is a product decision, not an implementation detail.** Use the screen's own title
from the artboard when one exists; otherwise ask, and record the answer.

Never invent marketing copy for a navigation label.

## The honest alternatives

`direct_url` — the screen ships reachable only by URL. Correct when the entry point belongs to a
navigation redesign that has not happened yet.

`none_yet` — the screen ships and the entry point is explicitly a later task.

Both are legitimate and both must be **stated in the review request**. What is not legitimate is
defaulting into unreachability by never raising the question.

---

## Gate — before phase 2 begins

```text
✓ every top-level artboard node classified SHELL / SCREEN
✓ no node left UNCLEAR
✓ intentional shell changes reported, not silently implemented
✓ entry point type, host and label recorded in the state file
✓ entry point (if any) scoped to reaching the screen and nothing more
```
