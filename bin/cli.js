#!/usr/bin/env node
/**
 * paper-export-skill — installer for the "paper-migration" agent skill (Claude Code / opencode).
 *
 * Usage:
 *   npx github:66dplus/paper-export-skill            # install globally (~/.claude/skills)
 *   paper-export-skill install [--project] [--force]
 *   paper-export-skill uninstall [--project]
 *   paper-export-skill where
 *   paper-export-skill opencode [--project] [--model <id>] [--dry-run] [--force]
 *     # opencode setup: installs the skill, wires the Paper MCP server and a
 *     # vision-capable `paper-vision` subagent into ~/.config/opencode/opencode.jsonc
 *     # (or ./opencode.jsonc with --project). The vision model is chosen from the
 *     # live registry at runtime — never hardcoded.
 */

import { cp, copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, '..');
const SOURCE_SKILLS = path.join(PACKAGE_ROOT, 'skills');

/** Skill directories shipped under an older name — removed on install so no stale copy competes. */
const LEGACY_SKILLS = ['paper-export'];

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('-')) ?? 'install';
const isProject = args.includes('--project') || args.includes('-p');
const isForce = args.includes('--force') || args.includes('-f');
const isDryRun = args.includes('--dry-run');

/** Target skills directory: user-global by default, repo-local with --project. */
function targetRoot() {
  return isProject
    ? path.join(process.cwd(), '.claude', 'skills')
    : path.join(homedir(), '.claude', 'skills');
}

