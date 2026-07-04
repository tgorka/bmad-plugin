#!/usr/bin/env bash
# BMad working-repo initializer.
#
# The plugin ships the immutable skill surface; skills additionally
# resolve per-project files from {project-root}/_bmad/ (module config,
# shared scripts like memlog.py / resolve_customization.py, help
# catalogs) and write artifacts to configured output folders. This
# script creates those working-repo files from the runtime template
# captured at sync time (plugins/bmad/runtime/_bmad/).
#
# Usage:
#   init.sh [target-dir] [--dry-run]
#
# Idempotent: existing files are never overwritten — only missing
# pieces are filled in. Safe to re-run after a plugin update to pick
# up newly added runtime files.
set -euo pipefail

TARGET_DIR="."
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) TARGET_DIR="$arg" ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE="$PLUGIN_ROOT/runtime/_bmad"
PLACEHOLDER="__BMAD_PROJECT_NAME__"

if [ ! -d "$TEMPLATE" ]; then
  echo "error: runtime template not found at $TEMPLATE" >&2
  echo "       (re-install the plugin; the template ships with it)" >&2
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "error: target directory '$TARGET_DIR' does not exist" >&2
  exit 1
fi

cd "$TARGET_DIR"
PROJECT_NAME="$(basename "$(pwd)")"

created=0
skipped=0

copy_missing() {
  src="$1"
  dest="$2"
  if [ -e "$dest" ]; then
    skipped=$((skipped + 1))
    return 0
  fi
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  [dry-run] would create $dest"
  else
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    if grep -q "$PLACEHOLDER" "$dest" 2>/dev/null; then
      escaped=${PROJECT_NAME//\\/\\\\}
      escaped=${escaped//&/\\&}
      escaped=${escaped//|/\\|}
      sed -i.bmad-init-bak "s|$PLACEHOLDER|$escaped|g" "$dest"
      rm -f "$dest.bmad-init-bak"
    fi
    echo "  + $dest"
  fi
  created=$((created + 1))
}

echo "Initializing BMad in $(pwd) (project: $PROJECT_NAME)"

# 1. _bmad/ runtime tree (config, shared scripts, help catalogs).
#    dot.gitignore is how the template stores .gitignore files (a real
#    .gitignore inside the template would exclude sibling template
#    files from the plugin repo itself) — restore the real name here.
while IFS= read -r src; do
  rel="${src#"$TEMPLATE"/}"
  case "$rel" in
    *dot.gitignore) rel="${rel%dot.gitignore}.gitignore" ;;
  esac
  copy_missing "$src" "_bmad/$rel"
done < <(find "$TEMPLATE" -type f | LC_ALL=C sort)

# 2. Output folders the default module config points at
#    (mirrors what `npx bmad-method install` creates)
for dir in \
  _bmad-output/planning-artifacts \
  _bmad-output/implementation-artifacts \
  docs \
  skills/planning-artifacts \
  skills/implementation-artifacts \
  skills/test-artifacts; do
  if [ -d "$dir" ]; then
    skipped=$((skipped + 1))
  elif [ "$DRY_RUN" -eq 1 ]; then
    echo "  [dry-run] would create $dir/"
    created=$((created + 1))
  else
    mkdir -p "$dir"
    echo "  + $dir/"
    created=$((created + 1))
  fi
done

echo "Done: $created created, $skipped already present."
if [ "$created" -eq 0 ]; then
  echo "Repo was already initialized — nothing to do."
fi
