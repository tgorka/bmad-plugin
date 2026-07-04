# BMAD Ecosystem

> Inventory of all repositories in the `bmad-code-org` GitHub organization,
> classified by role. Last audited: 2026-07-04.

## Content Modules

Repos that contain agents and workflows to sync into the plugin. Each module
follows a standard layout under `src/`.

Counts below reflect **plugin output** at v6.10.0.0. Agent personas ship
as skills (there is no separate agents/ directory), so the persona count
is a subset of the skill count. Upstream's deprecated compatibility
shims are pruned at sync time and not counted.

| Module | Code | Repo | Personas (as skills) | Plugin Skills | Tracked Version |
|--------|------|------|----------------------|---------------|-----------------|
| BMM + Core | `bmm` / `core` | `BMAD-METHOD` (same monorepo) | 6 | 42 | v6.10.0 |
| TEA | `tea` | `bmad-method-test-architecture-enterprise` | 1 (Murat) | 11 | v1.19.0 |
| BMB | `bmb` | `bmad-builder` | 3 (Bond, Wendy, Morgan) | 4 | v2.1.0 |
| CIS | `cis` | `bmad-module-creative-intelligence-suite` | 6 | 10 | v0.2.1 |
| GDS | `gds` | `bmad-module-game-dev-studio` | 5 | 33 | v0.6.0 |
| Loop | `loop` | `bmad-loop` | 0 | 3 | v0.8.0 |
| **Total** | | | **21** | **103** | |

WDS (`bmad-method-wds-expansion`) is intentionally not integrated — see
[Not Ready](#not-ready).

### Notes

- **BMM + Core** live in the same monorepo (`BMAD-METHOD`). The version
  pin in `.upstream-versions/core.json` drives the whole sync — the
  installer resolves compatible versions of the other modules itself.
- **TEA** as of v1.15.1+ ships its agent natively as `SKILL.md` (instead of
  YAML), so no agent-ref mapping is needed for it.
- **GDS v0.6.0** consolidated its planning skills into intent-based
  `gds-gdd` / `gds-prd` / `gds-ux` (the create/edit/validate trios are
  gone) and added `gds-investigate`.
- **Loop** (`bmad-loop`, upstream v6.10's successor to bmad-automator)
  is not an npx-installer module. It is a Python orchestrator tool; its
  skill module (`bmad-loop-{setup,resolve,sweep}`) ships inside the
  repo under `src/bmad_loop/data/skills/` and is synced via a
  pinned-tag git clone (`.upstream-versions/loop.json`). The
  orchestrator tool itself is installed per-project by
  `/bmad:bmad-loop-setup` (via `uv tool install`).
- **WDS** still has a placeholder package name (`bmad-module-name`) and no
  release. Not ready for integration.

### Standard module layout

All content modules follow this structure:

```text
src/
  module.yaml            # Module metadata (code, name, dependencies)
  module-help.csv        # Help index
  _module-installer/     # installer.js
  agents/                # *.agent.yaml files
  workflows/             # Categorized subdirectories
  teams/                 # Team definitions (yaml + default-party.csv)
  [domain-specific]/     # Optional: testarch/, gametest/, data/, etc.
```

### Workflow organization

All modules use categorized workflows (subdirectories under a parent):

| Pattern | Used by | Example |
|---------|---------|---------|
| Numbered phases | BMM, GDS | `1-analysis/`, `2-design/` |
| Named categories | CIS, BMB | `design-thinking/`, `problem-solving/` |
| Single domain parent | TEA | `testarch/atdd/`, `testarch/ci/` |

## Infrastructure Repos

Repos that support the ecosystem but don't contain syncable content.

| Repo | Purpose | Status |
|------|---------|--------|
| `bmad-bundles` | Web distribution of compiled XML agents | Active |
| `bmad-module-template` | Scaffold for creating new modules | Active |
| `bmad-utility-skills` | Claude Code plugin for BMAD maintainers (triage, changelog, release) | Active |
| `bmad-plugins-marketplace` | Claude Code plugin marketplace registry | Active |
| `bmad-method-vscode` | VS Code extension | Early development |
| `bmad-core-tools` | Module management tooling | Empty placeholder |
| `BMAD-CORE` | Planned core extraction | Empty placeholder |
| `BMAD-FOUNDRY` | Community module hub | Empty placeholder |

### Marketplace vs Plugin distinction

- **`bmad-plugins-marketplace`** is a registry (catalog of available plugins).
  Currently lists only `bmad-utility-skills`.
- **Our repo (`PabloLION/bmad-plugin`)** is the actual content plugin that
  bundles agents and skills from upstream modules. These serve different roles.

## Reference / Legacy

| Repo | Purpose |
|------|---------|
| `Full-Small-App-Workflow` | Legacy snapshot of BMAD-METHOD (alpha.23). Contains TEA inline before extraction. Same `bmad-method` package name. Do NOT sync. |

## Not Ready

| Repo | Reason |
|------|--------|
| `bmad-cyber-sec` | Created from template, still has placeholder values. No agents or workflows. |
| `bmad-method-wds-expansion` | Placeholder package name, no release. Large module (16+ workflows) but not mature. |

## Plugin Integration Status

Which modules are configured in our plugin (`scripts/lib/upstream-sources.ts`):

| Module | Source ID | Status | Notes |
|--------|-----------|--------|-------|
| BMM + Core | `core` | Configured | v6.10.0 |
| TEA | `tea` | Configured | v1.19.0 — agent ships as SKILL.md |
| BMB | `bmb` | Configured | v2.1.0 |
| CIS | `cis` | Configured | v0.2.1 |
| GDS | `gds` | Configured | v0.6.0 — intent-based `gds-gdd` / `gds-prd` / `gds-ux` |
| Loop | `loop` | Configured | v0.8.0 — synced via pinned-tag git clone, not the npx installer |
| WDS | — | Not planned | Not mature enough |
