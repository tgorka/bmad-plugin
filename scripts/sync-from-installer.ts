/**
 * Installer-based sync (replaces sync-upstream-content.ts and friends).
 *
 * Runs the official `npx bmad-method@<version> install --tools claude-code`
 * into `.upstream-install/`, then copies its `.claude/skills/` output 1:1
 * into `plugins/bmad/skills/`. The installer already produces a Claude Code
 * native tree (correct flat layout, `customize.toml` per skill,
 * agents-as-skills, etc.), so the plugin is a thin wrapper over it.
 *
 * The bmad-loop skill module is synced separately (it is not an
 * npx-installer module): the repo is cloned at the tag pinned in
 * `.upstream-versions/loop.json` and its bundled skills are copied in.
 *
 * Run:
 *   bun scripts/sync-from-installer.ts                 # use core version
 *                                                       # from .upstream-versions/core.json
 *   bun scripts/sync-from-installer.ts --tag v6.5.0    # pin
 *   bun scripts/sync-from-installer.ts --loop-tag v0.8.0  # pin bmad-loop
 *   bun scripts/sync-from-installer.ts --dry-run       # preview only
 *   bun scripts/sync-from-installer.ts --keep-install  # don't wipe .upstream-install/
 */

import { exists, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  updateJsonVersionFiles,
  updateReadmeBadge,
  VERSION_FILES,
} from './lib/bump-utils.ts';
import { PLUGIN, ROOT } from './lib/config.ts';
import { readVersion, writeVersionInfo } from './lib/upstream-sources.ts';

// ────────────────────────────────────────────────────────────────────────
// Args + paths
// ────────────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const KEEP_INSTALL = process.argv.includes('--keep-install');
const TAG_OVERRIDE = (() => {
  const idx = process.argv.indexOf('--tag');
  return idx >= 0 ? process.argv[idx + 1] : undefined;
})();
const LOOP_TAG_OVERRIDE = (() => {
  const idx = process.argv.indexOf('--loop-tag');
  return idx >= 0 ? process.argv[idx + 1] : undefined;
})();

const INSTALL_DIR = join(ROOT, '.upstream-install');
const INSTALL_SKILLS_DIR = join(INSTALL_DIR, '.claude/skills');

const INSTALL_RUNTIME_DIR = join(INSTALL_DIR, '_bmad');

const LOOP_REPO_URL = 'https://github.com/bmad-code-org/bmad-loop.git';
const LOOP_CLONE_DIR = join(ROOT, '.upstream-loop');
const LOOP_SKILLS_SUBDIR = 'src/bmad_loop/data/skills';

const PLUGIN_SKILLS_DIR = join(PLUGIN, 'skills');
const PLUGIN_SHARED_DIR = join(PLUGIN, '_shared');
const PLUGIN_AGENTS_DIR = join(PLUGIN, 'agents');
const PLUGIN_TEMPLATES_DIR = join(PLUGIN, 'templates');
const PLUGIN_RUNTIME_DIR = join(PLUGIN, 'runtime');

/**
 * Placeholder written into the captured runtime template wherever the
 * installer baked in the throwaway install-dir name. `scripts/init.sh`
 * (shipped inside the plugin) replaces it with the real project name
 * when a working repo is initialized.
 */
const PROJECT_NAME_PLACEHOLDER = '__BMAD_PROJECT_NAME__';

const MODULES = ['bmm', 'bmb', 'cis', 'gds', 'tea'] as const;

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

async function resolveTargetVersion(): Promise<string> {
  if (TAG_OVERRIDE) return TAG_OVERRIDE;
  // Read from .upstream-versions/core.json
  const corePath = join(ROOT, '.upstream-versions/core.json');
  const data: { version: string } = await Bun.file(corePath).json();
  return data.version;
}

async function runInstaller(version: string): Promise<void> {
  // Strip leading 'v' for npm versioning
  const npmVersion = version.replace(/^v/, '');
  console.log(`Running: npx bmad-method@${npmVersion} install ...`);

  if (DRY_RUN) {
    console.log(
      `  [dry-run] would run: npx -y bmad-method@${npmVersion} install --yes --directory ${INSTALL_DIR} --modules ${MODULES.join(',')} --tools claude-code`,
    );
    return;
  }

  // Wipe old install first (unless --keep-install)
  if (!KEEP_INSTALL && (await exists(INSTALL_DIR))) {
    await rm(INSTALL_DIR, { recursive: true, force: true });
  }
  await Bun.$`mkdir -p ${INSTALL_DIR}`.quiet();

  const proc = Bun.spawn(
    [
      'npx',
      '-y',
      `bmad-method@${npmVersion}`,
      'install',
      '--yes',
      '--directory',
      INSTALL_DIR,
      '--modules',
      MODULES.join(','),
      '--tools',
      'claude-code',
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  );

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    console.error(`Installer failed (exit ${exitCode}):`);
    console.error(stderr);
    process.exit(1);
  }

  if (!(await exists(INSTALL_SKILLS_DIR))) {
    console.error(
      `Installer ran but ${INSTALL_SKILLS_DIR} not found. Aborting.`,
    );
    process.exit(1);
  }

  console.log(`✓ Installer completed → ${INSTALL_SKILLS_DIR}`);
}

