---
description:
  Generate traceability matrix and quality gate decision. Use when the user sa
  ys "lets create traceability matrix" or "I want to analyze test coverage"
user-invocable: true
---

# Bmad Testarch Trace Workflow

**Goal:** Generate traceability matrix and quality gate decision.

---

## Execution

Select a sub-workflow based on user intent:

| Trigger | Sub-workflow | Description |
| ------- | ------------ | ----------- |
| PL | `./workflow-plan.md` | plan |

Read and follow the selected sub-workflow file.

## Validation

After completion, verify against: `./checklist.md`
