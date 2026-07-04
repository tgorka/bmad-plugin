---
description: Initialize this repo for BMad — create _bmad/ config, shared scripts, and output folders that skills expect
allowed-tools: Bash
---

Initialize the current working repository for the BMad plugin.

The plugin's skill files are immutable, but every BMad skill resolves
per-project files from `{project-root}/_bmad/` (module config, shared
scripts such as `memlog.py` and `resolve_customization.py`, help
catalogs) and writes artifacts to configured output folders. Those
files must exist inside the working repo.

Steps:

1. Run the initializer via the Bash tool (idempotent — never
   overwrites existing files, only fills in missing ones):

   ```sh
   bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh"
   ```

2. Report to the user what was created and what was already present
   (the script prints a `+` line per created file and a summary).

3. If everything was already present, tell the user the repo was
   already initialized and no changes were made.

4. Suggest reviewing `_bmad/config.toml` (team-level answers) and
   `_bmad/custom/` (durable overrides) — and committing `_bmad/` to
   version control so the team shares one configuration.