async function listSkills() {
  const entries = await readdir(SOURCE_SKILLS, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function skillVersion(dir) {
  try {
    const body = await readFile(path.join(dir, 'SKILL.md'), 'utf8');
    const match = body.match(/^\s*version:\s*"?([^"\n]+)"?\s*$/m);
    return match ? match[1].trim() : 'unknown';
  } catch {
    return null;
  }
}

async function removeLegacy(dest) {
  const shipped = await listSkills();
  for (const name of LEGACY_SKILLS) {
    if (shipped.includes(name)) continue;
    const stale = path.join(dest, name);
    if (!existsSync(stale)) continue;
    await rm(stale, { recursive: true, force: true });
    console.log(`✗ removed superseded skill: ${stale}`);
  }
}

async function install() {
  const dest = targetRoot();
  await mkdir(dest, { recursive: true });
  await removeLegacy(dest);
  const skills = await listSkills();

  for (const name of skills) {
    const from = path.join(SOURCE_SKILLS, name);
    const to = path.join(dest, name);

    if (existsSync(to) && !isForce) {
      const installed = await skillVersion(to);
      const incoming = await skillVersion(from);
      if (installed === incoming) {
        console.log(`= ${name} already installed (v${installed}) — nothing to do`);
        continue;
      }
      console.log(`↻ ${name}: v${installed} → v${incoming} (overwriting)`);
    }

    await rm(to, { recursive: true, force: true });
    await cp(from, to, { recursive: true });
    const version = await skillVersion(to);
    console.log(`✓ ${name} v${version} → ${to}`);
  }

  console.log('');
  console.log(`Installed into ${dest}`);
  console.log('Restart Claude Code / opencode (or start a new session) to load the skill.');
  console.log(`Then invoke it with ${skills.map((n) => `/${n}`).join(' or ')}, or let it trigger on Paper design-to-code work.`);
}

async function uninstall() {
  const dest = targetRoot();
  await removeLegacy(dest);
  const skills = await listSkills();
  for (const name of skills) {
    const to = path.join(dest, name);
    if (!existsSync(to)) {
      console.log(`- ${name} not installed at ${to}`);
      continue;
    }
    await rm(to, { recursive: true, force: true });
    console.log(`✗ removed ${to}`);
  }
}

async function where() {
  const dest = targetRoot();
  console.log(`source:  ${SOURCE_SKILLS}`);
  console.log(`target:  ${dest}`);
  for (const name of await listSkills()) {
    const to = path.join(dest, name);
    const installed = existsSync(to) ? await skillVersion(to) : null;
    const incoming = await skillVersion(path.join(SOURCE_SKILLS, name));
    console.log(`  ${name}: package v${incoming}, installed ${installed ? `v${installed}` : 'no'}`);
  }
}

// ---------------------------------------------------------------------------
// opencode setup — Paper MCP + `paper-vision` subagent, model chosen at runtime.
// ---------------------------------------------------------------------------

const MC_MODELS_URL = 'https://models.dev/api.json';
const PAPER_MCP_URL = 'http://127.0.0.1:29979/mcp';
const PAPER_MCP = { type: 'remote', url: PAPER_MCP_URL, enabled: true };

/** Strip // and /* *\/ comments plus trailing commas so JSONC parses as JSON. */
function jsoncParse(text) {
  let clean = text.replace(/^\uFEFF/, '');
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');
  clean = clean.replace(/(^|[^:"'\\])\/\/.*$/gm, '$1');
  clean = clean.replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(clean);
}

const jsoncStringify = (value) => JSON.stringify(value, null, 2) + '\n';

function opencodeConfigPath() {
  return isProject
    ? path.join(process.cwd(), 'opencode.jsonc')
    : path.join(homedir(), '.config', 'opencode', 'opencode.jsonc');
}

/** Vision-capable openrouter models from the live registry, cheapest first. */
async function loadVisionModels() {
  const res = await fetch(MC_MODELS_URL);
  if (!res.ok) throw new Error(`models.dev fetch failed: ${res.status}`);
  const catalog = await res.json();
  const provider = catalog?.openrouter;
  if (!provider?.models) throw new Error('openrouter provider missing from models.dev catalog');
  return Object.entries(provider.models)
    .map(([id, m]) => ({
      id: `openrouter/${id}`,
      name: m.name || id,
      cost: Number.isFinite(m.cost?.input) ? m.cost.input : null,
      vision: m.attachment === true || (m.modalities?.input ?? []).includes('image'),
    }))
    .filter((m) => m.vision)
    .sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity) || a.id.localeCompare(b.id));
}

/** Resolve --model to a known id; bare ids get the openrouter/ prefix when they exist there. */
function normalizeModelId(candidate, available) {
  const known = new Set(available.map((m) => m.id));
  if (known.has(candidate)) return candidate;
  const bare = candidate.replace(/^openrouter\//, '');
  return known.has(`openrouter/${bare}`) ? `openrouter/${bare}` : null;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rl.question(question).finally(() => rl.close());
}

function agentBlock(model) {
  return {
    description:
      'Vision-capable subagent for visual comparison of screenshots. USE whenever screenshots must ' +
      'be compared: Paper design vs real app render (paper-migration phase 3), before/after ' +
      'screenshots, screenshot review, pixel-diff judgment. Give it both screenshots and the list ' +
      'of differences to check; it returns a verdict.',
    mode: 'subagent',
    model,
  };
}

async function pickModel(models, explicitId) {
  if (explicitId) {
    const id = normalizeModelId(explicitId, models);
    if (!id) {
      console.error(`✗ model "${explicitId}" not found or not vision-capable.`);
      console.error('  Available examples: ' + models.slice(0, 6).map((m) => m.id).join(', '));
      process.exit(1);
    }
    console.log(`→ vision model: ${id}`);
    return id;
  }

  console.log('');
  console.log('Vision-capable models on the openrouter provider (cheapest first):');
  models.slice(0, 20).forEach((m, i) => {
    const cost = m.cost != null ? `$${m.cost}/M-in` : 'n/a';
    console.log(`  ${String(i + 1).padStart(2)}. ${m.id}  (${m.name})  [${cost}]`);
  });
  console.log('');

  if (!process.stdin.isTTY) {
    console.error('✗ interactive model selection needs a TTY — rerun with --model <provider/model-id>.');
    process.exit(1);
  }
  const answer = (await ask('Pick a vision model [Enter = 1]: ')).trim();
  const idx = Number.parseInt(answer, 10);
  const choice = answer !== '' ? models[Number.isNaN(idx) ? -1 : idx - 1] : models[0];
  if (!choice) {
    console.error(`✗ invalid choice "${answer}" (1–${Math.min(models.length, 20)}).`);
    process.exit(1);
  }
  return choice.id;
}

async function opencode() {
  await install();

  let models;
  try {
    models = await loadVisionModels();
  } catch (err) {
    console.error(`✗ could not fetch the model registry (${err.message}).`);
    console.error('  Rerun with --model <provider/model-id> to skip the registry lookup.');
    process.exit(1);
  }
  if (models.length === 0) {
    console.error('✗ no vision-capable openrouter models found in the registry.');
    process.exit(1);
  }

  const explicit = args.find((a) => a.startsWith('--model=')) ?? null;
  const model = await pickModel(models, explicit ? explicit.slice('--model='.length) : null);

  const configPath = opencodeConfigPath();
  const existing = existsSync(configPath) ? jsoncParse(await readFile(configPath, 'utf8')) : {};
  const paperAlready = existing.mcp?.paper;

  const merged = { ...existing, $schema: existing.$schema ?? 'https://opencode.ai/config.json' };
  if (isForce || !paperAlready) merged.mcp = { ...(existing.mcp ?? {}), paper: PAPER_MCP };
  if (isForce || !existing.agent?.['paper-vision']) {
    merged.agent = { ...(existing.agent ?? {}), 'paper-vision': agentBlock(model) };
  }

  if (isDryRun) {
    console.log('\n[dry-run] would write to ' + configPath);
    console.log(jsoncStringify(merged));
    process.exit(0);
  }

  let changed = false;
  if (merged.mcp?.paper && !paperAlready) {
    console.log(`\n✓ Paper MCP server wired (${PAPER_MCP_URL})`);
    changed = true;
  }
  if (merged.agent?.['paper-vision'] && !existing.agent?.['paper-vision']) {
    console.log(`✓ paper-vision subagent created → ${model}`);
    changed = true;
  } else if (isForce) {
    console.log(`✓ paper-vision subagent updated → ${model}`);
    changed = true;
  }
  if (!changed) {
    console.log('= opencode.jsonc already configured (Paper MCP + paper-vision present).');
    console.log('  Use --force to update the vision model.');
    return;
  }

  if (existsSync(configPath)) await copyFile(configPath, `${configPath}.bak`);
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, jsoncStringify(merged));
  console.log(`✓ wrote ${configPath}`);
  if (existsSync(`${configPath}.bak`)) console.log(`  (backup: ${configPath}.bak)`);
  console.log('');
  console.log('opencode setup complete. Restart opencode to load the config.');
  console.log('The paper-migration skill sends phase-3 screenshot comparisons to the paper-vision subagent.');
}

const commands = { install, uninstall, remove: uninstall, where, opencode };

const run = commands[command];
if (!run) {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: paper-export-skill [install|uninstall|where|opencode] [--project] [--force] [--dry-run] [--model <id>]');
  process.exit(1);
}

try {
  await stat(SOURCE_SKILLS);
} catch {
  console.error(`Cannot find bundled skills at ${SOURCE_SKILLS}`);
  process.exit(1);
}

await run();