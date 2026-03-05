# Research: bmad_data Directory Design for Persistent Agent Knowledge

Issue: bmp-a1d
Date: 20260305

## Summary

The upstream BMAD ecosystem uses two distinct persistent storage patterns that
have no direct equivalent in Claude Code's `memory: project` system. This report
analyses each pattern, assesses overlap with `memory: project`, and recommends
a hybrid directory layout.

## Findings

### Q1: Does `memory: project` fully replace a custom `bmad_data` directory?

No. The Claude Code `memory: project` mechanism covers per-agent knowledge that
builds over sessions (the agent learns, not the project). It does not cover:

- **Shared project artifacts** — PRDs, architecture docs, epics, stories are
  produced by BMAD agents and consumed by other agents in the same project.
  These are cross-agent and belong in a project-level directory, not inside
  `.claude/agent-memory/<name>/`.
- **Sidecar agent memory** — the upstream `_bmad/_memory/<agent>-sidecar/`
  pattern is per-agent persistent memory. This is equivalent to `memory:
  project`, but it predates the Claude Code mechanism and uses a different path
  convention. The sidecar files are stored in the user's project repo under
  `_bmad/`, not under `.claude/`.

`memory: project` is sufficient for the sidecar use case if the plugin remaps
the path convention. It is not sufficient for cross-agent shared artifacts.

### Q2: What does the upstream BMAD `_bmad/` tree store?

Inspected sources: `BMAD-METHOD`, `bmad-module-creative-intelligence-suite`,
`bmad-builder`.

The upstream installs into `{project-root}/_bmad/` and uses two subdirectories:

```text
_bmad/
  _config/          # task-manifest.csv, workflow-manifest.csv (generated at install time)
  <module>/         # installed module files (e.g., bmm/, core/) — read-only runtime files
    config.yaml     # per-project user config (user_name, language, output paths)
  _memory/          # runtime writable: agent sidecar memory (private to each agent)
    <agent>-sidecar/
      memories.md
      instructions.md
      ...
```

No `bmad_data` directory name appears anywhere in upstream. The closest patterns
are `_bmad/_memory/` (sidecar agent memory) and the configurable
`output_folder` / `planning_artifacts` / `implementation_artifacts` paths
(user-generated artifacts).

Key data categories found:

| Category | Upstream path | Writeable at runtime? | Shared across agents? |
|---|---|---|---|
| User config | `_bmad/<module>/config.yaml` | No (set at install) | Yes |
| Sidecar agent memory | `_bmad/_memory/<agent>-sidecar/` | Yes | No |
| Planning artifacts (PRDs, briefs, architecture) | configurable, default `_bmad-output/planning-artifacts/` | Yes | Yes |
| Implementation artifacts (stories, sprint status) | configurable, default `_bmad-output/implementation-artifacts/` | Yes | Yes |
| Long-term project knowledge | configurable, default `docs/` | Yes | Yes |
| Project context file | `project-context.md` (anywhere, found by glob) | Yes | Yes |

### Q3: Is there data that should be shared across agents?

Yes — substantially. All BMAD workflows read each other's outputs:

- `dev-story` reads `sprint-status.yaml` from `implementation_artifacts`, which
  `sprint-planning` wrote.
- `create-architecture` reads from `planning_artifacts` (the PRD).
- `check-implementation-readiness` reads PRD, UX design, architecture, and
  epics — all from `planning_artifacts`.
- `project-context.md` is consumed by nearly every agent via a glob
  (`**/project-context.md`).

`memory: project` is strictly per-agent and is not visible to other agents.
It cannot serve the shared-artifact role.

### Q4: Where should user-generated artifacts go in the plugin?

Upstream defaults to `_bmad-output/` at the project root (configurable via
`bmad.local.md`). In the plugin's architecture:

- The **default** output directory should be `_bmad-output/` to match upstream
  defaults and user expectations. It should be gitignored by default (it is
  generated work product, not source).
