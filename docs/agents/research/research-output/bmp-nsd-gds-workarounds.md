# GDS Workflow Workarounds Review

**Issue:** bmp-nsd
**Date:** 20260306
**Scope:** Audit of 14 `workflowWorkarounds` entries in `scripts/lib/upstream-sources.ts` for the GDS upstream source

---

## Summary

The 14 workaround entries are **all still accurate and necessary**. No additions or removals are needed. The workarounds exist because the GDS upstream uses bare directory names (`code-review`, `automate`, etc.) that collide with core and TEA directory names at the plugin skill namespace level.

**Key finding:** Three gametest entries (`automate`, `test-design`, `test-review`) have `gametest-*` names in their `workflow.yaml` files, but the **directory names** still collide. The plugin maps directory names to skill names (not YAML `name` fields), so the workarounds are still required for these three.

---

## Summary Table

```csv
Workflow,Category,Collides With,Key Difference,Workaround Needed?
document-project,b — GDS extension,core,GDS adds workflow-status integration (greenfield check + sequencing validation); instructions 91 lines longer; config path differs,Yes
generate-project-context,c — minor variation,core,Identical structure; GDS replaces user_skill_level with game_dev_experience; adds "game" qualifiers in descriptions; minor path difference,Yes
code-review,c — minor variation,core,1 diff line in instructions; user_skill_level → game_dev_experience; config path gds/ vs bmm/; GDS adds backlog-template.md,Yes
correct-course,c — minor variation,core,4 instruction diff lines; same changes as code-review (skill level field + paths + verb "Load" vs "Read"),Yes
create-story,c — minor variation,core,4 instruction diff lines; story_dir vs implementation_artifacts variable; TEA workflow reference differs slightly,Yes
dev-story,c — minor variation,core,7 instruction diff lines; same skill level field swap; story_dir variable; game-qa-agent reference,Yes
quick-dev,c — minor variation,core,GDS adds output_folder + project_levels + workflow_init config vars; description reworded; config/path references updated,Yes
quick-spec,c — minor variation,core,Same changes as quick-dev; adds web_bundle: true; adds output_folder + game_dev_experience,Yes
retrospective,b — GDS extension,core,489 diff lines; GDS replaces generic agent names (Bob/Alice/Charlie) with game-themed personas (Max/Samus/Link/GLaDOS/Cloud) with distinct personalities; game vocabulary throughout,Yes
sprint-planning,c — minor variation,core,1 instruction diff line; config path only,Yes
sprint-status,c — minor variation,core,6 instruction diff lines; config path + /bmad:gds: vs /bmad:bmm: workflow references,Yes
automate,b — GDS extension,TEA,TEA has 50-line instructions; GDS has 398 lines; GDS covers Unity/Unreal/Godot-specific test generation; completely different domain content,Yes
test-design,b — GDS extension,TEA,TEA has 105-line instructions; GDS has 325 lines; GDS covers game-specific test scenarios; different templates and structure,Yes
test-review,b — GDS extension,TEA,TEA has 45-line instructions; GDS has 272 lines; GDS covers game test coverage review; GDS-specific template,Yes
```

---

## Verification: Workaround List Accuracy

All 14 directory names exist in the GDS upstream and all 14 genuinely collide with core or TEA directory names.

**GDS workflow directory inventory:**

```csv
Category dir,Sub-workflow dirs
document-project (leaf),-
1-preproduction,brainstorm-game / game-brief
2-design,gdd / narrative
3-technical,game-architecture / generate-project-context
4-production,code-review / correct-course / create-story / dev-story / retrospective / sprint-planning / sprint-status
gametest,automate / e2e-scaffold / performance / playtest-plan / test-design / test-framework / test-review
gds-quick-flow,quick-dev / quick-spec
```

No new workflows were added and no listed workflows were removed. The 14 entries are complete.

Non-workaround GDS workflows that need no renaming: `brainstorm-game`, `game-brief`, `gdd`, `narrative`, `game-architecture`, `e2e-scaffold`, `performance`, `playtest-plan`, `test-framework` — none of these collide with core or TEA.

---

## Detailed Comparison

