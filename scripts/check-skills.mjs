#!/usr/bin/env node
/**
 * Consistency gate for the shipped skills.
 *
 * `paper-new-screen` delegates phases 2–5 to `paper-migration` and overrides named sections of it.
 * A rename on either side would break that silently — this exits non-zero instead.
 *
 * Checks:
 *   1. every skill directory has a SKILL.md carrying name/description frontmatter
 *   2. every relative markdown link resolves to a real file
 *   3. every `<!-- depends-on ... -->` entry names a file that exists and text it actually contains
 *
 * The depends-on block is an explicit contract on purpose: inferring section references from prose
 * produces false greens, because a file that cites a section also contains its name.
 *
 * Format, one dependency per line:
 *   <relative path to .md> § <text that must appear in it>
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILLS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills');

const failures = [];
const fail = (msg) => failures.push(msg);
const flat = (s) => s.replace(/\s+/g, ' ').toLowerCase();

const dirs = (await readdir(SKILLS, { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const docs = [];
for (const skill of dirs) {
  const skillDir = path.join(SKILLS, skill);
  const files = (await readdir(skillDir)).filter((f) => f.endsWith('.md'));
  if (!files.includes('SKILL.md')) fail(`${skill}: no SKILL.md`);
  for (const file of files) {
    const abs = path.join(skillDir, file);
    docs.push({ rel: `${skill}/${file}`, dir: skillDir, text: await readFile(abs, 'utf8') });
  }
}

// 1 — frontmatter
for (const doc of docs.filter((d) => d.rel.endsWith('/SKILL.md'))) {
  for (const field of ['name:', 'description:']) {
    if (!doc.text.slice(0, 4000).includes(field)) fail(`${doc.rel}: frontmatter missing "${field}"`);
  }
}

// 2 — relative links
let links = 0;
for (const doc of docs) {
  for (const [, target] of doc.text.matchAll(/\]\((?!https?:)([^)#\s]+)\)/g)) {
    links += 1;
    if (!existsSync(path.resolve(doc.dir, target))) fail(`${doc.rel}: broken link → ${target}`);
  }
}

// 3 — depends-on contracts
let deps = 0;
for (const doc of docs) {
  for (const [, body] of doc.text.matchAll(/<!--\s*depends-on\s*([\s\S]*?)-->/g)) {
    for (const line of body.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const [target, ...rest] = line.split('§');
      const needle = rest.join('§').trim();
      if (!target || !needle) {
        fail(`${doc.rel}: malformed depends-on line → ${line}`);
        continue;
      }
      deps += 1;
      const abs = path.resolve(doc.dir, target.trim());
      if (!existsSync(abs)) {
        fail(`${doc.rel}: depends-on target missing → ${target.trim()}`);
        continue;
      }
      if (!flat(await readFile(abs, 'utf8')).includes(flat(needle))) {
        fail(`${doc.rel}: "${needle}" no longer present in ${target.trim()}`);
      }
    }
  }
}

console.log(`skills: ${dirs.length} · files: ${docs.length} · links: ${links} · depends-on: ${deps}`);
if (failures.length) {
  console.error(`\nFAIL (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('PASS — frontmatter present, links resolve, every declared dependency still exists');
