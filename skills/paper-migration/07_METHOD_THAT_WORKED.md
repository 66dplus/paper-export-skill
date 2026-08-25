# 07 — The method that worked

The 2026-08-25 beach-page migration is the first one that survived owner review with a short,
specific defect list instead of "почти все баги общие". This file records **what actually
produced that**, because the difference was not effort — the previous three attempts spent more.

The whole method is one sentence: **render the design and the implementation in the same
browser, measure both with the same code, and fix what the numbers disagree about.**

---

## 1. The reference is a local file, rendered — not a screenshot, not the MCP

Export the artboard to a self-contained HTML file and open it in the same Chromium that loads the
app. Then a single Playwright extractor walks both DOMs and emits the same record per node.

Why this and not the obvious alternatives:

| Alternative | What it actually measures |
|---|---|
| MCP screenshot vs app screenshot | two rasterisers with two font stacks — every difference is suspect |
| `get_jsx` read by eye | whether the agent's attention held for 600 nodes |
| Reading computed styles per node over MCP | correct, but one round-trip per node — unusable at page scale |

The export is a *convenience*, so **validate it against the file before trusting it**: compare the
export's section offsets with Paper's own `get_children` y-values. On this page the desktop export
matched 12 of 16 sections to the pixel, and the four misses were all the same cause — the export's
theme has no numeric `lineHeight` keys, so `leading-6` fell back to Tailwind's 24px where Paper
draws 40px. Patching that one key into the reference's config brought it to **15 of 16 desktop and
15 of 15 mobile, total height exact**. The one remaining gap was a defect in the design file itself.

That validation step is not optional. It is what converts "a render that looks right" into a
reference you are allowed to diff against.

---

## 2. Compare what the browser paints, not the tree

The skill already allows a different React component boundary when the rendered result is equal.
So tree-shaped diffing reports fiction: a heading is "missing" because the implementation nested it
one level deeper. Two rules fixed this:

* The unit of comparison is a **significant node** — it carries text, or it paints something of its
  own (border, background, image, svg). Wrappers are not compared.
* Matching is **anchor-based**: pair by content and position, greedily, best-first. Order-free, so
  nesting depth cannot break it.

Then a **second matching round** pairs whatever is left *by box alone*: a node sitting where Paper
drew it is that node, and the difference is `wording`, not one MISSING plus one EXTRA. Without that
round, the artboard's sample copy (part of it in Italian) buries every real finding.

**Noise rules that paid for themselves,** each added only after it produced a wrong finding:

```text
third-party widget internals (Leaflet tiles/panes/controls)  → accepted substitution, not 40 defects
SVG <g>                                                       → a grouping element, paints nothing
inside SVG: `color` and `line-height`                         → do not paint; compare `fill`
line counting                                                 → over the CONTENT box, not the border box
overflow                                                      → only where Paper does NOT also overflow
section height                                                → `heightVaries` with a written reason
```

The last one matters most: an artboard shows ONE sample count, production data decides the real one.
Say so in the section map **and still print it**, so an allowance can never become invisible.

---

## 3. What the numbers found that eyes did not

Every one of these is a class, not an instance — which is why the count fell so fast.

| Defect | How it hid | Found by |
|---|---|---|
| `hidden md:block … flex flex-col` in **12 sections** | media rule beats `flex`; every `gap-*` inert on desktop | section heights + grouped offsets |
| `leading-6` = 40px in Paper, 24px in a bare Tailwind build | classes transfer "cleanly", compile, lint | comparing against the FILE, not the export |
| `border-t-rule`, `border-y-rule-soft` — **18 usages, none defined** | silently falls back to Tailwind's default grey | `paint` on non-text nodes |
| `line-clamp-1` cancelled by a neighbouring `inline-block` | clamp sets `display:-webkit-box`; the other class wins | node height = two lines |
| `.paper-scope .px-5` beats `.md\:px-7`; `md:w-content` never generated | desktop silently keeps the mobile padding | container box vs artboard |
| a JSX comment without braces rendering as visible text | looks like a comment in the source | `extra` text nodes containing `/*` |

Note the shape they share: **a class that resolves to nothing, or to something else, still compiles
and still lints.** Only a rendered measurement sees it — or a static audit written for exactly this
family, which is cheaper and runs first:

```text
UNDEFINED  a class named after a design token that no scope rule defines
           → it silently resolves to the framework default
SHADOWED   a `md:X` outranked by a same-family base class the scope overrides
           → `.paper-scope .px-5` is more specific than `.md\:px-7`
```

Ship it with the harness and run it before the diff (`audit-classes.mjs` in the reference
implementation). Regression-check it against the stylesheet as it stood **before** the fixes: on
this page it reports 13 findings, including the two the owner reported by eye. An audit that cannot
reproduce the defects it was written for is not evidence of anything.

**Rule for responsive pairs:** never mix a scope-overridden token class with a variant of the same
property. Either define `.paper-scope .md\:<class>` as well, or make both sides arbitrary values
(`gap-[40px] md:gap-[48px]`), which no scope rule can outrank.

### The gap between sections belongs to neither section

Each section is compared against its own origin, so a missing space **between** two of them is
invisible to every per-section check. That is precisely the one defect on 2026-08-25 that a full
pass over the report would still have missed: the owner saw two blocks touching, and the report had
not one word about it.

Measure it explicitly — last painted node of one section to first painted node of the next, adjacent
artboard sections only — and treat a background equal to the page's own ground as painting nothing,
because the export paints the ground once at the root while the app paints it again per section.
Added on the day, it immediately found three more real defects, one of which was a regression the
same session had just introduced.

---

## 4. A "no data" claim is a measurement or it is nothing

Three claims from the previous pass were checked and two were false:

```text
"the nearby feed carries no rank"      → FALSE. rankRegion present (181, 10, …).
                                         The rank was dropped in the view-model adapter,
                                         and the ranking endpoint returns exactly the
                                         artboard's list. The chips came back.
"hotel prices are dev-data thin"       → TRUE, and worse: prod read shows priceFrom
                                         non-null on 0 of 69 listings. Nowhere, not just locally.
"no venue points for the map pins"     → TRUE, and now provable: beach_facility has no
                                         coordinate columns at all; establishment has
                                         27,166 rows and 0 with geometry.
```

Measure **production**, not the dev database — a local emptiness is not a property of the product.
Where prod has the data and dev does not, seed a local fixture that mirrors the prod distribution,
guarded so it cannot run anywhere but localhost, and with `--revert`. Never invent a value prod
does not have: the hotel price pill stays unrendered precisely because nothing anywhere has one.

---

## 5. Order of work

```text
1. build the instrument            — and validate the reference against the design file
2. run it, keep the baseline       — commit the report; it is the before-picture
3. fix by CAUSE, not by finding    — one `md:block` fix cleared 12 sections at once
4. re-run after every fix          — the number is the proof, not the intention
5. sharpen the instrument when it lies — a wrong finding is a harness bug, fix it there
6. hand the human a page plus a written list of what is knowingly open
```

Step 6 is what changes the review. The owner should spend their pass on taste and product fit —
so tell them, before they look, which deviations are already known and why: data ceilings with
their measurement, design-file defects with the evidence, and content-count variance with the rule
derived for it. Every item they report that was already on that list is a pass you wasted.

---

## 6. The honest limits of this instrument

It compares the page to the design. It does not know whether the design is right, whether a value
is true, or whether motion, hover and focus behave. It measures one resting state at one width per
run. And it cannot see anything the reference render itself gets wrong — which is why §1's
validation against the design file is the load-bearing step, and why a defect the human still finds
means the harness gets fixed **first**, before the defect does.