### 1. document-project — Category (b) GDS Extension

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/document-project/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/document-project/`

The GDS version shares the same file structure (checklist.md, documentation-requirements.csv, instructions.md, templates/, workflows/) and identical template files (`deep-dive-template.md`, `index-template.md`, `project-overview-template.md`, `source-tree-template.md`, `project-scan-report-schema.json`). The `documentation-requirements.csv` is also identical.

The instructions differ substantially (130 vs 221 lines). GDS adds a full workflow-status integration block at step 1 that:
- Invokes `workflow-status` to get project config and check sequencing
- Detects greenfield vs brownfield and warns if running on a greenfield project
- Validates calling workflow order
- Renames step 1 to "Validate workflow and get project info" before the core's resume-check step

Config path: `_bmad/gds/` vs `_bmad/bmm/`. Description is more specific ("Brownfield project documentation scanner").

**Verdict:** GDS-specific extension. The workflow-status integration is game-dev-studio-specific. Workaround required.

---

### 2. generate-project-context — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/3-technical/generate-project-context/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/generate-project-context/`

Both are 49 lines. Differences:
- Description: GDS adds "for game dev" qualifier
- Goal text: GDS adds "game" to "implementing game code"
- Config path: `_bmad/gds/` vs `_bmad/bmm/`
- Config var: `game_dev_experience` vs `user_skill_level`
- `installed_path`: `3-technical/generate-project-context` vs `generate-project-context`
- Step loader: GDS uses relative `steps/step-01-discover.md` vs absolute path in core

Step 1 file differences: GDS removes emoji from bullet points, replaces "AI development speed" note with terser wording, and adds "game" qualifiers to domain language ("game engine", "game code").

Project-context template differs by one line: GDS initializes `sections_completed: []` while core has `sections_completed: ['technology_stack']`.

**Verdict:** Minor variation — functional parity, domain adaptation to game dev context. Workaround required (directory name collision).

---

### 3. code-review — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/4-production/code-review/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/4-implementation/code-review/`

Instructions: 226 lines each, 3 diff lines:
- `user_skill_level` → `game_dev_experience`
- Trailing blank line removed

Config differences: `_bmad/gds/` vs `_bmad/bmm/`, adds `game_dev_experience` field, adds `output_folder` variable. GDS adds a `backlog-template.md` file not present in core.

**Verdict:** Minor variation. The instructions are near-identical; differences are config path and skill-level field name. Workaround required.

---

### 4. correct-course — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/4-production/correct-course/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/4-implementation/correct-course/`

Instructions: 207 lines each, 4 diff lines:
- Config path reference
- `user_skill_level` → `game_dev_experience` (appears 2×)
- "Read fully and follow" → "Load and execute" (one verb change)

**Verdict:** Minor variation. Essentially the same workflow with config path adaptation. Workaround required.

---

### 5. create-story — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/4-production/create-story/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/4-implementation/create-story/`

Instructions: 344 lines each, 4 diff lines:
- Story file path uses `{{story_dir}}` vs `{implementation_artifacts}` variable
- Missing "previous_story_num" scan action in GDS
- GDS references `game-qa-agent *automate` instead of `/bmad:tea:automate`

GDS config adds `story_dir`, `output_folder`, and `prd_file` references `gdd.md` instead of `prd.md`.

**Verdict:** Minor variation. The story_dir/implementation_artifacts distinction is a GDS config refactor. Workaround required.

---

### 6. dev-story — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/4-production/dev-story/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/4-implementation/dev-story/`

Instructions: 410 lines each, 7 diff lines:
- `user_skill_level` → `game_dev_experience` (appears 4×)
- `{implementation_artifacts}` → `{story_dir}` (2 occurrences)
- TEA reference: GDS uses `game-qa-agent *automate` instead of `/bmad:tea:automate`

**Verdict:** Minor variation. Workaround required.

---

### 7. quick-dev — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/gds-quick-flow/quick-dev/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/bmad-quick-flow/quick-dev/`

16 diff lines. GDS adds:
- Reworded description (more flexible framing)
- `output_folder` and `project_levels` config vars
- `workflow_init` path variable
- Config path: `_bmad/gds/` vs `_bmad/bmm/`
- `game_dev_experience` vs `user_skill_level`
- Relative step loader vs absolute path

**Verdict:** Minor variation with GDS-specific workflow-status hooks. Workaround required.

---

### 8. quick-spec — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/gds-quick-flow/quick-spec/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/bmad-quick-flow/quick-spec/`

18 diff lines. Same pattern as quick-dev plus:
- Adds `web_bundle: true`
- Capitalization: `[C]` → `[c]` for continue key
- Step loader verb differs slightly

**Verdict:** Minor variation. Workaround required.