- The user can override it in `.claude/bmad.local.md`, exactly as the plugin
  already documents in `docs/plugin-data-storage.md`.
- `project_knowledge` defaults to `docs/` in upstream, which aligns with the
  standard project convention and should stay git-tracked.

The plugin's Activation section in every agent already reads `.claude/bmad.local.md`
and falls back to `_bmad-output/`. This is consistent and correct.

## Sidecar Pattern vs. `memory: project`

The upstream sidecar pattern stores per-agent memory under
`{project-root}/_bmad/_memory/<agent>-sidecar/`. The Claude Code `memory:
project` stores per-agent memory at `.claude/agent-memory/<agent-name>/`.

These are functionally equivalent: both are per-agent, both persist across
sessions, and both are not auto-shared with other agents. The differences:

| Attribute | Upstream sidecar | Claude Code `memory: project` |
|---|---|---|
| Path | `_bmad/_memory/<agent>-sidecar/` | `.claude/agent-memory/<name>/` |
| Auto-load | Requires explicit `critical_actions` in agent | `MEMORY.md` auto-loaded (200 lines) |
| Additional files | Agent loads them explicitly | Agent loads them explicitly |
| Git-tracked | Yes (lives in project tree) | No (gitignored by Claude Code) |
| Configured by | Agent YAML | Agent frontmatter (`memory: project`) |

The `memory: project` mechanism is strictly superior for the plugin:
- Auto-loading MEMORY.md removes boilerplate `critical_actions`
- Isolation from the project tree (gitignored) is appropriate for private agent state
- No need for install-time directory creation

Agents with `hasSidecar: true` (storyteller, tech-writer) should use
`memory: project` in the plugin instead of `_bmad/_memory/`. The storyteller
agent in `plugins/bmad/agents/storyteller.md` still references
`{project-root}/_bmad/_memory/storyteller-sidecar/` — this is a gap that
should be resolved.

## Recommendation: Hybrid Approach

Use `memory: project` for per-agent memory. Use a conventional project directory
for shared artifacts. No custom `bmad_data` directory is needed.

### Directory Layout

```text
{project-root}/
  .claude/
    bmad.local.md             # user config (gitignored by Claude Code)
    agent-memory/             # gitignored by Claude Code
      tech-writer/
        MEMORY.md             # auto-loaded: documentation standards, user prefs
      storyteller/
        MEMORY.md             # auto-loaded: story prefs, history summary
        stories-told.md       # on-demand: full history
  _bmad-output/               # gitignored (add to .gitignore)
    planning-artifacts/       # PRDs, briefs, architecture docs, UX designs
    implementation-artifacts/ # sprints, stories, reviews
  docs/                       # git-tracked (project_knowledge default)
    project-context.md        # shared LLM implementation rules
```

### Decision Points

1. `_bmad-output/` should be added to the project's `.gitignore` template (or
   documented as user-managed). It is generated work product.
2. Sidecar agents (tech-writer, storyteller) must be updated to use `memory:
   project` instead of `_bmad/_memory/` path references. The `storyteller.md`
   agent file currently has incorrect path references.
3. The `bmad.local.md` defaults in all agent Activation sections
   (`output to '_bmad-output/'`) are correct and consistent with upstream.
4. No new top-level directory (like `bmad_data/`) is needed. The existing
   `_bmad-output/` convention and `.claude/agent-memory/` cover all cases.

## Action Items for Implementation

- Update `storyteller.md` to remove `{project-root}/_bmad/_memory/` references
  and add `memory: project` to frontmatter (separate issue from design)
- Update `tech-writer.md` to add `memory: project` frontmatter and load
  documentation standards via MEMORY.md rather than hardcoded path
- Add `_bmad-output/` to any `.gitignore` template or setup documentation
- Document the three-directory layout (`_bmad-output/`, `docs/`,
  `.claude/agent-memory/`) in `docs/plugin-data-storage.md` as the canonical
  answer to "where does BMAD output go?"
