/**
 * Multi-upstream source configuration.
 *
 * Each UpstreamSource defines an external repo that contributes content
 * to the flat plugin output. The sync and validation scripts iterate
 * over enabled sources.
 *
 * Version tracking lives in `.upstream-versions/<id>.json` — see
 * readVersionInfo / writeVersionInfo helpers below.
 */

import { join } from 'node:path';
import { ROOT } from './config.ts';

export interface UpstreamSource {
  /** Unique identifier: "core", "tea", etc. */
  id: string;
  /** GitHub org/repo (for cloning and release checks) */
  repo: string;
  /** Path relative to .upstream/ */
  localPath: string;
  /** Whether this source is active */
  enabled: boolean;
  /** Path inside cloned repo to the workflows root */
  contentRoot: string;
  /** Path inside cloned repo to the agents directory */
  agentsRoot?: string;
  /**
   * Whether contentRoot contains workflow dirs directly (true)
   * or has a category layer in between (false).
   * Core = false (src/bmm/workflows/<category>/<workflow>/)
   * TEA  = true  (src/workflows/testarch/<workflow>/)
   */
  flatWorkflows: boolean;

  // Source-specific overrides (inherit from core defaults if not set)
  /** Workflow names owned by another source (skip from this source's coverage) */
  skipWorkflows?: Set<string>;
  skipDirs?: Set<string>;
  skipContentFiles?: Set<string>;
  /** Patterns for content files to skip (e.g. timestamped validation reports) */
  skipContentPatterns?: RegExp[];
  /** Workflows referenced by agents but not yet implemented upstream (warn, not fail) */
  plannedWorkflows?: Set<string>;
  /**
   * Maps stale agent YAML workflow refs to current plugin skill names.
   * Only needed when upstream agent YAML hasn't been updated to match
   * renamed workflow directories. Remove entries when upstream catches up.
   */
  agentRefMappings?: Record<string, string>;
  pluginOnlySkills?: Set<string>;
  pluginOnlyAgents?: Set<string>;
  sharedFileTargets?: Record<string, string[]>;
  pluginOnlyData?: Set<string>;
}

