/**
 * Generates plugins/bmad/_shared/agent-manifest.csv from plugin agent .md files.
 *
 * The manifest is a structured registry with rich persona metadata used by
 * party-mode and advanced-elicitation skills to simulate agent personalities
 * without loading all individual agent files at runtime.
 *
 * Reads from plugins/bmad/agents/*.md (already-generated agent files) to
 * ensure the manifest exactly matches what is installed in the plugin.
 *
 * Columns: name,displayName,title,icon,role,identity,communicationStyle,principles,module,path
 *
 * Run: bun scripts/generate-agent-manifest.ts [--dry-run]
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PLUGIN } from './lib/config.ts';

const DRY_RUN = process.argv.includes('--dry-run');

const AGENTS_DIR = join(PLUGIN, 'agents');
const MANIFEST_PATH = join(PLUGIN, '_shared/agent-manifest.csv');

const CSV_HEADER =
  'name,displayName,title,icon,role,identity,communicationStyle,principles,module,path\n';

interface AgentRow {
  name: string;
  displayName: string;
  title: string;
  icon: string;
  role: string;
  identity: string;
  communicationStyle: string;
  principles: string;
  module: string;
  path: string;
}

/** Escape a value for CSV output (wrap in quotes, escape internal quotes). */
function escapeCsv(value: string): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

/** Normalize whitespace and collapse newlines for CSV-safe single-line output. */
function cleanForCsv(text: string | undefined): string {
  if (!text) return '';
  return text.trim().replaceAll(/\s+/g, ' ');
}

/** Extract a section body following a `## Heading` line. Stops at next heading. */
function extractSection(content: string, heading: string): string {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];

  for (const line of lines) {
    if (line === `## ${heading}`) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (line.startsWith('## ') || line.startsWith('# ')) break;
      sectionLines.push(line);
    }
  }

  return sectionLines.join('\n').trim();
}

/**
 * Parse a plugin agent .md file and extract structured metadata.
 *
 * Expected format (produced by generate-agents.ts):
 *   ---
 *   name: <slug>
 *   ...
 *   ---
 *   # <title> - <displayName> (<slug>)
 *   **Icon:** <emoji> **Module:** <MODULE>
 *   ## Role
 *   ...
 *   ## Identity
 *   ...
 *   ## Communication Style
 *   ...
 *   ## Principles
 *   ...
 */
function parseAgentMd(slug: string, content: string): AgentRow | null {
  // Extract name from frontmatter
  const nameMatch = content.match(/^name:\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1]!.trim() : slug;

  // Extract title and displayName from H1: "# Title - DisplayName (slug)"
  const h1Match = content.match(/^# (.+?) - (.+?) \(\w[\w-]*\)$/m);
  const title = h1Match ? h1Match[1]!.trim() : '';
  const displayName = h1Match ? h1Match[2]!.trim() : name;

  // Extract icon and module from "**Icon:** <emoji> **Module:** <MODULE>"
  const iconModuleMatch = content.match(
    /\*\*Icon:\*\*\s+(\S+)\s+\*\*Module:\*\*\s+(\w+)/,
  );
  const icon = iconModuleMatch ? iconModuleMatch[1]!.trim() : '';
  const moduleUpper = iconModuleMatch ? iconModuleMatch[2]!.trim() : '';
  const module = moduleUpper.toLowerCase();

  // Extract section bodies
  const role = cleanForCsv(extractSection(content, 'Role'));
  const identity = cleanForCsv(extractSection(content, 'Identity'));
  const communicationStyle = cleanForCsv(
    extractSection(content, 'Communication Style'),
  );
  const principles = cleanForCsv(extractSection(content, 'Principles'));

  if (!role && !identity) {
    return null; // Not a valid agent file
  }

  return {
    name,
    displayName,
    title,
    icon,
    role,
    identity,
    communicationStyle,
    principles,
    module,
    path: `plugins/bmad/agents/${slug}.md`,
  };
}

/** Render a single agent row as a CSV line. */
function renderRow(row: AgentRow): string {
  return [
    escapeCsv(row.name),
    escapeCsv(row.displayName),
    escapeCsv(row.title),
    escapeCsv(row.icon),
    escapeCsv(row.role),
    escapeCsv(row.identity),
    escapeCsv(row.communicationStyle),
    escapeCsv(row.principles),
    escapeCsv(row.module),
    escapeCsv(row.path),
  ].join(',');
}

// === Main ===

console.log(
  DRY_RUN
    ? 'Dry run — no files will be written\n'
    : 'Generating agent manifest...\n',
);

const entries = await readdir(AGENTS_DIR);
const agentFiles = entries.filter((f) => f.endsWith('.md')).sort();

const rows: AgentRow[] = [];
let skipped = 0;

for (const file of agentFiles) {
  const slug = file.replace(/\.md$/, '');
  const content = await readFile(join(AGENTS_DIR, file), 'utf8');
  const row = parseAgentMd(slug, content);

  if (!row) {
    console.log(`  skip: ${slug} (no role/identity sections found)`);
    skipped++;
    continue;
  }

  rows.push(row);
  console.log(`  + ${slug} (${row.module})`);
}

const csvContent = `${CSV_HEADER + rows.map(renderRow).join('\n')}\n`;

if (DRY_RUN) {
  console.log(
    `\n[dry-run] would write: plugins/bmad/_shared/agent-manifest.csv`,
  );
  console.log(`[dry-run] ${rows.length} agents (${skipped} skipped)`);
} else {
  await Bun.write(MANIFEST_PATH, csvContent);
  console.log(`\nWrote: plugins/bmad/_shared/agent-manifest.csv`);
  console.log(`Total: ${rows.length} agents (${skipped} skipped)`);
}
