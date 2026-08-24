# paper-export-skill

A **global agent skill** for [Claude Code](https://claude.com/claude-code) (and any agent that reads
`SKILL.md` files) that governs how a coding agent turns a **[Paper](https://paper.design)** design into a
real React / TypeScript application.

It is not a style guide. It is a **deterministic, phase-gated workflow** with an explicit definition of
done, an explicit list of failure conditions, and a hard cap on how much work can happen before a human
looks at it: **one page**.

One rule underneath all of it: **Paper is the source of truth for the UI.** The agent proves the app
renders that design, then wires real behavior around it — it does not redesign, "improve", simplify, or
regenerate it.

## Why

Coding agents are trained to write good code. Handed a design, they quietly rewrite it: merge wrappers,
rename classes, "clean up" the JSX, rebuild a layout from a handful of computed numbers, swap a custom
control for a native `<select>`, and add the empty state nobody asked for. Then they declare success
because TypeScript compiled.

This skill closes both holes — the rewriting **and** the self-certification:

> Build success alone is NEVER sufficient.

## One page = one review cycle

The single most important constraint: the agent processes **one page at a time** and may not start the
next one until the current one is explicitly approved by a human.

```
extract from Paper → implement → automated Eval → serve on localhost
→ request human review → apply requested changes → re-run Eval
→ re-review if changed → APPROVED → lock → next page
```

Maximum unreviewed scope is one page. No batch of screens lands at once, and no page is "done" because
the agent thinks so.

## The workflow

```
PHASE 0 — PROJECT INSPECTION      inspect framework, styling system, data layer; change nothing
PHASE 1 — PAPER EXTRACTION        MCP-first: JSX, screenshot, tree, computed styles, state
PHASE 2 — UI IMPLEMENTATION       UI only; no backend, no refactor, no redesign
PHASE 3 — VISUAL VALIDATION       real route, real browser, real screenshot vs Paper
PHASE 4 — UI LOCK                 layout/structure/styles frozen
PHASE 5 — BACKEND INTEGRATION     same UI + real data
PHASE 6 — INTERACTION / ANIMATION separate pass, never touches static UI
PHASE 7 — FINAL EVAL              six gates, all must pass
```

A phase is not complete until its gate passes.

## What it enforces

- **One page, one approval** — the full extract → implement → eval → localhost → human review → lock cycle runs per page. The next page does not start until the current one is APPROVED.
- **MCP first** — anything Paper can export is retrieved from Paper, never inferred, approximated or hand-rebuilt. Generated implementation is the last resort.
- **Computed styles are diagnostics, not a source** — `width: 280px` is not the same fact as `width: 280px` + `flexShrink: 0` + the spacer node next to it. Preserve the layout *mechanism*, not the visible numbers.
- **Existing app UI is not automatically reusable** — code does not win over Paper just because it already exists.
- **Migration unit = one artboard + one route + one explicit state** — no "migrate the whole app" as a single uncontrolled task. Every route gets a state inventory; a state Paper does not define is marked `OUT OF SCOPE — NO PAPER DESIGN`, not invented.
- **Real browser gate** — open the real route, reach the real state, screenshot it, compare against the Paper screenshot, fix, repeat. Mock HTML stands and code inspection do not count.
- **Bidirectional check** — Paper → App (is every designed element there?) *and* App → Paper (is every rendered element designed?). Failing either direction is a mismatch.
- **UI LOCK** — once visual validation passes, backend integration happens *around* the frozen UI.
- **Backend-created states stop the work** — loading / error / empty with no Paper design triggers an explicit STOP report requesting a design, never an improvised one.
- **Portals are validated in the browser** — Radix dialogs, drawers and popovers can lose CSS variable scope; assumption is not allowed here.
- **Evidence, not adjectives** — every PASS carries an artifact (screenshot, MCP result, route, state reached). "Looks correct" is not a report.
- **Honest tool log** — every Paper MCP call is logged as it happens, and the final report may not claim a tool that was not used.

Twelve named **failure conditions** close the task as FAILED — including skipping the visual comparison,
using computed styles as a substitute for structural export, and inventing an undefined state.

## Install

From GitHub, no clone needed:

```bash
npx github:66dplus/paper-export-skill
```

Or install the CLI globally:

```bash
npm install -g github:66dplus/paper-export-skill
paper-export-skill install
```

Both write the skill to `~/.claude/skills/paper-export/`. **Restart Claude Code** (or open a new session)
to load it.

### Updating

Re-run the same command — the installer reports the version change and overwrites:

```bash
npx github:66dplus/paper-export-skill      # ↻ paper-export: v1.0.0 → v2.0.0
```

### Per-project install

To vendor the skill into one repository instead of your home directory:

```bash
npx github:66dplus/paper-export-skill install --project
```

→ `./.claude/skills/paper-export/` (commit it if you want the whole team on the same contract).

### Other commands

```bash
paper-export-skill where              # show source + target paths and installed version
paper-export-skill install --force    # reinstall / overwrite
paper-export-skill uninstall          # remove it
```

Add `--project` to any of them to act on `./.claude/skills` instead of `~/.claude/skills`.

### Manual install

The skill is a single self-contained file — copying it works just as well:

```bash
git clone https://github.com/66dplus/paper-export-skill.git
cp -R paper-export-skill/skills/paper-export ~/.claude/skills/
```

## Usage

Once installed the skill triggers on its own for design-to-code work — a Paper frame, artboard or
selection being implemented, or the Paper MCP tools being in play. You can also invoke it explicitly:

```
/paper-export
```

It expects the **Paper MCP server** (`get_selection`, `get_tree_summary`, `get_jsx`, `get_screenshot`,
`get_computed_styles`, `get_node_info`) and a way to open the real app in a real browser — the visual
gate is not optional.

## Layout

```
skills/paper-export/SKILL.md   the contract itself (the whole skill)
bin/cli.js                     zero-dependency installer
```

## License

MIT © 2026 **DMITRII RYBKIN** — see [LICENSE](LICENSE).
