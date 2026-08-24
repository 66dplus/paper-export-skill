# paper-export-skill

A **global agent skill** for [Claude Code](https://claude.com/claude-code) (and any agent that reads
`SKILL.md` files) that governs how a coding agent turns a **[Paper](https://paper.design)** design into code.

One rule, enforced everywhere: **the Paper export is the source of truth.** The agent integrates it —
it does not redesign, "improve", simplify, or regenerate it.

## Why

Coding agents are trained to write good code. When handed a design they quietly rewrite it: they merge
wrappers, rename classes, "clean up" the JSX, regenerate Tailwind from a screenshot, and add the empty
state nobody asked for. The result compiles, looks plausible, and no longer matches the design.

This skill inverts the priority:

> Replication has higher priority than optimization.
> Integration has higher priority than refactoring.

## What it enforces

- **MCP first** — anything Paper can export is retrieved from Paper, never inferred, approximated or regenerated.
- **Styling-system parity** — a CSS project gets a CSS export, a Tailwind project gets a Tailwind export. Never a conversion.
- **Frozen artifacts** — exported JSX hierarchy, wrappers, class names, a11y attributes and responsive classes are immutable.
- **Backend only** — API calls, state, handlers, routing, auth, data fetching, validation, error handling. The UI stays byte-identical.
- **Missing UI = stop** — if the backend needs UI the design does not have, the agent stops and asks for an updated Paper frame instead of inventing one.
- **Animations last** — only after the migration is visually identical, and never by touching Paper styling.
- **Self-review checklist** — 17 checks (hierarchy, element count, spacing, sizing, colors, typography, responsive behavior…) before the task can be called done.

Any visual difference between the Paper export and the shipped UI is treated as a **bug**, not a judgment call.

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

It pairs with the **Paper MCP server** (`get_jsx`, `get_computed_styles`, `get_tokens`, `get_fill_image`,
`export`); without it the skill still applies, but "export first" then means whatever export path the
design tool offers.

## Layout

```
skills/paper-export/SKILL.md   the contract itself (the whole skill)
bin/cli.js                     zero-dependency installer
```

## License

MIT © 2026 **DMITRII RYBKIN** — see [LICENSE](LICENSE).
