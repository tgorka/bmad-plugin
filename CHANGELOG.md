# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [6.5.0.0] - 2026-04-27

Regression-style upgrade: no backward compatibility with pre-v6.5 layouts.
The plugin tree was wiped and rebuilt purely from v6.5.0-era upstream
sources to guarantee zero leftover artifacts from earlier versions.

### Added

- New core skill `bmad-customize` (v6.5.0): authors per-skill `[agent]` /
  `[workflow]` TOML overrides for installed BMAD skills.
- `customize.toml` authoring pattern adopted across BMM and core skills.
- `module.yaml` and `module-help.csv` introduced at module roots (core, BMM).
- Path-rewriter passthrough for v6.5.0 user-side aliases:
  `_bmad/scripts/`, `_bmad/custom/`, `_bmad/planning/`.

### Changed

- Sync core BMAD-METHOD v6.3.0 → v6.5.0 (skipping v6.4.0 — direct upgrade).
- Sync upstream TEA v1.12.2 → v1.15.1 (TEA agent moved to SKILL.md format).
- Sync upstream BMB v1.4.0 → v1.7.0.
- Sync upstream CIS v0.1.9 → v0.2.0.
- Sync upstream GDS v0.3.0 → v0.4.0.
- `sync-upstream-content.ts` now delegates JSON version bumps to
  `bump-utils.updateJsonVersionFiles()` so `marketplace.json` is updated
  alongside `package.json` and `plugin.json`.
- TEA v1.15.1 ships its agent as a SKILL.md instead of a YAML file.
- `gds-agent-game-qa` and `gds-agent-game-scrum-master` registered as
  plugin-only agents (no upstream counterpart in GDS v0.4.0).

### Removed

- All v6.2/v6.3 backward-compat fallbacks in
  `scripts/clean-orphaned-skills.ts` (legacy `src/core/skills/` and
  `src/core/workflows/` candidate paths).
- Legacy fallback in `scripts/lib/path-rewriter.ts`
  `addCoreSpecialWorkflows()` (only `src/core-skills/` is checked).
- Stale `bmad-skill-manifest.yaml` and `workflow.md` files no longer
  shipped by upstream (already filtered by `skipContentFiles`, removed
  from disk via the wipe + rebuild).

### Fixed

- `marketplace.json` version drift: was stuck at v6.2.0.4 because the
  inline version-update block in `sync-upstream-content.ts` only touched
  `package.json` and `plugin.json`. Now bumps to v6.5.0.0 like the
  others.

> **Reconstructed entries (6.0.3.4 → 6.3.0.2)** — these releases were tagged
> on the upstream `PabloLION/bmad-plugin` fork during the Feb–Apr 2026 window
> while the CHANGELOG was unmaintained. Entries are reconstructed from git
> log + tag metadata.

## [6.3.0.2] - 2026-04-18

### Changed

- Sync core BMAD-METHOD v6.2.2 → v6.3.0
- Sync TEA v1.7.3 → v1.12.2
- Sync GDS v0.2.2 → v0.3.0

### Added

- `find-orphan-files.ts` script — detects stale files inside surviving plugin
  skill directories (orphaned by upstream renames mid-skill, not caught by
  `clean-orphaned-skills.ts` which only handles whole directories)
- `bmad-checkpoint-preview` skill (NEW in core v6.3.0)
- `bmad-prfaq` skill (Working Backwards PRFAQ challenge)

### Removed

- `bmad-init` skill (config now loads from `_bmad/bmm/config.yaml`)
- `bmad-agent-qa`, `bmad-agent-quick-flow-solo-dev`, `bmad-agent-sm` skill
  dirs (Barry/Quinn/Bob personas consolidated into Developer Amelia upstream)

> **Note:** this tag was merged "for local testing" so the user's fork could
> be used as a Claude Code marketplace before the upstream PR landed. There
> is no v6.3.0.0 / v6.3.0.1 — the plugin patch jumped to .2 to reflect the
> two iteration commits during the test cycle.

## [6.2.2.0] - 2026-03-31

### Changed

- Sync core BMAD-METHOD v6.2.0 → v6.2.2
- Sync BMB v1.1.0 → v1.4.0
- Sync TEA v1.7.1 → v1.7.3

### Fixed

- Update upstream version badges for bmb, cis, tea

## [6.2.0.4] - 2026-03-23

### Changed

- Sync TEA v1.7.0 → v1.7.1
- Sync BMB v1.0.2 → v1.1.0
- Sync CIS v0.1.6 → v0.1.9

## [6.2.0.3] - 2026-03-18

### Fixed

- Resolve all validation warnings: plugin-only agents register correctly,
  path checker no longer flags expected paths

## [6.2.0.2] - 2026-03-18

### Fixed

- Clean stale files left over after upstream renames
- Content / workflow validation false positives

## [6.2.0.1] - 2026-03-18

### Changed

- Resolve 23 `workflowWorkarounds` (remove 14 obsolete GDS entries, rename
  field for clarity)

### Added

- `docs/script-pipeline.md` — full script-pipeline reference
- Pre-push hook hardening: `set -e` so lint failures block pushes

## [6.2.0.0] - 2026-03-18

### Changed

- Sync core to upstream v6.2.0 (path migration: `src/bmm/workflows/` →
  `src/bmm-skills/`, agents now embedded in skill dirs)
- Bump GDS to v0.2.2

