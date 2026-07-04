/**
 * Plugin validation.
 *
 * Pre-v6.5.0+ this script ran a three-way upstream-coverage check
 * (upstream files ↔ plugin files ↔ plugin.json manifest) plus content
 * consistency, agent matching, naming, etc. After the migration to
 * installer-based sync (sync-from-installer.ts), the installer is the
 * source of truth — there is nothing to cross-check against.
 *
 * What survives:
 * - Version consistency (per-module version files + plugin version
 *   anchoring).
 * - A sanity check that plugins/bmad/skills/ exists and is non-empty.
 *
 * Exit 0 = pass, exit 1 = gaps found.
 */

import { exists, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { checkVersion } from './lib/checks/index.ts';
import { PLUGIN } from './lib/config.ts';
import {
  fail,
  GREEN,
  hasFailed,
  pass,
  RED,
  RESET,
  section,
  setVerbose,
} from './lib/output.ts';

setVerbose(process.argv.includes('--verbose'));

console.log('Validating plugin (installer-sync mode)...\n');

// 1. Version consistency
await checkVersion();

// 2. Plugin tree sanity
section('Plugin Tree');
const skillsDir = join(PLUGIN, 'skills');
if (!(await exists(skillsDir))) {
  fail(`plugins/bmad/skills/ does not exist — run \`bun run sync\` first`);
} else {
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory());
  if (skillDirs.length === 0) {
    fail(`plugins/bmad/skills/ is empty — run \`bun run sync\` first`);
  } else {
    pass(`plugins/bmad/skills/ contains ${skillDirs.length} skill directories`);
  }

  // No deprecated upstream shims — the plugin ships only the current
  // skill surface (sync prunes DEPRECATED forwarders).
  const deprecated: string[] = [];
  for (const dir of skillDirs) {
    const skillMd = join(skillsDir, dir.name, 'SKILL.md');
    if (!(await exists(skillMd))) continue;
    const fm = (await Bun.file(skillMd).text()).match(/^---\n([\s\S]*?)\n---/);
    if (fm?.[1]?.includes('DEPRECATED')) deprecated.push(dir.name);
  }
  if (deprecated.length > 0) {
    fail(
      `deprecated upstream shims present: ${deprecated.join(', ')} — run \`bun run sync\``,
    );
  } else {
    pass('no deprecated upstream shims in the skill tree');
  }
}

// 3. Runtime template + init assets (working-repo initialization)
section('Runtime Template');
const runtimeChecks = [
  'runtime/_bmad/config.toml',
  'runtime/_bmad/scripts/memlog.py',
  'runtime/_bmad/scripts/resolve_customization.py',
  'runtime/_bmad/_config/bmad-help.csv',
  'scripts/init.sh',
  'commands/init.md',
];
for (const rel of runtimeChecks) {
  if (await exists(join(PLUGIN, rel))) {
    pass(`plugins/bmad/${rel} present`);
  } else {
    fail(`plugins/bmad/${rel} missing — run \`bun run sync\``);
  }
}

console.log('');

if (hasFailed()) {
  console.log(`${RED}✗ Validation failed — gaps found above.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✓ Plugin valid.${RESET}`);
}
