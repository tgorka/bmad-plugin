---
name: document-project-full-scan
description: 'Complete project documentation workflow (initial scan or full rescan)'
---

# Full Project Scan Sub-Workflow

**Goal:** Complete project documentation (initial scan or full rescan).

**Your Role:** Full project scan documentation specialist.

---

## INITIALIZATION

### Configuration Loading

Load config from `.claude/bmad.local.md` and resolve:

- `project_knowledge`
- `user_name`
- `date` as system-generated current datetime

### Paths

- `installed_path` = `${CLAUDE_PLUGIN_ROOT}/skills/gds-document-project/workflows`
- `instructions` = `{installed_path}/full-scan-instructions.md`
- `validation` = `${CLAUDE_PLUGIN_ROOT}/skills/gds-document-project/checklist.md`
- `documentation_requirements_csv` = `${CLAUDE_PLUGIN_ROOT}/skills/gds-document-project/documentation-requirements.csv`

### Runtime Inputs

- `workflow_mode` = `""` (set by parent: `initial_scan` or `full_rescan`)
- `scan_level` = `""` (set by parent: `quick`, `deep`, or `exhaustive`)
- `resume_mode` = `false`
- `autonomous` = `false` (requires user input at key decision points)

---

## EXECUTION

Read fully and follow: `{installed_path}/full-scan-instructions.md`
