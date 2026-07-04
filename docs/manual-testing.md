# Manual Testing Guideline

Manual tests cover what automated E2E tests cannot — primarily plugin loading behavior in a real Claude Code session.

## Setup

```sh
cd "$(mktemp -d)" && claude --plugin-dir /absolute/path/to/bmad-plugin/plugins/bmad
```

## What to Test Manually

### Skill registration

Type `/bmad:` and verify autocomplete appears. Focus on representative cases:

- **A core skill** (e.g., `/bmad:bmad-prd`) — confirms core sync works
- **A TEA skill** (e.g., `/bmad:bmad-teach-me-testing`) — confirms external module sync works
- **A GDS skill** (e.g., `/bmad:gds-gdd`) — confirms the second categorized module works

If these appear, the rest will too since they use the same registration mechanism.

### Project initialization

Run `/bmad:init` in the empty temp dir. Expected: `_bmad/` (config +
scripts + `_config` catalogs), `_bmad-output/`, `docs/`, and
`skills/*-artifacts/` are created, and `project_name` in
`_bmad/config.toml` matches the directory name. Re-run it — expected:
`Done: 0 created`, nothing overwritten.

### Skill execution

Run `/bmad:bmad-help` and verify it reads the catalog from
`_bmad/_config/bmad-help.csv` and presents the module map. The catalog
must NOT offer deprecated skills (`bmad-create-prd`,
`bmad-create-architecture`, …) — those are pruned at sync time.

Run `/bmad:bmad-forge-idea` and verify it starts the one-question-at-a-time
interrogation.

### What NOT to test manually

- Exhaustive skill listing (covered by E2E tests)
- Deprecated-shim pruning, runtime template, init idempotency (covered
  by `bun test` and `bun run validate`)
- Upstream sync integrity (covered by validation checks)