export const UPSTREAM_SOURCES: UpstreamSource[] = [
  {
    id: 'core',
    repo: 'bmadcode/BMAD-METHOD',
    localPath: 'BMAD-METHOD',
    enabled: true,
    // src/bmm-skills/ is the canonical workflow root; agents are embedded
    // in skill dirs (no separate agentsRoot).
    contentRoot: 'src/bmm-skills',
    agentsRoot: undefined,
    flatWorkflows: false,
    // automate is owned by TEA module, not core
    skipWorkflows: new Set(['automate']),
    skipDirs: new Set(['_shared', 'templates', 'workflows']),
    skipContentFiles: new Set([
      'workflow.md',
      'workflow.yaml',
      'bmad-skill-manifest.yaml',
      'bmad-manifest.json',
    ]),
    agentRefMappings: {},
    pluginOnlySkills: new Set([
      'help',
      'init',
      'status',
      'brainstorming',
      'bmad-create-product-brief',
      'bmad-product-brief-preview',
      'bmad-quick-dev-new-preview',
      'bmad-quick-spec',
    ]),
    // Core agents no longer live in a separate agentsRoot — they are embedded
    // in skill dirs upstream. All plugin agent .md files are maintained
    // manually under plugins/bmad/agents/.
    pluginOnlyAgents: new Set([
      'bmad-master',
      'tech-writer',
      'quinn',
      'analyst',
      'architect',
      'dev',
      'pm',
      'qa',
      'quick-flow-solo-dev',
      'sm',
      'ux-designer',
    ]),
    sharedFileTargets: {},
    pluginOnlyData: new Set(['quick-dev/data/project-levels.yaml']),
  },
  {
    id: 'tea',
    repo: 'bmad-code-org/bmad-method-test-architecture-enterprise',
    localPath: 'bmad-method-test-architecture-enterprise',
    enabled: true,
    contentRoot: 'src/workflows/testarch',
    agentsRoot: 'src/agents',
    flatWorkflows: true,
    skipDirs: new Set(['_shared', 'templates']),
    skipContentFiles: new Set([
      'workflow.md',
      'workflow.yaml',
      'bmad-skill-manifest.yaml',
      'bmad-manifest.json',
    ]),
    skipContentPatterns: [
      /^validation-report-.*\.md$/,
      /^workflow-plan.*\.md$/,
    ],
    agentRefMappings: {
      // TEA agent YAML referenced old un-prefixed names in v1.12.x and earlier.
      // v1.15.1: TEA agent moved to SKILL.md format (no YAML refs). Mappings
      // retained until Phase 5 validation confirms they're unused — drop entries
      // here when validate passes with them removed.
      // TODO(v6.5.0): remove once validation confirms upstream uses prefixed names.
      'teach-me-testing': 'bmad-teach-me-testing',
      framework: 'bmad-testarch-framework',
      atdd: 'bmad-testarch-atdd',
      automate: 'bmad-testarch-automate',
      'test-design': 'bmad-testarch-test-design',
      trace: 'bmad-testarch-trace',
      'nfr-assess': 'bmad-testarch-nfr',
      ci: 'bmad-testarch-ci',
      'test-review': 'bmad-testarch-test-review',
    },
    pluginOnlySkills: new Set(),
    pluginOnlyAgents: new Set(),
    sharedFileTargets: {},
    pluginOnlyData: new Set(),
  },
  {
    id: 'bmb',
    repo: 'bmad-code-org/bmad-builder',
    localPath: 'bmad-builder',
    enabled: true,
    // BMB v1.4.0: moved from src/skills/ to skills/ (top-level)
    contentRoot: 'skills',
    agentsRoot: undefined,
    flatWorkflows: true,
    skipDirs: new Set(['_shared', 'templates']),
    skipContentFiles: new Set([
      'workflow.md',
      'workflow.yaml',
      'bmad-skill-manifest.yaml',
      'bmad-manifest.json',
    ]),
    agentRefMappings: {},
    pluginOnlySkills: new Set(),
    pluginOnlyAgents: new Set([
      'agent-builder',
      'workflow-builder',
      'module-builder',
    ]),
    sharedFileTargets: {},
    pluginOnlyData: new Set(),
  },
  {
    id: 'cis',
    repo: 'bmad-code-org/bmad-module-creative-intelligence-suite',
    localPath: 'bmad-module-creative-intelligence-suite',
    enabled: true,
    // CIS v0.1.9: restructured from src/workflows/ + src/agents/ to unified src/skills/
    contentRoot: 'src/skills',
    agentsRoot: undefined,
    flatWorkflows: true,
    skipDirs: new Set(['_shared', 'templates']),
    skipContentFiles: new Set([
      'workflow.md',
      'workflow.yaml',
      'bmad-skill-manifest.yaml',
      'bmad-manifest.json',
    ]),
    agentRefMappings: {},
    pluginOnlySkills: new Set(),
    pluginOnlyAgents: new Set(),
    sharedFileTargets: {},
    pluginOnlyData: new Set(),
  },
  {
    id: 'gds',
    repo: 'bmad-code-org/bmad-module-game-dev-studio',
    localPath: 'bmad-module-game-dev-studio',
    enabled: true,
    contentRoot: 'src/workflows',
    agentsRoot: 'src/agents',
    flatWorkflows: false,
    skipDirs: new Set(['_shared', 'templates']),
    skipContentFiles: new Set([
      'workflow.md',
      'workflow.yaml',
      'bmad-skill-manifest.yaml',
      'bmad-manifest.json',
    ]),
    // GDS v0.4.0 dirs already use gds- prefix; agents are SKILL.md (no YAML refs).
    // No agent ref mappings needed.
    agentRefMappings: {},
    plannedWorkflows: new Set(['quick-prototype']),
    pluginOnlySkills: new Set(),
    pluginOnlyAgents: new Set([
      'tech-writer',
      // Plugin-maintained — no upstream counterpart in GDS v0.4.0
      'gds-agent-game-qa',
      'gds-agent-game-scrum-master',
    ]),
    sharedFileTargets: {},
    pluginOnlyData: new Set(),
  },
];

// --- Version file helpers ---

const VERSIONS_DIR = join(ROOT, '.upstream-versions');

export interface VersionInfo {
  version: string;
  syncedAt: string; // YYYY-MM-DD
}

/** Path to a source's version file: .upstream-versions/<id>.json */
export function versionFilePath(id: string): string {
  return join(VERSIONS_DIR, `${id}.json`);
}

/** Read version info for a source. */
export async function readVersionInfo(id: string): Promise<VersionInfo> {
  return Bun.file(versionFilePath(id)).json();
}

/** Read just the version string for a source. */
export async function readVersion(id: string): Promise<string> {
  const info = await readVersionInfo(id);
  return info.version;
}

/** Write version info for a source, updating syncedAt to today. */
export async function writeVersionInfo(
  id: string,
  version: string,
): Promise<void> {
  const syncedAt = new Date().toISOString().slice(0, 10);
  const info: VersionInfo = { version, syncedAt };
  await Bun.write(versionFilePath(id), `${JSON.stringify(info, null, 2)}\n`);
}

/** Check if a filename should be skipped for a given source. */
export function shouldSkipContentFile(
  source: UpstreamSource,
  fileName: string,
): boolean {
  if (source.skipContentFiles?.has(fileName)) return true;
  if (source.skipContentPatterns?.some((p) => p.test(fileName))) return true;
  return false;
}

/** Get all enabled upstream sources */
export function getEnabledSources(): UpstreamSource[] {
  return UPSTREAM_SOURCES.filter((s) => s.enabled);
}

/** Get a source by ID */
export function getSource(id: string): UpstreamSource | undefined {
  return UPSTREAM_SOURCES.find((s) => s.id === id);
}

/** Get the core source (always present) */
export function getCoreSource(): UpstreamSource {
  const core = getSource('core');
  if (!core) throw new Error('Core upstream source not found');
  return core;
}