async function wipePluginTree(): Promise<void> {
  console.log('Wiping plugin tree...');
  for (const dir of [
    PLUGIN_SKILLS_DIR,
    PLUGIN_SHARED_DIR,
    PLUGIN_AGENTS_DIR,
    PLUGIN_TEMPLATES_DIR,
    PLUGIN_RUNTIME_DIR,
  ]) {
    if (await exists(dir)) {
      if (DRY_RUN) {
        console.log(`  [dry-run] rm -rf ${dir}`);
      } else {
        await rm(dir, { recursive: true, force: true });
        console.log(`  ✓ ${dir}`);
      }
    }
  }
}

async function countFiles(dir: string): Promise<number> {
  const proc = Bun.spawn(['find', dir, '-type', 'f'], { stdout: 'pipe' });
  const stdout = await new Response(proc.stdout).text();
  return stdout.trim().split('\n').filter(Boolean).length;
}

async function copyInstallerSkills(): Promise<number> {
  console.log(`Copying ${INSTALL_SKILLS_DIR} → ${PLUGIN_SKILLS_DIR}`);

  if (DRY_RUN) {
    const count = await countFiles(INSTALL_SKILLS_DIR);
    console.log(`  [dry-run] would copy ${count} files`);
    return count;
  }

  // Use cp -r for raw 1:1 copy. The installer has already done all
  // path rewriting and merging — we just mirror its output.
  await Bun.$`mkdir -p ${PLUGIN_SKILLS_DIR}`.quiet();
  await Bun.$`cp -R ${INSTALL_SKILLS_DIR}/. ${PLUGIN_SKILLS_DIR}/`.quiet();

  const count = await countFiles(PLUGIN_SKILLS_DIR);
  console.log(`  ✓ ${count} files copied`);
  return count;
}

/**
 * Sync the bmad-loop skill module (bmad-loop-{resolve,sweep,setup}).
 *
 * bmad-loop is not an npx-installer module — it is a Python
 * orchestrator tool (successor to bmad-automator, upstream v6.10)
 * whose Claude Code skills ship inside its own repo under
 * `src/bmad_loop/data/skills/` (BMAD module code `bmad-loop`). Clone
 * the repo at the pinned tag and copy the skill directories 1:1. The
 * orchestrator tool itself is installed per-project by the
 * `/bmad:bmad-loop-setup` skill (via `uv tool install`).
 */
