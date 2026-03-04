# Plugin Data Storage

How Claude Code plugins persist data across sessions. Three mechanisms, each
for a different scope.

## 1. Agent Memory (`memory: project`)

Per-agent persistent storage. Enabled via frontmatter in agent definitions.

**Location:** `.claude/agent-memory/<agent-name>/`

**Behavior:**

- `MEMORY.md` — auto-loaded (first 200 lines) on every agent invocation
- Sibling files (e.g., `patterns.md`, `findings.md`) — persist but NOT
  auto-loaded, read on demand via `Read` tool
- Created automatically when agent first writes to it
- Not git-tracked (gitignored)

**Use case:** Agent-specific knowledge that builds over time — conventions
discovered, architectural decisions, debugging patterns.

**Example frontmatter:**

```yaml
---
name: scripts
memory: project
isolation: worktree
background: true
---
```

**Resulting directory:**

```
.claude/agent-memory/scripts/
  MEMORY.md          # auto-loaded
  sync-patterns.md   # on-demand
  known-issues.md    # on-demand
```

## 2. Plugin Root Data (`${CLAUDE_PLUGIN_ROOT}`)

Files stored inside the plugin directory itself. Accessible via the
`${CLAUDE_PLUGIN_ROOT}` environment variable in hooks and MCP configs.

**Location:** `<plugin-root>/data/` (or any path under plugin root)

**Behavior:**

- Plugin files are git-tracked (shared with team)
- Hooks and MCP server configs can reference paths via `${CLAUDE_PLUGIN_ROOT}`
- No auto-loading — files read on demand by agent instructions or hooks

**Use case:** Static knowledge bases, reference data, templates, or cached
results that ship with the plugin.

**Example hook config:**

```json
{
  "hooks": {
    "PreToolUse": [{
      "type": "command",
      "command": "cat ${CLAUDE_PLUGIN_ROOT}/data/validation-rules.json"
    }]
  }
}
```

## 3. Plugin Local Settings (`.claude/<plugin-name>.local.md`)

Per-project, per-user plugin configuration. YAML frontmatter for structured
settings, markdown body for free-form notes.

**Location:** `.claude/<plugin-name>.local.md`

**Behavior:**

- Automatically gitignored (private to user)
- NOT auto-loaded into context — read on demand by plugin skills/agents
- YAML frontmatter for structured key-value settings
- Markdown body for user notes or overrides

**Use case:** User-specific plugin preferences, API keys, local paths, feature
flags.

**Example (`.claude/bmad.local.md`):**

```markdown
---
preferred-workflow: agile
output-dir: ~/projects/bmad-output
debug: false
---

# Local BMAD Settings

Using agile workflow for this project. Output goes to home directory.
```

## Comparison

| Mechanism | Scope | Shared? | Auto-loaded? | Git-tracked? |
|-----------|-------|---------|-------------|-------------|
| Agent memory | Per-agent | No | MEMORY.md only (200 lines) | No |
| Plugin root data | Per-plugin | Yes | No | Yes |
| Plugin local settings | Per-user per-project | No | No | No |

## Which to Use

- **Agent learns something** → agent memory
- **Data ships with plugin** → plugin root data
- **User configures plugin** → plugin local settings
