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

[6.0.0-Beta.4.1]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.0-Beta.4.0...v6.0.0-Beta.4.1
[6.0.0-Beta.4.0]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.0-Beta.2.2...v6.0.0-Beta.4.0
[6.0.0-Beta.2.2]: https://github.com/PabloLION/bmad-plugin/compare/v6.0.0-Beta.2.0...v6.0.0-Beta.2.2
[6.0.0-Beta.2.0]: https://github.com/PabloLION/bmad-plugin/compare/c3db5e8...v6.0.0-Beta.2.0
[0.1.0]: https://github.com/PabloLION/bmad-plugin/commits/c3db5e8
