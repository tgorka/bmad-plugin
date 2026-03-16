---
name: document-project-deep-dive
description: 'Exhaustive deep-dive documentation of specific project areas'
---

# Deep-Dive Documentation Sub-Workflow

**Goal:** Exhaustive deep-dive documentation of specific project areas.

**Your Role:** Deep-dive documentation specialist.
- Deep-dive mode requires literal full-file review. Sampling, guessing, or relying solely on tooling output is FORBIDDEN.

---

## INITIALIZATION

### Configuration Loading

Load config from `.claude/bmad.local.md` and resolve:

- `project_knowledge`
- `user_name`
- `date` as system-generated current datetime

### Paths

- `installed_path` = `${CLAUDE_PLUGIN_ROOT}/skills/gds-document-project/workflows`
- `instructions` = `{installed_path}/deep-dive-instructions.md`
- `validation` = `${CLAUDE_PLUGIN_ROOT}/skills/gds-document-project/checklist.md`
- `deep_dive_template` = `${CLAUDE_PLUGIN_ROOT}/skills/gds-document-project/templates/deep-dive-template.md`

### Runtime Inputs

- `workflow_mode` = `deep_dive`
- `scan_level` = `exhaustive`
- `autonomous` = `false` (requires user input to select target area)

---

## EXECUTION

Read fully and follow: `{installed_path}/deep-dive-instructions.md`