async function syncLoopSkills(): Promise<number> {
  const tag = LOOP_TAG_OVERRIDE ?? (await readVersion('loop'));
  console.log(`Syncing bmad-loop skill module (${tag})...`);

  if (DRY_RUN) {
    console.log(
      `  [dry-run] would clone ${LOOP_REPO_URL}@${tag} and copy ${LOOP_SKILLS_SUBDIR}/*`,
    );
    return 0;
  }

  await rm(LOOP_CLONE_DIR, { recursive: true, force: true });
  const proc = Bun.spawn(
    [
      'git',
      'clone',
      '--depth',
      '1',
      '--branch',
      tag,
      LOOP_REPO_URL,
      LOOP_CLONE_DIR,
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    console.error(`bmad-loop clone failed (exit ${exitCode}):`);
    console.error(stderr);
    process.exit(1);
  }

  const skillsSrc = join(LOOP_CLONE_DIR, LOOP_SKILLS_SUBDIR);
  if (!(await exists(skillsSrc))) {
    console.error(`bmad-loop clone has no ${LOOP_SKILLS_SUBDIR}. Aborting.`);
    process.exit(1);
  }

  let copied = 0;
  const entries = await readdir(skillsSrc, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue; // skip the tree-level README.md
    await Bun.$`cp -R ${join(skillsSrc, entry.name)} ${PLUGIN_SKILLS_DIR}/`.quiet();
    copied++;
    console.log(`  ✓ ${entry.name}`);
  }

  await writeVersionInfo('loop', tag);
  console.log(`Updated .upstream-versions/loop.json → ${tag}`);
  await rm(LOOP_CLONE_DIR, { recursive: true, force: true });
  return copied;
}

/**
 * Remove upstream deprecated compatibility shims from the plugin tree.
 *
 * Upstream ships thin forwarder skills (e.g. `bmad-create-prd` →
 * `bmad-prd`) whose frontmatter description starts with "DEPRECATED".
 * This plugin intentionally does NOT keep backwards compatibility —
 * only the current skill surface is published.
 */
async function pruneDeprecatedSkills(): Promise<string[]> {
  console.log('Pruning deprecated compatibility shims...');
  const pruned: string[] = [];

  if (DRY_RUN) {
    console.log('  [dry-run] would prune skills with DEPRECATED descriptions');
    return pruned;
  }

  const entries = await readdir(PLUGIN_SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMd = join(PLUGIN_SKILLS_DIR, entry.name, 'SKILL.md');
    if (!(await exists(skillMd))) continue;

    const text = await Bun.file(skillMd).text();
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm?.[1]) continue;
    const meta = parseYaml(fm[1]) as { description?: string };
    if (meta.description?.trimStart().startsWith('DEPRECATED')) {
      await rm(join(PLUGIN_SKILLS_DIR, entry.name), {
        recursive: true,
        force: true,
      });
      pruned.push(entry.name);
      console.log(`  ✓ removed ${entry.name} (deprecated upstream shim)`);
    }
  }

  if (pruned.length === 0) console.log('  (none found)');
  return pruned;
}

/**
 * Capture the installer's `_bmad/` runtime tree as a template inside
 * the plugin (`plugins/bmad/runtime/_bmad/`).
 *
 * Skills resolve config and shared scripts from
 * `{project-root}/_bmad/...` at run time — files the immutable plugin
 * cannot provide in the user's working repo. `scripts/init.sh` copies
 * this template into a working repo (see /bmad:init).
 */
async function captureRuntimeTemplate(pruned: string[]): Promise<void> {
  console.log(`Capturing runtime template → ${PLUGIN_RUNTIME_DIR}/_bmad`);

  if (DRY_RUN) {
    console.log('  [dry-run] would copy _bmad/ runtime tree into plugin');
    return;
  }

  if (!(await exists(INSTALL_RUNTIME_DIR))) {
    console.error(`Installer output ${INSTALL_RUNTIME_DIR} not found.`);
    process.exit(1);
  }

  const dest = join(PLUGIN_RUNTIME_DIR, '_bmad');
  await Bun.$`mkdir -p ${dest}`.quiet();
  await Bun.$`cp -R ${INSTALL_RUNTIME_DIR}/. ${dest}/`.quiet();

  // The installer bakes the throwaway install-dir name into config
  // files as the project name; templatize it for init.sh.
  const installDirName = INSTALL_DIR.split('/').at(-1) ?? '.upstream-install';
  const proc = Bun.spawn(['find', dest, '-type', 'f'], { stdout: 'pipe' });
  const files = (await new Response(proc.stdout).text())
    .trim()
    .split('\n')
    .filter(Boolean);
  let templatized = 0;
  for (const file of files) {
    const text = await Bun.file(file).text();
    if (!text.includes(installDirName)) continue;
    await Bun.write(
      file,
      text.replaceAll(installDirName, PROJECT_NAME_PLACEHOLDER),
    );
    templatized++;
  }
  console.log(
    `  ✓ ${files.length} runtime files captured (${templatized} templatized)`,
  );

  // Nested .gitignore files (e.g. custom/.gitignore ignoring
  // *.user.toml) would exclude sibling template files from THIS repo's
  // git tree — and marketplace installs are git clones, so those files
  // would vanish from the shipped plugin. Store them as dot.gitignore;
  // init.sh restores the real name on materialization.
  for (const file of files) {
    if (file.split('/').at(-1) === '.gitignore') {
      const renamed = `${file.slice(0, -'.gitignore'.length)}dot.gitignore`;
      await Bun.$`mv ${file} ${renamed}`.quiet();
      console.log(`  ✓ ${file.slice(dest.length + 1)} stored as dot.gitignore`);
    }
  }

  // Drop pruned deprecated shims from the installer manifests so the
  // template carries no references to skills the plugin doesn't ship.
  if (pruned.length > 0) {
    const manifests = [
      join(dest, '_config/skill-manifest.csv'),
      join(dest, '_config/files-manifest.csv'),
      join(dest, '_config/bmad-help.csv'),
    ];
    for (const manifest of manifests) {
      if (!(await exists(manifest))) continue;
      const lines = (await Bun.file(manifest).text()).split('\n');
      const kept = lines.filter(
        (line) =>
          !pruned.some(
            (name) => line.includes(`"${name}"`) || line.includes(`/${name}/`),
          ),
      );
      if (kept.length !== lines.length) {
        await Bun.write(manifest, kept.join('\n'));
        console.log(
          `  ✓ ${manifest.split('/').at(-1)}: ${lines.length - kept.length} deprecated rows removed`,
        );
      }
    }
  }
}