---

### 9. retrospective — Category (b) GDS Extension

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/4-production/retrospective/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/4-implementation/retrospective/`

Instructions: core 1,444 lines, GDS 1,455 lines. 489 diff lines.

GDS replaces the generic agent team with game-themed personas defined in a new `AGENT PERSONALITIES` block:
- Max (Scrum Master) — "save points", "level transitions", "boss fights" vocabulary
- Samus (Game Designer) — enthusiastic streamer energy
- Link (Dev Lead) — speedrunner framing, milestone-focused
- GLaDOS (QA) — Portal-style sardonic delivery
- Cloud (Architect) — RPG sage metaphors

Every dialogue line is rewritten in character. The story scan action uses `{story_directory}` instead of `{implementation_artifacts}`. The config path and skill level field are updated.

**Verdict:** GDS-specific extension. The persona system is a substantial game-dev-specific feature. Workaround required.

---

### 10. sprint-planning — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/4-production/sprint-planning/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/4-implementation/sprint-planning/`

Instructions: 226 lines each, 1 diff line (config path reference only).

Config adds `project_name`, `output_folder`. Description reworded slightly.

**Verdict:** Near-identical. Only the config path changes. Workaround required.

---

### 11. sprint-status — Category (c) Minor Variation

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/4-production/sprint-status/`
**Core path:** `.upstream/BMAD-METHOD/src/bmm/workflows/4-implementation/sprint-status/`

Instructions: 230 lines each, 6 diff lines:
- Config path
- `/bmad:bmm:` → `/bmad:gds:` in four workflow invocation suggestions

Config adds `output_folder`, `planning_artifacts`, `project_context`.

**Verdict:** Minor variation. Workaround required.

---

### 12. automate — Category (b) GDS Extension

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/gametest/automate/`
**TEA path:** `.upstream/bmad-method-test-architecture-enterprise/src/workflows/testarch/automate/`

TEA instructions: 50 lines. GDS instructions: 398 lines.

TEA covers general software test automation (expand test coverage for any codebase). GDS covers Unity/Unreal/Godot-specific automated test scenario generation. The content, workflow structure, and purpose are entirely different. GDS YAML name is `gametest-automate` but directory name is `automate`.

**Verdict:** GDS-specific extension. Game-engine test automation is a distinct domain. Workaround required.

---

### 13. test-design — Category (b) GDS Extension

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/gametest/test-design/`
**TEA path:** `.upstream/bmad-method-test-architecture-enterprise/src/workflows/testarch/test-design/`

TEA instructions: 105 lines (system-level / epic-level test plans). GDS instructions: 325 lines (game test scenario creator, game-engine-specific patterns). Different templates.

**Verdict:** GDS-specific extension. Workaround required.

---

### 14. test-review — Category (b) GDS Extension

**GDS path:** `.upstream/bmad-module-game-dev-studio/src/workflows/gametest/test-review/`
**TEA path:** `.upstream/bmad-method-test-architecture-enterprise/src/workflows/testarch/test-review/`

TEA instructions: 45 lines (test quality review using best practices). GDS instructions: 272 lines (game test coverage review with game-engine-specific checklists).

**Verdict:** GDS-specific extension. Workaround required.

---

## Recommendations

### Workaround list: no changes needed

All 14 entries are correct. The list is complete — no new GDS workflows were added that require workarounds, and all 14 listed directory names still exist.

### Observation: gametest YAML names are already prefixed

The three gametest workflow.yaml files already have `gametest-*` names (`gametest-automate`, `gametest-test-design`, `gametest-test-review`). This means if/when the upstream GDS renames their directories to match their YAML names (e.g., `gametest/automate/` → `gametest/gametest-automate/`), the workaround entries for those three could be removed. Worth watching on upstream updates but requires no action now.

### Observation: "true duplicate" scenario does not apply

None of the 14 are true duplicates (category a). Every GDS workflow either adapts the config path and skill-level field (minor variations) or adds game-dev-specific content (GDS extensions). Even the most minimal variants like sprint-planning (1 instruction diff line) require the workaround because the directory name collision is real — not because the content differs.

### Potential future cleanup

The `user_skill_level` → `game_dev_experience` substitution pattern appears in 8 of the 11 GDS-vs-core comparisons. This is a systematic config-field rename, not a content extension. If the plugin ever normalizes config field names across modules, these 8 entries would reduce to path-only differences — still minor variations, still needing workarounds.
