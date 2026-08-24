#!/usr/bin/env node
/**
 * paper-export-skill — installer for the "paper-export" Claude Code skill.
 *
 * Usage:
 *   npx github:66dplus/paper-export-skill            # install globally (~/.claude/skills)
 *   paper-export-skill install [--project] [--force]
 *   paper-export-skill uninstall [--project]
 *   paper-export-skill where
 */

import { cp, mkdir, readdir, rm, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, '..');
const SOURCE_SKILLS = path.join(PACKAGE_ROOT, 'skills');

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('-')) ?? 'install';
const isProject = args.includes('--project') || args.includes('-p');
const isForce = args.includes('--force') || args.includes('-f');

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

async function install() {
  const dest = targetRoot();
  await mkdir(dest, { recursive: true });
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
  console.log('Restart Claude Code (or start a new session) to load the skill.');
  console.log('Then invoke it with /paper-export, or let it trigger on Paper design-to-code work.');
}

async function uninstall() {
  const dest = targetRoot();
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

const commands = { install, uninstall, remove: uninstall, where };

const run = commands[command];
if (!run) {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: paper-export-skill [install|uninstall|where] [--project] [--force]');
  process.exit(1);
}

try {
  await stat(SOURCE_SKILLS);
} catch {
  console.error(`Cannot find bundled skills at ${SOURCE_SKILLS}`);
  process.exit(1);
}

await run();
