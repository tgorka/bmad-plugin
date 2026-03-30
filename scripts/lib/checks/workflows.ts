/**
 * Three-set skill coverage check across all upstream sources:
 * - Upstream workflow names (from all enabled sources)
 * - Plugin skill directories
 * - Plugin.json manifest commands
 */

import { exists, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PLUGIN, PLUGIN_JSON_PATH, ROOT } from '../config.ts';
import { fail, pass, section, warn } from '../output.ts';
import { getCoreSource, getEnabledSources } from '../upstream-sources.ts';
import { getWorkflowEntries } from '../workflow-iterator.ts';

export interface SkillSets {
  upstream: Set<string>;
  directories: Set<string>;
  manifest: Set<string>;
}

/** Collect upstream workflow names from all enabled sources + core skills. */
async function getUpstreamWorkflows(): Promise<Set<string>> {
  const names = new Set<string>();

  for (const source of getEnabledSources()) {
    const upstreamRoot = join(ROOT, '.upstream', source.localPath);
    const entries = await getWorkflowEntries(source, upstreamRoot);
    for (const entry of entries) {
      names.add(entry.skillName);
    }
  }

  // Core skills synced via syncCoreExtras (src/core-skills/ since v6.2.2)
  const coreSource = getCoreSource();
  const coreRoot = join(ROOT, '.upstream', coreSource.localPath);
  const coreSkillsDir = join(coreRoot, 'src/core-skills');
  if (await exists(coreSkillsDir)) {
    const entries = await readdir(coreSkillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) names.add(entry.name);
    }
  }

  return names;
}

/** Collect all plugin-only skills across all sources. */
function getAllPluginOnlySkills(): Set<string> {
  const all = new Set<string>();
  for (const source of getEnabledSources()) {
    for (const skill of source.pluginOnlySkills ?? []) {
      all.add(skill);
    }
  }
  return all;
}

/** Collect plugin skill directory names. */
async function getPluginDirectories(): Promise<Set<string>> {
  const entries = await readdir(join(PLUGIN, 'skills'), {
    withFileTypes: true,
  });
  return new Set(
    entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
      .map((e) => e.name),
  );
}

/** Collect plugin.json manifest command names.
 * Supports both explicit "commands" array and "skills" auto-discovery. */
async function getManifestCommands(): Promise<Set<string>> {
  const pluginJson = await Bun.file(PLUGIN_JSON_PATH).json();

  // Explicit commands array (legacy format)
  if (Array.isArray(pluginJson.commands)) {
    return new Set(
      (pluginJson.commands as string[]).map((c: string) =>
        c.replace('./skills/', '').replace(/\/$/, ''),
      ),
    );
  }

  // Auto-discovery via "skills" path — all skill dirs are commands
  if (pluginJson.skills) {
    return getPluginDirectories();
  }

  return new Set<string>();
}

/** Sort a set's values alphabetically. */
function sorted(set: Set<string>): string[] {
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Check upstream workflows have corresponding plugin directories.
 * Names in `upstream` are already mapped via per-source agent ref mappings. */
function checkUpstreamToDirs(
  upstream: Set<string>,
  directories: Set<string>,
): void {
  section('Skills: Upstream → Plugin Directories');
  for (const name of sorted(upstream)) {
    if (directories.has(name)) {
      pass(name);
    } else {
      fail(`Missing directory: skills/${name}`);
    }
  }
}

/** Check upstream workflows are listed in plugin.json manifest.
 * Names in `upstream` are already mapped. */
function checkUpstreamToManifest(
  upstream: Set<string>,
  manifest: Set<string>,
): void {
  section('Skills: Upstream → Manifest');
  for (const name of sorted(upstream)) {
    if (manifest.has(name)) {
      pass(`${name} in plugin.json`);
    } else {
      fail(`Missing in plugin.json: ${name}`);
    }
  }
}

/** Bidirectional check between directories and manifest. */
function checkDirsManifestAlignment(
  directories: Set<string>,
  manifest: Set<string>,
): void {
  section('Skills: Directories ↔ Manifest');
  for (const dir of sorted(directories)) {
    if (!manifest.has(dir)) {
      fail(`Directory "${dir}" not in plugin.json commands`);
    }
  }
  for (const cmd of sorted(manifest)) {
    if (!directories.has(cmd)) {
      fail(`plugin.json command "${cmd}" has no directory`);
    }
  }
  pass('Directories ↔ Manifest aligned');
}

/** Check for plugin-only skills not present upstream.
 * Names in `upstream` are already mapped — direct comparison. */
function checkPluginOnlySkills(
  upstream: Set<string>,
  directories: Set<string>,
  pluginOnly: Set<string>,
): void {
  section('Plugin-Only Skills');
  for (const dir of sorted(directories)) {
    if (upstream.has(dir)) continue;

    if (pluginOnly.has(dir)) {
      pass(`${dir} (plugin-only, expected)`);
    } else {
      warn(`${dir} (plugin-only, investigate — not in upstream)`);
    }
  }
}

export async function checkWorkflows(): Promise<SkillSets> {
  const upstream = await getUpstreamWorkflows();
  const directories = await getPluginDirectories();
  const manifest = await getManifestCommands();
  const pluginOnly = getAllPluginOnlySkills();

  checkUpstreamToDirs(upstream, directories);
  checkUpstreamToManifest(upstream, manifest);
  checkDirsManifestAlignment(directories, manifest);
  checkPluginOnlySkills(upstream, directories, pluginOnly);

  return { upstream, directories, manifest };
}