async function bumpVersionAnchors(version: string): Promise<void> {
  // Plugin version: <core-version>.0
  const coreVersion = version.replace(/^v/, '');
  const newPluginVersion = `${coreVersion}.0`;
  const newPluginVersionPrefixed = `v${newPluginVersion}`;

  if (DRY_RUN) {
    console.log(
      `  [dry-run] would set plugin version to ${newPluginVersionPrefixed}`,
    );
    return;
  }

  // Read current plugin version (find-and-replace needs it)
  const currentRaw = (
    await Bun.file(VERSION_FILES.pluginVersion).text()
  ).trim();
  const currentVersion = currentRaw.replace(/^v/, '');

  // .plugin-version
  await Bun.write(VERSION_FILES.pluginVersion, `${newPluginVersionPrefixed}\n`);
  console.log(`Updated .plugin-version → ${newPluginVersionPrefixed}`);

  // package.json + plugin.json + marketplace.json (via shared helper)
  await updateJsonVersionFiles(currentVersion, newPluginVersion);

  // .upstream-versions/core.json
  await writeVersionInfo('core', `v${coreVersion}`);
  console.log(`Updated .upstream-versions/core.json → v${coreVersion}`);

  // README badge is regenerated AFTER bumpModuleVersions() writes the
  // remaining .upstream-versions/<mod>.json files; otherwise the badge
  // and version table reflect stale module versions.
}

async function bumpModuleVersions(): Promise<void> {
  if (DRY_RUN) {
    console.log('  [dry-run] would bump module versions from installer output');
    return;
  }

  // The installer writes canonical module versions to
  // `_bmad/_config/manifest.yaml` — that's the single source of truth for
  // what was actually pinned. Per-module `_bmad/<mod>/config.yaml` files
  // hold runtime config, not version metadata.
  const manifestPath = join(INSTALL_DIR, '_bmad/_config/manifest.yaml');
  if (!(await exists(manifestPath))) {
    console.warn(
      `  ⚠ ${manifestPath} not found; skipping module version bumps`,
    );
    return;
  }

  const manifest = parseYaml(await Bun.file(manifestPath).text()) as {
    modules?: Array<{ name: string; version: string }>;
  };
  const entries = manifest.modules ?? [];

  for (const mod of MODULES) {
    if (mod === 'bmm') continue; // 'bmm' is core, handled separately
    const entry = entries.find((m) => m.name === mod);
    if (!entry?.version) {
      console.warn(
        `  ⚠ no manifest entry for module '${mod}', leaving version untouched`,
      );
      continue;
    }
    const tag = entry.version.startsWith('v')
      ? entry.version
      : `v${entry.version}`;
    await writeVersionInfo(mod, tag);
    console.log(`Updated .upstream-versions/${mod}.json → ${tag}`);
  }
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

const version = await resolveTargetVersion();
console.log(`Target core version: ${version}`);
console.log(`Modules:             ${MODULES.join(', ')}`);
console.log(DRY_RUN ? '\nDry run — no changes will be made\n' : '');

await runInstaller(version);
await wipePluginTree();
let fileCount = await copyInstallerSkills();
const loopSkillCount = await syncLoopSkills();
const prunedSkills = await pruneDeprecatedSkills();
if (!DRY_RUN && (prunedSkills.length > 0 || loopSkillCount > 0)) {
  fileCount = await countFiles(PLUGIN_SKILLS_DIR);
}
await captureRuntimeTemplate(prunedSkills);
await bumpVersionAnchors(version);
await bumpModuleVersions();
// Regenerate README + badge files after both core and module versions
// have been written (the badge generator reads .upstream-versions/*.json).
if (!DRY_RUN) await updateReadmeBadge();

console.log('');
console.log(`✓ Sync complete: ${fileCount} files in plugins/bmad/skills/`);
