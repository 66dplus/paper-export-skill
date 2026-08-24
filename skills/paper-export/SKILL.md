---
name: paper-export
description: Deterministic phase-gated workflow for integrating a Paper design into a React/TypeScript application without redesigning it. Use whenever a Paper frame, artboard or selection is turned into React/JSX, when Paper MCP tools are in play (get_jsx, get_screenshot, get_tree_summary, get_computed_styles), or when the user says "design to code", "export from Paper", "implement this Paper frame", "migrate this artboard", "redesign these pages", "wire this design to the backend", "make it pixel perfect from the design". Enforces one page per human-review cycle (extract, implement, eval, serve on localhost, get explicit approval, lock, only then the next page), MCP-first extraction, a UI-before-backend order, a real-browser screenshot gate, a bidirectional Paper<->App element check, UI LOCK before backend work, and an explicit STOP on any state Paper does not define.
license: MIT
metadata:
  author: DMITRII RYBKIN
  version: "2.0.0"
---

# Paper → React Integration Skill v2

## 0. Purpose

This skill defines a deterministic workflow for integrating Paper-generated UI into an existing React / TypeScript application.

The goal is not to recreate or redesign the UI.

The goal is to produce a React implementation that is visually and structurally faithful to the Paper source while safely integrating application logic and backend data.

Paper is the authoritative source of truth for the designed UI.

---

## One Page = One Review Cycle

The redesign must be processed one page at a time.

Never implement multiple pages before human review.

For each page, the agent must complete the full cycle independently:

1. Extract the page from Paper.
2. Implement the page in React.
3. Run the automated Eval.
4. Make the real page available on localhost.
5. Request human review.
6. Apply all requested changes.
7. Re-run the automated Eval.
8. Request review again if changes were made.
9. Mark the page as APPROVED only after explicit human approval.
10. Lock the approved page before moving to the next page.

The agent MUST NOT start implementing the next page until the current page is explicitly approved.

Maximum unreviewed scope: one page.

# 1. Non-Negotiable Principles

## 1.1 Paper is the UI source of truth

Paper defines:

* structure
* hierarchy
* element presence
* element order
* layout
* spacing
* typography
* colors
* borders
* radii
* shadows
* responsive behavior
* visual states represented by the artboard

The existing application does NOT override Paper.

Agent assumptions do NOT override Paper.

Existing components do NOT override Paper.

Best practices do NOT override Paper.

---

## 1.2 Do not recreate what Paper can export

Never manually reconstruct information that Paper MCP can provide.

Prefer, in this order:

1. Paper-exported JSX
2. Paper-exported styling
3. Paper-provided node/tree information
4. Paper-provided computed styles
5. Agent-generated implementation only when direct export is impossible

Generated implementation is the last resort.

---

## 1.3 Do not treat computed styles as the primary source

`get_computed_styles` is a verification and diagnostic tool.

It is NOT a replacement for the Paper JSX structure.

Do not take individual numbers from computed styles and rebuild the interface manually.

A value without its structural context is insufficient.

For example:

```text
width: 280px
```

is not equivalent to preserving:

```text
width: 280px
flexShrink: 0
```

plus the surrounding layout and spacer nodes.

---

## 1.4 Existing application UI is not automatically reusable

Existing DOM structure may differ from Paper.

Existing CSS may conflict with Paper.

Existing components may contain elements that do not exist in Paper.

Do not preserve an existing implementation merely because it already exists.

If the Paper structure differs, replace the relevant UI subtree with the Paper structure.

Reuse existing components only when their rendered structure and behavior are compatible with Paper.

---

# 2. Scope

This skill applies to:

* React
* TypeScript
* Next.js
* Vite
* other React-based applications

The skill assumes that Paper is used as the visual design source and that the application contains real routing, state, APIs, authentication, and backend logic.

---

# 3. Required Operating Modes

The agent MUST treat the work as separate phases.

Never combine all phases into one uncontrolled operation.

```text
PHASE 0 — PROJECT INSPECTION
PHASE 1 — PAPER EXTRACTION
PHASE 2 — UI IMPLEMENTATION
PHASE 3 — VISUAL VALIDATION
PHASE 4 — UI LOCK
PHASE 5 — BACKEND INTEGRATION
PHASE 6 — INTERACTION / ANIMATION
PHASE 7 — FINAL EVAL
```

A phase may not be considered complete until its gate passes.

---

# 4. PHASE 0 — PROJECT INSPECTION

Before changing code:

Inspect the application.

Determine:

* framework
* React version
* TypeScript usage
* routing system
* styling system
* CSS architecture
* Tailwind usage
* existing design tokens
* component library
* data-fetching layer
* state-management layer
* authentication
* relevant route
* relevant existing components

Do not modify code during this phase.

