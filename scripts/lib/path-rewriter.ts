/**
 * Rewrites upstream {project-root}/_bmad/ paths in synced content files
 * to plugin-relative ${CLAUDE_PLUGIN_ROOT}/ paths.
 *
 * Used by sync-upstream-content.ts during file copy to transform paths
 * so plugin skill files reference correct locations at runtime.
 */

import { exists, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './config.ts';
import type { UpstreamSource } from './upstream-sources.ts';
import { getEnabledSources } from './upstream-sources.ts';
import { getWorkflowEntries } from './workflow-iterator.ts';

/**
 * Module alias config: how each _bmad/<alias>/ maps to upstream structure.
 *
 * - categorized: workflow dirs are nested under category dirs (bmm, gds)
 * - flat: workflow dirs are directly under the workflows root (tea, bmb, cis)
 * - pathPrefix: path segments between the module root and workflow dirs
 */
interface ModuleConfig {
  sourceId: string;
  pathPrefix: string;
  categorized: boolean;
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  bmm: { sourceId: 'core', pathPrefix: 'workflows', categorized: true },
  core: { sourceId: 'core', pathPrefix: '', categorized: false },
  tea: {
    sourceId: 'tea',
    pathPrefix: 'workflows/testarch',
    categorized: false,
  },
  bmb: { sourceId: 'bmb', pathPrefix: 'workflows', categorized: false },
  cis: { sourceId: 'cis', pathPrefix: 'workflows', categorized: false },
  gds: { sourceId: 'gds', pathPrefix: 'workflows', categorized: true },
};

/** Map of (moduleAlias, upstreamWorkflowName) → pluginSkillName */
export type WorkflowMap = Map<string, Map<string, string>>;

/**
 * Scans all upstream sources and builds a mapping table from
 * (moduleAlias, workflowName) → pluginSkillName.
 *
 * Must cover ALL sources regardless of --source filter, because
 * cross-module references are common (e.g., GDS skill → core workflow).
 */
export async function buildWorkflowMap(): Promise<WorkflowMap> {
  const map: WorkflowMap = new Map();
  const sources = getEnabledSources();

  // Build from upstream source configs
  for (const source of sources) {
    await addSourceWorkflows(map, source);
  }

  // Add core special entries (tasks are handled separately by the rewriter)
  await addCoreSpecialWorkflows(map);

  return map;
}

/** Add workflow mappings for a single upstream source. */
async function addSourceWorkflows(
  map: WorkflowMap,
  source: UpstreamSource,
): Promise<void> {
  const upstreamRoot = join(ROOT, '.upstream', source.localPath);
  const alias = getModuleAlias(source);
  if (!map.has(alias)) map.set(alias, new Map());
  const moduleMap = map.get(alias)!;

  const entries = await getWorkflowEntries(source, upstreamRoot);
  for (const entry of entries) {
    moduleMap.set(entry.dirName, entry.skillName);
  }
}

/** Get the module alias used in _bmad/ paths for a source. */
function getModuleAlias(source: UpstreamSource): string {
  // Core source uses 'bmm' alias (its contentRoot is bmm/workflows)
  if (source.id === 'core') return 'bmm';
  return source.id;
}

/**
 * Add core special workflows and register 'core' as a module alias.
 *
 * Core v6.2.0 moved src/core/workflows/ → src/core/skills/ with bmad- prefix.
 * Upstream files reference these via _bmad/core/workflows/<name>/... so we
 * register both the old names and new bmad- prefixed names.
 */
async function addCoreSpecialWorkflows(map: WorkflowMap): Promise<void> {
  if (!map.has('core')) map.set('core', new Map());
  const coreMap = map.get('core')!;

  // Try new path first (v6.2.0+), fall back to old path
  const newDir = join(ROOT, '.upstream/BMAD-METHOD/src/core/skills');
  const oldDir = join(ROOT, '.upstream/BMAD-METHOD/src/core/workflows');
  const coreDir = (await exists(newDir)) ? newDir : oldDir;
  if (!(await exists(coreDir))) return;

  const entries = await readdir(coreDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    // Map bmad-prefixed dir name to skill name (strip bmad- for the upstream ref)
    coreMap.set(name, name);
    // Also map un-prefixed name for backwards compat with upstream refs
    if (name.startsWith('bmad-')) {
      coreMap.set(name.slice('bmad-'.length), name);
    }
  }

  // Also copy bmm workflow entries into core map for cross-module refs
  // (e.g., GDS files reference _bmad/core/workflows/brainstorming/)
  const bmmMap = map.get('bmm');
  if (bmmMap) {
    for (const [dirName, skillName] of bmmMap) {
      if (!coreMap.has(dirName)) {
        coreMap.set(dirName, skillName);
      }
    }
  }
}

/** Text file extensions that should have path rewrites applied. */
const TEXT_EXTENSIONS = new Set([
  '.md',
  '.xml',
  '.yaml',
  '.yml',
  '.csv',
  '.txt',
  '.json',
]);

/** Check if a file should have path rewrites applied. */
export function isTextFile(filePath: string): boolean {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  return TEXT_EXTENSIONS.has(ext);
}

export interface RewriteResult {
  content: string;
  changeCount: number;
  warnings: string[];
}

/**
 * Rewrites all {project-root}/_bmad/ paths in the given content.
 *
 * Returns the rewritten content, change count, and any warnings
 * for paths that couldn't be resolved.
 */
export function rewriteFileContent(
  content: string,
  map: WorkflowMap,
): RewriteResult {
  let changeCount = 0;
  const warnings: string[] = [];

  // Main regex: captures module alias and the rest of the path.
  // Alias allows underscore-prefixed segments like _config and _memory.
  // Terminates at whitespace, quotes, angle brackets, curly braces, backticks, or parens
  const pattern =
    /\{project-root\}\/_bmad\/(_?[a-z][a-z-]*)\/((?:[^\s'"<>{}()`])+)/g;

  const rewritten = content.replace(pattern, (fullMatch, alias, rest) => {
    const result = rewriteSinglePath(alias as string, rest as string, map);
    if (result.warning) {
      warnings.push(result.warning);
    }
    if (result.changed) {
      changeCount++;
      return result.replacement;
    }
    return fullMatch;
  });

  return { content: rewritten, changeCount, warnings };
}

interface SingleRewriteResult {
  replacement: string;
  changed: boolean;
  warning?: string;
}

/** Dispatch a single path to the appropriate category handler. */
function rewriteSinglePath(
  alias: string,
  rest: string,
  map: WorkflowMap,
): SingleRewriteResult {
  // Skip deferred categories
  if (alias === '_memory' || rest.startsWith('_memory/')) {
    return { replacement: '', changed: false };
  }
  if (alias === '_config' || rest.startsWith('_config/')) {
    return rewriteConfigDirPath(alias, rest);
  }

  // Task paths: <alias>/tasks/<file>
  if (rest.startsWith('tasks/')) {
    return rewriteTaskPath(alias, rest);
  }

  // Config paths: config.yaml
  if (rest === 'config.yaml' || rest.endsWith('/config.yaml')) {
    return rewriteConfigPath();
  }

  // Knowledge/index paths
  if (rest.endsWith('.csv') && !rest.startsWith('workflows/')) {
    return rewriteIndexPath(alias, rest);
  }

  // Workflow paths: <alias>/workflows/...
  if (rest.startsWith('workflows/')) {
    return rewriteWorkflowPath(alias, rest.slice('workflows/'.length), map);
  }

  // Core special: core/tasks/ or core/workflows/
  // (alias is 'core' and rest doesn't start with workflows/)
  if (alias === 'core') {
    // core/workflows/<workflow>/... — check without 'workflows/' prefix in MODULE_CONFIGS
    return rewriteWorkflowPath('core', rest, map);
  }

  // Unrecognized pattern
  return {
    replacement: '',
    changed: false,
    warning: `Unrecognized path: _bmad/${alias}/${rest}`,
  };
}

/** Rewrite a workflow path to ${CLAUDE_PLUGIN_ROOT}/skills/<name>/... */
function rewriteWorkflowPath(
  alias: string,
  pathAfterWorkflows: string,
  map: WorkflowMap,
): SingleRewriteResult {
  const moduleMap = map.get(alias);
  if (!moduleMap) {
    return {
      replacement: '',
      changed: false,
      warning: `Unknown module alias: ${alias}`,
    };
  }

  const config = MODULE_CONFIGS[alias];
  const segments = pathAfterWorkflows.split('/');

  // For flat sources with extra prefix (tea has testarch/)
  let startIdx = 0;
  if (config?.pathPrefix.includes('/')) {
    // tea: pathPrefix is 'workflows/testarch', skip 'testarch' segment
    const prefixParts = config.pathPrefix.split('/');
    const extraPrefix = prefixParts.slice(1).join('/');
    if (pathAfterWorkflows.startsWith(`${extraPrefix}/`)) {
      startIdx = extraPrefix.split('/').length;
    }
  }

  // Try to find workflow name in segments
  let workflowName: string | undefined;
  let restStartIdx: number | undefined;

  // Try first available segment as workflow name
  const seg0 = segments[startIdx] as string | undefined;
  const seg1 = segments[startIdx + 1] as string | undefined;

  if (seg0 && moduleMap.has(seg0)) {
    workflowName = seg0;
    restStartIdx = startIdx + 1;
  }
  // Try second segment (category/workflow for categorized sources)
  else if (seg1 && moduleMap.has(seg1)) {
    workflowName = seg1;
    restStartIdx = startIdx + 2;
  }

  if (!workflowName || restStartIdx === undefined) {
    return {
      replacement: '',
      changed: false,
      warning: `Cannot resolve workflow in: _bmad/${alias}/workflows/${pathAfterWorkflows}`,
    };
  }

  const skillName = moduleMap.get(workflowName)!;
  let restPath = segments.slice(restStartIdx).join('/');

  // Special case: workflow.yaml or workflow.md → SKILL.md
  if (restPath === 'workflow.yaml' || restPath === 'workflow.md') {
    restPath = 'SKILL.md';
  }

  const pluginPath = restPath
    ? `\${CLAUDE_PLUGIN_ROOT}/skills/${skillName}/${restPath}`
    : `\${CLAUDE_PLUGIN_ROOT}/skills/${skillName}`;

  return { replacement: pluginPath, changed: true };
}

/** Rewrite a task path to ${CLAUDE_PLUGIN_ROOT}/_shared/tasks/<file> */
function rewriteTaskPath(_alias: string, rest: string): SingleRewriteResult {
  // rest is "tasks/<file>" — extract the file part
  const file = rest.slice('tasks/'.length);
  return {
    replacement: `\${CLAUDE_PLUGIN_ROOT}/_shared/tasks/${file}`,
    changed: true,
  };
}

/**
 * Rewrite paths under _bmad/_config/.
 *
 * Known mappings:
 *   _config/agent-manifest.csv → ${CLAUDE_PLUGIN_ROOT}/_shared/agent-manifest.csv
 *
 * Unknown _config paths are left unrewritten (pass-through with no warning,
 * since upstream may add new _config files that the plugin doesn't generate).
 */
function rewriteConfigDirPath(
  _alias: string,
  rest: string,
): SingleRewriteResult {
  // When alias=="_config": rest is just the filename (e.g. "agent-manifest.csv").
  // When alias is a module and rest starts with "_config/": strip the prefix.
  const file = rest.startsWith('_config/')
    ? rest.slice('_config/'.length)
    : rest;

  if (file === 'agent-manifest.csv') {
    return {
      replacement: `\${CLAUDE_PLUGIN_ROOT}/_shared/agent-manifest.csv`,
      changed: true,
    };
  }

  // Unknown _config file — leave unrewritten, no warning (expected: upstream adds files)
  return { replacement: '', changed: false };
}

/** Rewrite a config.yaml path to .claude/bmad.local.md */
function rewriteConfigPath(): SingleRewriteResult {
  return {
    replacement: '.claude/bmad.local.md',
    changed: true,
  };
}

/** Rewrite a knowledge/index path to ${CLAUDE_PLUGIN_ROOT}/_shared/<file> */
function rewriteIndexPath(_alias: string, rest: string): SingleRewriteResult {
  // Extract just the filename from paths like testarch/tea-index.csv
  const fileName = rest.split('/').pop()!;
  return {
    replacement: `\${CLAUDE_PLUGIN_ROOT}/_shared/${fileName}`,
    changed: true,
  };
}