### Added

- Path rewriter handles new core-module layout
- Content checker deduplication
- TEA workflow workarounds for stale upstream agent refs
- `gds-domain-research` skill from upstream sync

### Fixed

- Skip `SKILL.md` generation when upstream provides it (prevent overwrite)
- Remove stale GDS files left over from prior sync

## [6.0.4.3] - 2026-03-09

### Changed

- Consolidate version files into a single `.upstream-versions/` directory
  (was previously scattered across `.upstream-version-*` dotfiles)
- Replace `_bmad/_memory/` sidecar paths with Claude Code's native
  `agent-memory` infrastructure
- Rewrite `_bmad-output/` paths to plain `bmad-output/` in plugin files

### Added

- `docs/terminology.md` — plugin storage conventions
- BMAD sidecar memory system analysis research note

## [6.0.4.2] - 2026-03-06

### Changed

- Bump upstreams: core v6.0.4, TEA v1.5.2, GDS v0.1.10

### Added

- `_config/` path rewrites in sync pipeline
- `agent-manifest.csv` generated alongside the rest of the sync
- `docs/plugin-distribution.md` — distribution reference

### Fixed

- Roll back issue-tracker store to SQLite, remove duplicate tombstones and
  stale statuses

## [6.0.3.4] - 2026-02-26

### Changed

- Beads issue-tracker sync before release

## [6.0.0-Beta.4.1] - 2026-01-29

### Added

- E2E test suite expanded to 6 tests: status, init, quinn agent, random smoke
- Tests run concurrently via `test.concurrent` for faster execution
- Dynamic upstream version badge (shields.io endpoint)
- GitHub dependency graph submission for BMAD-METHOD upstream
- Version bump and release script (`scripts/release.sh`)

### Changed

- Test runner upgraded from `Bun.spawnSync` to async `Bun.spawn`
- Sync workflow now auto-updates badge JSON on upstream changes

## [6.0.0-Beta.4.0] - 2026-01-29

### Added

- Quinn agent (QA engineer) replacing TEA agent

### Changed

- Synced content to BMAD-METHOD Beta.4
- Rephrased key advantages in docs

### Removed

- TEA module skills (upstream deleted in Beta.4)

## [6.0.0-Beta.2.2] - 2026-01-28

### Fixed

- Pin upstream validation to release tag, re-sync content
- Strip v prefix in upstream version comparison
- Add issues write permission to workflows
- List check names in validation output
- Add badges to README, make workflows robust

### Changed

- Rename workaround workflow to Skills Workaround Status
- Rename marketplace to bmad-plugin

## [6.0.0-Beta.2.0] - 2026-01-27

### Added

- Plugin versioning system
- Quiet mode to validation script
- Upstream coverage validation script with pre-push hook
- Content consistency check to validation script
- Upstream BMAD version sync workflow
- All remaining workflows as skills (27 new, 33 total)
- Remaining 7 agents (architect, SM, UX designer, TEA, tech writer, barry, bmad-master)
- Templates, config, and TEA knowledge base from upstream
- Plugin README and marketplace submission record

### Changed

- Rewrite SKILL.md descriptions to concise action-oriented format
- Reorganize into `plugins/bmad/` with bmad- prefix names
- Convert commands to skills, simplify plugin.json
- Split validation script into modular files
- Three-set skill validation (upstream/dirs/manifest)
- Sync plugin content to upstream Beta.2

### Fixed

- Flatten skills directory structure
- Workaround isHidden bug for skill autocomplete
- Normalize quotes in content comparison
- Add missing testarch-knowledge to plugin.json commands

## [0.1.0] - 2026-01-26

### Added

- Initial BMAD plugin POC

[6.5.0.0]: https://github.com/tgorka/bmad-plugin/compare/v6.3.0.2...v6.5.0.0
[6.3.0.2]: https://github.com/PabloLION/bmad-plugin/compare/v6.2.2.0...v6.3.0.2
[6.2.2.0]: https://github.com/PabloLION/bmad-plugin/compare/v6.2.0.4...v6.2.2.0
[6.2.0.4]: https://github.com/PabloLION/bmad-plugin/compare/v6.2.0.3...v6.2.0.4
[6.2.0.3]: https://github.com/PabloLION/bmad-plugin/compare/v6.2.0.2...v6.2.0.3
[6.2.0.2]: https://github.com/PabloLION/bmad-plugin/compare/v6.2.0.1...v6.2.0.2
[6.2.0.1]: https://github.com/PabloLION/bmad-plugin/compare/v6.2.0.0...v6.2.0.1
[6.2.0.0]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.4.3...v6.2.0.0
[6.0.4.3]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.4.2...v6.0.4.3
[6.0.4.2]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.3.4...v6.0.4.2
[6.0.3.4]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.0-Beta.4.1...v6.0.3.4
[6.0.0-Beta.4.1]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.0-Beta.4.0...v6.0.0-Beta.4.1
[6.0.0-Beta.4.0]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.0-Beta.2.2...v6.0.0-Beta.4.0
[6.0.0-Beta.2.2]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.0-Beta.2.0...v6.0.0-Beta.2.2
[6.0.0-Beta.2.0]: https://github.com/PabloLION/bmad-plugin/compare/c3db5e8...v6.0.0-Beta.2.0
[0.1.0]: https://github.com/PabloLION/bmad-plugin/commits/c3db5e8
