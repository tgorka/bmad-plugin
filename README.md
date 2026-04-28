# BMAD Plugin for Claude Code

> BMAD Method - Breakthrough Method for Agile AI-Driven Development

[![Synced with BMAD-METHOD](https://github.com/PabloLION/bmad-plugin/actions/workflows/sync-upstream.yml/badge.svg)](https://github.com/PabloLION/bmad-plugin/actions/workflows/sync-upstream.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
<!-- upstream-badges-start -->
[![BMAD Method version](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/PabloLION/bmad-plugin/main/.github/badges/upstream-version.json)](https://github.com/bmadcode/BMAD-METHOD)
[![TEA Module version](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/PabloLION/bmad-plugin/main/.github/badges/upstream-version-tea.json)](https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise)
[![BMB Module version](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/PabloLION/bmad-plugin/main/.github/badges/upstream-version-bmb.json)](https://github.com/bmad-code-org/bmad-builder)
[![CIS Module version](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/PabloLION/bmad-plugin/main/.github/badges/upstream-version-cis.json)](https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite)
[![GDS Module version](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/PabloLION/bmad-plugin/main/.github/badges/upstream-version-gds.json)](https://github.com/bmad-code-org/bmad-module-game-dev-studio)
<!-- upstream-badges-end -->

<!-- upstream-version-start -->
**Plugin version:** v6.5.0.0

| Module | Version | Released | Last Checked |
|---|---|---|---|
| [BMAD Method](https://github.com/bmadcode/BMAD-METHOD) | v6.5.0 | 2026-04-26 | 2026-04-27 |
| [TEA](https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise) | v1.15.1 | 2026-04-24 | 2026-04-27 |
| [BMB](https://github.com/bmad-code-org/bmad-builder) | v1.7.0 | 2026-04-23 | 2026-04-27 |
| [CIS](https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite) | v0.2.0 | 2026-04-23 | 2026-04-27 |
| [GDS](https://github.com/bmad-code-org/bmad-module-game-dev-studio) | v0.4.0 | 2026-04-23 | 2026-04-27 |
<!-- upstream-version-end -->

A Claude Code plugin that transforms Claude into a complete agile development
environment with specialized agents, structured workflows, and intelligent
context management.

## Deprecation Notice

The upstream BMAD repositories are migrating from their custom `workflow.yaml`
format to Claude Code's native `SKILL.md` format. As of v6.5.0:

- **TEA** ships its agent natively as `SKILL.md` (v1.15.1).
- **GDS** ships agents and most workflows as `SKILL.md` (v0.4.0).
- **BMM (core)** still uses `workflow.yaml` with separate `customize.toml`.
- **BMB / CIS** are partial-migration.

Once all 5 upstream modules complete the SKILL.md migration, this plugin's
sync and generation pipeline becomes redundant — the upstream repos will
ship Claude Code-compatible skills directly.

At that point this plugin will be deprecated in favor of installing upstream
BMAD packages directly. Until then, this plugin remains the only way to get
all 5 BMAD modules aggregated into a single installable Claude Code plugin
with path rewrites, version tracking, customization layering, and plugin-only
additions.

## Features

- **22 Specialized Agents** across 5 modules (Core BMM, BMB, TEA, GDS, plus plugin-only)
- **93 Guided Skills** — full BMAD coverage:
  - 40 Core (BMM): analysis → planning → solutioning → implementation
  - 10 TEA: test architecture (atdd, ci, framework, nfr, trace, …)
  - 4 BMB: build BMAD agents / workflows / modules
  - 10 CIS: creative-intelligence (design thinking, storytelling, problem-solving)
  - 29 GDS: full game-development studio
- **4 Development Phases**: Analysis, Planning, Solutioning, Implementation
- **Customization Layer (v6.5.0+)**: per-skill `[agent]` / `[workflow]` TOML overrides via the new `bmad-customize` skill
- **Progressive Disclosure**: step-by-step workflow execution with resumable state

## Usage

### Step 1: Add Marketplace

> Skip this step once the plugin is listed on the official Claude Code registry.

In-session (inside Claude Code):

```sh
# Non-interactive
/plugin marketplace add PabloLION/bmad-plugin

# Interactive — use the /plugin UI → Marketplace tab
/plugin

# Pin to a specific version
/plugin marketplace add PabloLION/bmad-plugin#v6.5.0.0
```

External CLI (outside Claude Code):

```sh
claude plugin marketplace add PabloLION/bmad-plugin
```

### Step 2: Install Plugin

In-session (inside Claude Code):

```sh
# Non-interactive — installs at default (user) scope
/plugin install bmad@bmad-method

# Interactive — use the /plugin UI → Discover tab → choose scope
/plugin
```

External CLI (outside Claude Code):

```sh
# User scope (default — you, all projects)
claude plugin install bmad@bmad-method

# Project scope (shared with team, committed to repo)
claude plugin install bmad@bmad-method --scope project

# Local scope (you only, this repo only)
claude plugin install bmad@bmad-method --scope local
```

### Installation Scopes

| Scope | Who sees it | Stored in |
|---|---|---|
| **User** (default) | You, all projects | `~/.claude/settings.json` |
| **Project** | All collaborators | `.claude/settings.json` (in repo) |
| **Local** | You, this repo only | `.claude/settings.local.json` |

### Troubleshooting: Plugin Update Shows Stale Version

`claude plugin update` may report the plugin is "already at the latest version"
even when a newer version exists. This is a
[known Claude Code bug](https://github.com/anthropics/claude-code/issues/28540)
where the marketplace cache is not fetched before comparing versions.

Workaround — manually pull the marketplace cache, then retry:

```sh
git -C ~/.claude/plugins/marketplaces/bmad-method pull origin main
claude plugin update bmad@bmad-method
```

### Quick Start

```bash
# Show available BMAD skills + module map
/bmad:bmad-help

# Start a workflow (e.g., draft a product brief)
/bmad:bmad-product-brief

# Customize a skill (v6.5.0+: per-skill TOML overrides)
/bmad:bmad-customize
```

> **Note (v6.5.0):** the dedicated `init` and `status` skills were removed.
> Project config now loads automatically from `_bmad/bmm/config.yaml` on first use.

## Learn BMAD Method

New to BMAD? See the [official documentation](http://docs.bmad-method.org) for
methodology overview, workflow explanations, and best practices. The
[Getting Started Tutorial](http://docs.bmad-method.org/tutorials/getting-started/)
walks through a complete project from scratch.

## Agents

22 agents across 5 modules. Invoke via `Use the <agent> agent…` or via slash
commands the agent registers.

### Core (BMM) — 10 agents

| Agent | Persona | Role | Key Skills |
|---|---|---|---|
| analyst | Mary | Business analysis | bmad-product-brief, research, bmad-brainstorming |
| pm | John | Product requirements | bmad-create-prd, bmad-create-epics-and-stories |
| ux-designer | Sally | User experience | bmad-create-ux-design |
| architect | Winston | System design | bmad-create-architecture |
| sm | Bob | Sprint management | bmad-sprint-planning, bmad-create-story |
| dev | Amelia | Implementation | bmad-dev-story, bmad-code-review |
| qa | Quinn | QA engineering | bmad-qa-generate-e2e-tests |
| tech-writer | Paige | Documentation | bmad-document-project |
| quick-flow-solo-dev | Barry | Solo dev quick flow | bmad-quick-spec, bmad-quick-dev |
| bmad-master | Orchestrator | Cross-module orchestration | (any skill) |

### BMB (BMad Builder) — 3 agents

| Agent | Persona | Role |
|---|---|---|
| agent-builder | Bond | Build BMAD-compatible agents |
| workflow-builder | Wendy | Build BMAD-compatible workflows |
| module-builder | Morgan | Build complete BMAD modules |

### TEA (Test Architecture Enterprise) — 1 agent

| Agent | Persona | Role |
|---|---|---|
| bmad-tea | Murat | Master test architect (atdd, ci, framework, nfr, trace, …) |

### Plugin-only — 1 agent

| Agent | Persona | Role |
|---|---|---|
| quinn | Quinn | Rapid test automation (E2E + API generation) |

### GDS (Game Dev Studio) — 7 agents

| Agent | Persona | Role |
|---|---|---|
| gds-agent-game-architect | Cloud Dragonborn | Game systems architecture |
| gds-agent-game-designer | Samus Shepard | Game design / GDD |
| gds-agent-game-dev | Link Freeman | Game development |
| gds-agent-game-qa | GLaDOS | Game QA architecture |
| gds-agent-game-scrum-master | Max | Game-dev scrum master |
| gds-agent-game-solo-dev | Indie | Solo indie game dev |
| gds-agent-tech-writer | Paige | Game technical writing |

## Workflow Phases

### Phase 1: Analysis

- Brainstorming and ideation (`bmad-brainstorming`)
- Market, domain, technical research (`research/*`)
- Product brief creation (`bmad-product-brief`)

### Phase 2: Planning

- Product Requirements Document (`bmad-create-prd`, `bmad-edit-prd`)
- PRFAQ working-backwards (`bmad-prfaq`)
- UX design specifications (`bmad-create-ux-design`)

### Phase 3: Solutioning

- System architecture (`bmad-create-architecture`)
- Epic and story breakdown (`bmad-create-epics-and-stories`)
- Implementation readiness check (`bmad-check-implementation-readiness`)

### Phase 4: Implementation

- Sprint planning + status (`bmad-sprint-planning`, `bmad-sprint-status`)
- Story development (`bmad-dev-story`, `bmad-create-story`)
- Code review (`bmad-code-review`)
- Sprint correction (`bmad-correct-course`)
- Retrospective (`bmad-retrospective`)

### Phase 5 (v6.5.0+): Customization

- Per-skill `[agent]` and `[workflow]` TOML overrides (`bmad-customize`)
- Layered config: base `customize.toml` → team `.toml` → user `.user.toml`

## Attribution

This plugin implements the **BMAD Method** created by **BMad Code, LLC**.

- [Original Repository](https://github.com/bmadcode/BMAD-METHOD)
- [Website](https://bmadcodes.com/bmad-method/)
- [YouTube](https://www.youtube.com/@BMadCode)
- [Discord](https://discord.gg/gk8jAdXWmj)

## Releases

Plugin updates are published **every Wednesday** when upstream changes are detected.
No release is made if nothing changed. See [docs/versioning.md](docs/versioning.md)
for the full versioning strategy.

## Development

This repository includes verification tooling (in `scripts/` and `package.json`) that validates the plugin implementation fully covers the upstream BMAD-METHOD content. The tooling is not part of the plugin itself.

```sh
bun install          # install dependencies (Husky hooks set up automatically)
bun run validate     # run upstream coverage validation
```

The validation script checks three-way consistency: upstream BMAD-METHOD repo, plugin files, and `plugin.json` manifest. It runs automatically as a pre-push git hook via Husky.

## Why This Plugin

There is an existing community implementation
([aj-geddes/claude-code-bmad-skills](https://github.com/aj-geddes/claude-code-bmad-skills))
with 221 stars. Here is how this plugin differs:

| | **bmad-plugin** (this repo) | aj-geddes/claude-code-bmad-skills |
|---|---|---|
| Upstream version tracked | v6.5.0 (explicit, all 5 modules) | v6 (approximate) |
| Skills | 93 (40 core + 10 TEA + 4 BMB + 10 CIS + 29 GDS) | 4 |
| Agents | 22 (10 core + 3 BMB + 1 TEA + 7 GDS + 1 plugin-only) | 12 |
| Automated upstream sync | Yes (GitHub Actions, weekly) | No |
| Version tracking | Explicit, per-module `.upstream-versions/<id>.json` | None |
| CI & validation | Biome, Husky, three-way upstream coverage validation | None |
| Plugin marketplace | Yes (`marketplace.json`) | No (Smithery only) |
| Architecture | Roles → agents, workflows → skills (correct mapping) | Roles → skills (incorrect mapping) |
| Last updated | 2026-04-27 (v6.5.0.0) | 2026-01-01 |

**Key advantages:**

- **Full coverage** — all 93 skills across 5 BMAD modules (core, TEA, BMB,
  CIS, GDS), not just a sample of 4. Every workflow from each upstream repo
  has a matching skill, including v6.5.0's new `bmad-customize`.
- **Correct role mapping** — BMAD roles (PM, Architect, etc.) are modeled as
  agents with isolated context, not lumped into skills. The alternative treats
  roles and workflows the same way, which breaks Claude Code's agent model.
- **Stays up to date** — a GitHub Actions workflow checks all 5 upstreams
  weekly and creates a sync issue when any release ships. No manual checking.
- **Catches drift** — a pre-push hook validates that every agent, skill, and
  file in this plugin matches its upstream source. If something is missing
  or out of date, the push is blocked.
- **Tracks versions** — the plugin version (`6.5.0.0`) anchors to the core
  BMAD-METHOD release so you always know which generation you're running, and
  every module has its own pinned tag in `.upstream-versions/`.

## License

MIT License - See [LICENSE](LICENSE) for details.

BMad, BMad Method, and BMad Core are trademarks of BMad Code, LLC.