---

## 4.1 Styling System Detection

Determine what styling system the project actually uses.

Possible examples:

* Tailwind
* CSS Modules
* global CSS
* component-library styling
* styled-components
* another project-specific system

Do not assume the styling system from filenames alone.

Inspect real usage.

---

## 4.2 Paper Styling Format

When extracting the design from Paper:

Use the styling representation that is appropriate for the project and available from Paper.

Examples:

```text
React + Tailwind project
→ use Paper JSX with Tailwind representation
```

```text
React + CSS project
→ use the closest direct Paper export available
→ do not manually reconstruct the entire stylesheet from computed values
```

Never blindly convert between styling systems.

Never regenerate an existing Paper representation simply because another format looks cleaner.

---

# 5. PHASE 1 — PAPER EXTRACTION

The agent MUST extract the Paper design before implementing it.

For each target artboard / frame:

1. Identify the exact Paper node.
2. Read the relevant Paper structure.
3. Obtain the Paper screenshot.
4. Obtain the Paper JSX export.
5. Inspect the tree / hierarchy when necessary.
6. Inspect computed styles only where needed for verification or ambiguity.
7. Identify visual states represented by the artboard.

---

# 6. MCP-FIRST POLICY

If information is available through Paper MCP, retrieve it through Paper MCP.

Never infer information that can be obtained directly.

Never approximate information that can be obtained directly.

Never manually recreate information that can be exported directly.

---

# 7. REQUIRED PAPER MCP LOG

The agent MUST maintain a machine-readable action log for the migration.

At minimum, record:

```text
timestamp
phase
artboard
tool
target
purpose
result
```

Example:

```text
[PHASE 1]
artboard: 03 — Beaches
tool: get_jsx
target: A1
purpose: obtain authoritative React structure
result: success
```

The log MUST contain every Paper MCP action performed.

Do not report only the final list of tools.

Record actual usage.

---

# 8. REQUIRED TOOL REPORT

At the end of the task, report:

```text
Paper MCP Usage

Artboard: 01 — Login
- get_selection: used
- get_tree_summary: used
- get_jsx: used
- get_screenshot: used
- get_computed_styles: used
- get_node_info: not used

Artboard: 03 — Beaches
...
```

Do not claim a tool was used if it was not used.

---

# 9. PAPER ARTIFACTS

For every migration unit, preserve access to:

```text
Paper screenshot
Paper JSX
Paper hierarchy/tree information
relevant style information
identified visual state
```

These become the reference artifacts for the Eval.

---

# 10. MIGRATION UNIT

Never migrate an entire large application as one uncontrolled task.

A migration unit is:

```text
one artboard
+
one route
+
one explicit UI state
```

Examples:

```text
Login — default
Beaches — populated
Ratings — populated
Hotels — selected
Hotels — drawer open
```

Do not assume that one artboard represents every state of the application.

---

# 11. STATE INVENTORY

Before implementation, create a state inventory for each route.

Example:

```text
Hotels

1. initial
2. loading
3. empty
4. populated
5. selected
6. drawer open
7. error
```

For every state:

```text
Paper design exists → migrate it

Paper design does not exist → do not invent it
```

An undefined state must be explicitly marked:

```text
OUT OF SCOPE — NO PAPER DESIGN
```

---

# 12. PHASE 2 — UI IMPLEMENTATION

The first implementation pass must focus ONLY on reproducing the Paper UI.

Do not integrate backend logic during the first pass.

Do not refactor the application simultaneously.

Do not redesign.

---

# 13. JSX RULES

The Paper JSX export is the primary structural reference.

Preserve:

* DOM hierarchy
* nesting
* element count
* element order
* wrappers
* containers
* semantic elements
* classes
* attributes
* responsive classes
* data attributes
* accessibility attributes

Do not:

* simplify JSX
* reorganize JSX
* merge wrappers
* remove wrappers
* add wrappers
* replace elements
* merge components merely for cleanliness
* split components merely for abstraction

---

# 14. STYLING RULES

Preserve the visual result of the Paper export.

Do not:

* invent styles
* simplify styles
* optimize styles
* "clean up" styles
* rewrite layout
* normalize spacing
* replace custom controls with native controls
* replace visual components with defaults

A native `<select>` is NOT equivalent to a custom Paper select.

A generic button is NOT equivalent to a Paper button.

A flex layout with a spacer node is NOT equivalent to a larger flexible input.

---

# 15. STRUCTURAL FIDELITY RULE

The agent must preserve not only numeric style values but the mechanisms producing the layout.

Preserve:

* flex direction
* flex grow
* flex shrink
* flex basis
* grid structure
* spacer elements
* wrappers
* alignment containers
* explicit width constraints
* min/max widths
* positioning context

