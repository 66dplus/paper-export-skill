# paper-export-skill

A **global agent skill** for [Claude Code](https://claude.com/claude-code), [opencode](https://opencode.ai)
and any agent that reads `SKILL.md` files — it governs how a coding agent migrates a
**[Paper](https://paper.design)** design into a real React / TypeScript application.

It is not a style guide. It is a **phase-gated, state-machine-driven pipeline** with an explicit
definition of done, an explicit list of failure conditions, and a hard cap on how much work can happen
before a human looks at it: **one page**.

Underneath all of it: **Paper is the source of truth for the UI.** The agent *proves* the app renders
that design, then wires real behavior around it — it does not redesign, "improve", simplify, or
regenerate it.

**Setup by agent:**

- [**Claude Code** setup →](#claude-code-setup)
- [**OpenCode** setup →](#opencode-setup)
- [**Codex** setup →](#codex-setup)

## Why

Coding agents are trained to write good code. Handed a design, they quietly rewrite it: merge wrappers,
rename classes, "clean up" the JSX, rebuild a layout from a handful of computed numbers, swap a custom
control for a native `<select>`, and add the empty state nobody asked for. Then they declare success
because TypeScript compiled — and they do it to twelve screens before anyone looks.

This skill closes all three holes — the rewriting, the self-certification, and the unreviewed batch:

> Build success alone is NEVER sufficient.
> Maximum unreviewed scope: one page.

## Structure

The skill is a short entry point plus one file per phase, loaded on demand — not an 20 KB monolith the
agent has to hold in context all at once.

```
paper-migration/
├── SKILL.md               top-level rules + the workflow map (~5 KB)
├── 00_STATE.md            the JSON state machine: shape, legal transitions, gates
├── 01_DISCOVERY.md        phase 0–1: project inspection, MCP-first Paper extraction
├── 02_IMPLEMENTATION.md   phase 2: JSX/styling/structural-fidelity rules, no UI invention
├── 03_EVAL.md             phase 3: real-browser screenshot gate, bidirectional check, regression cases
├── 04_HUMAN_REVIEW.md     phase 4: READY_FOR_REVIEW → APPROVED / CHANGES_REQUESTED
└── 05_FINALIZATION.md     phase 5: UI lock, backend, animation, regression, final report
```

## The workflow

```
PHASE 0  DISCOVERY         inspect the project — change nothing
PHASE 1  PAPER EXTRACTION  MCP-first: JSX, screenshot, tree, styles, state
PHASE 2  IMPLEMENTATION    UI only — no backend, no refactor, no redesign
PHASE 3  AUTOMATED EVAL    real route, real browser, bidirectional comparison
PHASE 4  HUMAN REVIEW      localhost → APPROVED / CHANGES_REQUESTED
PHASE 5  FINALIZATION      UI lock → backend → animation → regression → report
```

Phases advance strictly in order. `CHANGES_REQUESTED` sends the page **back** to phase 2 → 3 → 4, never
forward.

## The state file

Progress lives in `.paper-migration-state.json` at the root of the app being migrated — per page, per
phase, with artifacts and human feedback recorded:

```json
{
  "page": "beaches",
  "status": "ready_for_review",
  "current_phase": 3,
  "phases": {
    "1_extraction":   { "status": "done", "artifacts": { "jsx": true, "screenshot": true, "tree": true } },
    "3_eval":         { "status": "done", "result": "pass" },
    "4_human_review": { "status": "pending", "result": null, "feedback": [] }
  }
}
```

> The JSON state file is the authoritative workflow state. Never advance a page or phase without
> updating the state file first. Never mark a phase as `done` unless all phase requirements are
> satisfied.

Two consequences that make it more than a log:

- **Phase 4 cannot be self-approved.** Silence is not approval, a passing eval is not approval. Only an
  explicit human `APPROVED` moves the page.
- **A new session resumes from the file**, not from a fresh re-analysis of the whole project.

## What it enforces

- **One page, one approval** — the full extract → implement → eval → localhost → human review → lock cycle runs per page. At most one page may be unapproved at a time; starting a second is a named failure condition.
- **MCP first** — anything Paper can export is retrieved from Paper, never inferred, approximated or hand-rebuilt. Generated implementation is the last resort.
- **Computed styles are diagnostics, not a source** — `width: 280px` is not the same fact as `width: 280px` + `flexShrink: 0` + the spacer node next to it. Preserve the layout *mechanism*, not the visible numbers.
- **Existing app UI is not automatically reusable** — code does not win over Paper just because it already exists.
- **Migration unit = one artboard + one route + one explicit state** — every route gets a state inventory; a state Paper does not define is marked `OUT OF SCOPE — NO PAPER DESIGN`, not invented.
- **…but only if the state is avoidable** — an app can decline to open a drawer; it cannot decline to render at 1280px. Undefined states split into *avoidable* (drawer, empty list, error panel) and *unavoidable* (every viewport width, focus ring, text length). For an unavoidable one there is no "not designed" option — something renders regardless, so it is derived from the artboards, and raised with the derivation already implemented.
- **Responsive contract** — an artboard is a composition *sampled* at one width, not a layout that exists only at that width. Its pixel widths are proportions of its content box (`820` in `1312` is `62.5%`), with the artboard width as the anchor where the proportion must still equal the original number exactly. A breakpoint set to "where the fixed widths stop fitting" is a named bug: that number is an artefact of transcription and routinely lands above ordinary laptop widths, handing them the phone composition stretched across the screen.
- **Real browser gate** — open the real route, reach the real state, screenshot it, compare against Paper, fix, repeat. Mock HTML stands and code inspection do not count.
- **Bidirectional check** — Paper → App *and* App → Paper. The second direction is the one that catches invented UI.
- **"Not in Paper" is not "ask the human"** — most gaps have exactly one answer the product already gives (a Search button searches, a card links to what it depicts, an English page is in English). Each gap runs a derivation test; only taste, strategy, money and the irreversible survive it. A report field named "owner decisions" tends to get filled, so every entry must carry the reason it failed the test.
- **Artboards carry mockup artefacts, not only intent** — two languages on one screen, lorem strings, schematic counts. Transcribed faithfully, they reproduce the accident instead of the design; they are resolved from the product, and the artboard's own annotations are read before a number is treated as a fact.
- **"UI only" does not mean inert** — the phase boundary is about business logic, not about whether the page works. Cards open, inputs type, toggles toggle; reusing a data path the app already has is how the page becomes reviewable at all. An inert page cannot be reviewed — the only question in front of it is whether it resembles the picture the human already has.
- **Named regression cases** — missing spacer nodes, native `<select>` substitution, extra buttons, layouts rebuilt from computed numbers, portals losing CSS variables, the phone composition on a desktop viewport, evidence captured only at artboard widths, inert pages, breakpoints raised instead of the composition rule fixed, and mockup artefacts shipped as spec. The list is meant to grow.
- **UI LOCK** — after approval, backend integration happens *around* the frozen UI.
- **Backend-created states stop the work** — loading / error / empty with no Paper design triggers an explicit STOP requesting a design, never an improvised one.
- **Evidence, not adjectives** — every PASS carries an artifact. "Looks correct" is not a report, and the tool log may not claim a tool that was not used.

Fourteen named **failure conditions** close a task as FAILED — including skipping the visual comparison,
using computed styles as a substitute for structural export, inventing an undefined state, and marking a
phase `done` without meeting its requirements.

## Claude Code setup

From GitHub, no clone needed:

```bash
npx github:66dplus/paper-export-skill
```

Or install the CLI globally:

```bash
npm install -g github:66dplus/paper-export-skill
paper-export-skill install
```

Both write the skill to `~/.claude/skills/paper-migration/`. **Restart Claude Code** (or open a new
session) to load it.

> Upgrading from v1/v2: the skill was renamed `paper-export` → `paper-migration` when it was split into
> phase files. The installer removes the old directory automatically, so no stale copy competes with it.

### Per-project install

```bash
npx github:66dplus/paper-export-skill install --project
```

→ `./.claude/skills/paper-migration/` (commit it to put the whole team on the same contract).

### Other commands

```bash
paper-export-skill where              # show source + target paths and installed version
paper-export-skill install --force    # reinstall / overwrite
paper-export-skill uninstall          # remove it
```

Add `--project` to any of them to act on `./.claude/skills` instead of `~/.claude/skills`.

### Manual install

```bash
git clone https://github.com/66dplus/paper-export-skill.git
cp -R paper-export-skill/skills/paper-migration ~/.claude/skills/
```

## OpenCode setup

[opencode](https://opencode.ai) loads the skill automatically from `~/.claude/skills/` (no extra step),
but the phase-3 screenshot gate needs two things wired in your opencode config: the **Paper MCP
server** and a **vision-capable subagent** that performs the Paper ↔ app screenshot comparison.

The skill never hardcodes a vision model for opencode — the model is chosen at setup time from your
providers:

```bash
# one-liner: install the skill + wire Paper MCP + create the paper-vision subagent
npx github:66dplus/paper-export-skill opencode

# non-interactive: pick the model yourself (list candidates first, see below)
npx github:66dplus/paper-export-skill opencode --model openrouter/<provider-id>/<vision-model>
```

The interactive menu lists vision-capable models from the live
[models.dev](https://models.dev) registry, cheapest first; `Enter` takes the first. Flags:

```bash
paper-export-skill opencode --project    # write ./opencode.jsonc instead of the global config
paper-export-skill opencode --dry-run    # print the resulting config, write nothing
paper-export-skill opencode --force      # overwrite an existing paper-vision model
```

To list candidates yourself:

```bash
curl -s https://models.dev/api.json | jq '.openrouter.models | to_entries[] |
  select(.value.attachment == true or (.value.modalities.input // [] | index("image"))) | .key'
```

Manual wiring — copy [`opencode/opencode.jsonc.example`](opencode/opencode.jsonc.example) into your
`opencode.jsonc` (project) or `~/.config/opencode/opencode.jsonc` (global) and replace
`PROVIDER/YOUR_VISION_MODEL` with the model of your choice. Then **restart opencode**.

## Codex setup

[Codex](https://github.com/openai/codex) follows the same logic as Claude Code: it reads the same
`SKILL.md`-based skill files and connects to Paper through the same local MCP endpoint.

**Skill.** Codex loads skills from `.agents/skills` (project) and `~/.agents/skills` (user) — see
[where Codex loads local skills](https://developers.openai.com/codex/build-skills). Point it at the
bundled copy:

```bash
mkdir -p ~/.agents/skills
cp -R paper-migration ~/.agents/skills/
```

Codex detects newly installed skills automatically; restart Codex if it does not show up.

**Paper MCP.** Same endpoint as Claude Code, configured the Codex way — add to `~/.codex/config.toml`
(or `.codex/config.toml` for a project):

```toml
[mcp_servers.paper]
url = "http://127.0.0.1:29979/mcp"
```

Or use the desktop app: Settings → MCP servers → Add server → **Streamable HTTP** →
`http://127.0.0.1:29979/mcp`, then Restart.

**Vision.** The phase-3 screenshot gate is the only place the model matters: it must be run by a
vision-capable model. Nothing here hardcodes one — pick your model in Codex's configuration as usual.

## Usage

Once installed the skill triggers on its own for design-to-code work — a Paper frame, artboard or
selection being implemented, or the Paper MCP tools being in play. You can also invoke it explicitly:

```
/paper-migration
```

It expects the **Paper MCP server** (`get_selection`, `get_tree_summary`, `get_jsx`, `get_screenshot`,
`get_computed_styles`, `get_node_info`) and a way to open the real app in a real browser — the visual
gate is not optional.

## License

MIT © 2026 **DMITRII RYBKIN** — see [LICENSE](LICENSE).
