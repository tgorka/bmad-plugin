# BMAD Method Plugin for Claude Code

Breakthrough Method for Agile AI-Driven Development — a Claude Code plugin
that provides 100 skills (including 21 agent personas shipped as skills)
across the 5 BMAD modules: BMM (core method), TEA (test architecture),
BMB (builder), CIS (creative intelligence), and GDS (game dev studio).

The skill tree is the output of the official
`npx bmad-method install --tools claude-code` installer, regenerated on
every sync — with upstream's deprecated compatibility shims pruned, so
only the current skill surface is published.

## Installation

### From marketplace

```sh
claude plugin marketplace add PabloLION/bmad-plugin
claude plugin install bmad@bmad-method
```

### From local directory

```sh
claude --plugin-dir /path/to/bmad-plugin/plugins/bmad
```

## Initialize your project

Skills resolve per-project files from `{project-root}/_bmad/` (module
config, shared scripts such as `memlog.py`, help catalogs) and write
artifacts to configured output folders. Provision them once per repo:

```sh
/bmad:init
```

Idempotent — fills in missing files only, never overwrites. The template
lives in `runtime/_bmad/` and the initializer in `scripts/init.sh`.

## Getting started

```sh
/bmad:bmad-help           # skill catalog + module map
/bmad:bmad-forge-idea     # sharpen a half-formed idea
/bmad:bmad-product-brief  # draft a product brief
/bmad:bmad-prd            # create / update / validate a PRD
/bmad:bmad-architecture   # architecture spine
/bmad:bmad-customize      # per-skill TOML overrides
```

Agent personas are skills too — e.g. `/bmad:bmad-agent-pm` (John, PM),
`/bmad:bmad-tea` (Murat, Test Architect), `/bmad:gds-agent-game-designer`
(Samus Shepard).

## Upstream

This plugin is derived from
[bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD).
See that repository and <http://docs.bmad-method.org> for full
methodology documentation.