Do not copy only visible numbers.

Preserve the layout system.

---

# 16. NO UI INVENTION

The following are forbidden unless represented by Paper:

* buttons
* icons
* labels
* controls
* navigation
* cards
* badges
* helper text
* tooltips
* dialogs
* drawers
* empty states
* status indicators
* additional actions
* additional navigation
* additional copy

If something is absent from Paper, it must not appear in the migrated state.

---

# 17. BIDIRECTIONAL UI CHECK

Every screen MUST be evaluated in both directions.

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

Anything failing either direction is a mismatch.

This is mandatory.

---

# 18. PHASE 3 — VISUAL VALIDATION

A migration is NOT considered successful because:

* TypeScript compiles
* Next.js builds
* tests pass
* the component renders
* CSS looks plausible
* the DOM contains similar classes

The real route MUST be opened in a real browser.

Use the actual application.

Use the real session when required.

Use the actual route.

Do not validate using a mock HTML stand.

---

# 19. REAL SCREENSHOT GATE

For each migration unit:

1. Open the real route.
2. Reach the exact target state.
3. Take a screenshot.
4. Compare it against the Paper screenshot.
5. Identify differences.
6. Fix the implementation.
7. Take another screenshot.
8. Repeat until the visual gate passes.

No "looks good enough" completion is allowed.

---

# 20. VISUAL EVAL

The visual Eval must inspect:

### Structure

* missing elements
* extra elements
* wrong hierarchy
* wrong nesting
* wrong ordering

### Layout

* widths
* heights
* alignment
* spacing
* margins
* padding
* flex/grid behavior
* wrapping
* positioning

### Typography

* font family
* size
* weight
* line height
* letter spacing
* casing

### Appearance

* colors
* borders
* shadows
* radii
* backgrounds
* opacity

### Components

* buttons
* inputs
* selects
* tabs
* badges
* cards
* dialogs
* drawers
* icons

### Responsive behavior

* wrapping
* width constraints
* overflow
* responsive visibility
* breakpoint behavior

---

# 21. SCREENSHOT COMPARISON RULE

A screenshot comparison is required even if the agent believes the implementation is correct.

The agent must never self-certify based solely on code inspection.

---

# 22. PHASE 4 — UI LOCK

Once visual validation passes:

The UI enters LOCKED state.

After UI LOCK:

Do not change:

* layout
* structure
* styles
* dimensions
* visual hierarchy
* element presence

Backend integration must occur around the locked UI.

---

# 23. PHASE 5 — BACKEND INTEGRATION

Only after visual validation passes may the agent integrate:

* API calls
* data fetching
* mutations
* state
* authentication
* routing
* business logic
* validation
* loading logic
* error handling

The goal is:

```text
same UI
+
real data
```

not:

```text
new UI
+
real data
```

---

# 24. BACKEND DATA RULE

Hardcoded Paper data should be replaced by real application data without changing the visual structure.

For example:

```text
Paper:
<Metric value="602" />
```

becomes:

```text
<Metric value={data.total} />
```

The component structure remains unchanged unless a real interaction requirement makes a technical change unavoidable.

---

# 25. STATES CREATED BY BACKEND

Backend integration may introduce states not represented in Paper.

Examples:

* loading
* error
* empty
* unavailable
* invalid input

Do NOT invent visual treatment for these states.

If a required state has no approved design:

```text
STOP

Report:
State: [name]
Reason: no Paper design exists
Required action: provide Paper design
```

---

# 26. PORTALS AND DOM CONTEXT

Special care is required for:

* Radix portals
* dialogs
* drawers
* popovers
* dropdowns
* tooltips
* modals

A portal can change CSS inheritance and variable scope.

The agent MUST validate portal-rendered surfaces in the real browser.

Do not assume inherited CSS variables remain available after portaling.

Technical changes are allowed only when necessary to preserve the exact Paper visual result.

---

# 27. ALLOWED TECHNICAL DIFFERENCES

The implementation does not need to reproduce Paper's internal implementation mechanism if the final rendered result is identical.

Examples:

* different React component boundaries
* different state management
* different API layer
* different portal mechanism
* different event handling

However:

```text
different implementation
≠
different UI
```

The rendered output must remain equivalent.

---

# 28. ANIMATIONS

Animations are a separate implementation pass.

Do not redesign static UI while adding animation.

Preferred approach:

### Simple hover / focus

Use CSS transitions where appropriate.

### Click / press

Use Motion when necessary.

### Enter / exit

Use Motion.

### Layout animation

Use Motion.

### Scroll-triggered animation

Use Motion or an appropriate browser API.

Animations must not introduce UI elements that are absent from Paper.

Animations must not change layout in a way that contradicts the design.

---

# 29. ANIMATION EVAL

Validate:

* hover
* focus
* active
* click
* enter
* exit
* scroll
* layout transitions

only when those interactions are specified by the product/design requirements.

Do not invent animations simply because the screen looks static.

---

# 30. PHASE 7 — FINAL EVAL

The task is COMPLETE only if all required gates pass.

## Gate 1 — Paper Extraction

```text
✓ target artboard identified
✓ Paper JSX obtained
✓ Paper screenshot obtained
✓ hierarchy inspected
✓ styling information obtained
✓ state identified
```

## Gate 2 — Implementation

```text
✓ Paper structure represented
✓ no unexplained extra UI
✓ no unexplained missing UI
✓ styling system preserved
```

## Gate 3 — Real Browser

```text
✓ real route opened
✓ real state reached
✓ real screenshot captured
```

## Gate 4 — Visual Comparison

```text
✓ Paper → App comparison passed
✓ App → Paper comparison passed
```

## Gate 5 — Backend

```text
✓ mock data replaced
✓ UI preserved
✓ data states verified
```

## Gate 6 — Final Regression

```text
✓ original route still works
✓ no unrelated UI changed
✓ no console errors
✓ no runtime errors
✓ build passes
✓ TypeScript passes
```

---

# 31. Definition of Done

A migration is DONE only when:

```text
Paper source exists
AND
Paper JSX was retrieved
AND
Paper screenshot was retrieved
AND
real route was rendered
AND
real screenshot was captured
AND
Paper → App comparison passed
AND
App → Paper comparison passed
AND
backend integration preserved the locked UI
AND
runtime checks passed
```

Build success alone is NEVER sufficient.

---

# 32. Failure Conditions

The task MUST be considered FAILED if any of the following occurs:

* Paper JSX was not retrieved when available
* Paper screenshot was not retrieved
* real route was not tested
* visual comparison was not performed
* extra UI was introduced
* Paper UI was missing
* existing UI structure was preserved despite a Paper structure mismatch
* styling was manually recreated when direct export was available
* computed styles were used as a substitute for structural export
* an undefined state was invented
* a backend state was designed without Paper approval
* final visual verification was skipped

---

# 33. Agent Action Log

The agent MUST maintain a concise action log.

Example:

```text
# Migration Log

[10:01] PHASE 0
Inspected project.
Framework: Next.js
Language: TypeScript
Styling: Tailwind

[10:04] PHASE 1
Artboard: 03 — Beaches
get_selection → success
get_tree_summary → success
get_screenshot → success
get_jsx → success
get_computed_styles → success

[10:12] PHASE 2
Replaced existing toolbar subtree with Paper JSX.
No backend changes.

[10:19] PHASE 3
Opened /beaches in real browser.
Reached populated state.
Captured screenshot.

[10:21] PHASE 3
Visual mismatch detected:
- search width
- missing spacer
- table nesting

[10:29] PHASE 2
Fixed Paper hierarchy.

[10:35] PHASE 3
Second screenshot captured.
Visual comparison passed.

[10:37] PHASE 4
UI LOCKED.

[10:40] PHASE 5
Connected beaches API.

[10:49] PHASE 7
Final regression passed.
```

---

# 34. Final Report

Every completed migration MUST end with:

```text
# Paper Migration Report

## Scope
Artboards:
Routes:
States:

## Paper MCP Usage
[List every tool actually used]

## Implementation
[What was changed]

## Visual Validation
Paper screenshot: ✓
Real route screenshot: ✓
Paper → App: PASS
App → Paper: PASS

## Backend Integration
[Summary]

## Undefined States
[List or "None"]

## Runtime Validation
TypeScript: PASS/FAIL
Build: PASS/FAIL
Runtime: PASS/FAIL

## Final Status
PASS / FAIL

## Remaining Issues
[List]
```

---

# 35. Evidence Requirement

Do not report:

```text
"looks correct"
```

Report evidence.

Each PASS should have a corresponding artifact or verification step.

Examples:

```text
Paper screenshot
Real browser screenshot
MCP tool result
Route URL
State reached
Screenshot comparison result
```

---

# 36. Final Rule

Never optimize against the source.

Never redesign against the source.

Never "improve" against the source.

Never guess against the source.

When the Paper design and the agent's assumptions conflict:

```text
Paper wins.
```

When the existing application and Paper conflict:

```text
Paper wins for UI.
Application architecture wins for non-visual implementation details.
```

When uncertain:

```text
Inspect Paper.
Measure.
Compare.
Do not guess.
```

---

## 37. Golden Principle

The agent is not being asked:

> "Can you build something that looks like this design?"

The agent is being asked:

> "Can you prove that the real React application renders the same UI represented by this Paper design, and then integrate real application behavior without changing that UI?"

That is the standard.