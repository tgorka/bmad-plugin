#!/usr/bin/env bash
# Release workflow: tag the current main and publish a GitHub release.
#
# Usage:
#   ./scripts/release.sh                  # release the version main already carries
#   ./scripts/release.sh 6.11.0.1         # bump to this version first, then release
#   ./scripts/release.sh --after-ci       # finish a release whose bump PR is now green
#
# `main` is the trunk and is protected, so a version bump cannot be pushed
# to it directly — it goes through a short-lived `release/vX` PR. When the
# anchors already carry the target version (the usual case: `bun run sync`
# set them and the work has landed), there is nothing to bump and the
# script tags and publishes in one pass.
#
# If CI is slow to register or fails, the bump phase saves state to
# `.release-state` and exits; fix the issue and run `--after-ci`.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
STATE_FILE="$ROOT/.release-state"

# GNU sed takes an in-place suffix only when attached (-i.bak); BSD/macOS
# sed requires it as a separate argument. Writing one form breaks the
# other — and it broke mid-bump, after .plugin-version had been rewritten.
sed_inplace() {
  local expr="$1" file="$2"
  sed -i.release-bak -e "$expr" "$file"
  rm -f "$file.release-bak"
}

# Release notes come from the CHANGELOG section for this version.
# `--generate-notes` produces a commit list, which for a sync release is
# 1,900 regenerated files' worth of noise.
extract_notes() {
  local version="$1" out="$2"
  awk -v want="## [$version]" '
    index($0, want) == 1 { capture = 1; next }
    capture && /^## \[/   { exit }
    capture               { print }
  ' "$ROOT/CHANGELOG.md" > "$out"
  [[ -s "$out" ]]
}

publish() {
  local tag="$1"

  echo "Tagging $tag on origin/main..."
  git fetch origin main --quiet
  git tag -a "$tag" origin/main -m "$tag"
  git push origin "$tag"

  local notes="$ROOT/.release-notes.md"
  if extract_notes "${tag#v}" "$notes"; then
    echo "Creating GitHub release from the CHANGELOG section..."
    gh release create "$tag" --title "$tag" --notes-file "$notes" --latest
  else
    echo "⚠ No CHANGELOG section for ${tag#v}; falling back to generated notes." >&2
    gh release create "$tag" --title "$tag" --generate-notes --latest
  fi
  rm -f "$notes"

  echo "Triggering the upstream release watcher..."
  gh workflow run sync-upstream.yml 2>/dev/null ||
    echo "⚠ Could not trigger sync-upstream workflow"

  echo ""
  echo "Released $tag"
}

# ── Phase 2: --after-ci ─────────────────────────────────────────────────────

if [[ "${1:-}" == "--after-ci" ]]; then
  [[ -f "$STATE_FILE" ]] || {
    echo "Error: no .release-state file found. Run a full release first." >&2
    exit 1
  }

  # shellcheck source=/dev/null
  source "$STATE_FILE"
  echo "Resuming release: $RELEASE_TAG (PR #$RELEASE_PR_NUMBER)"

  echo "Checking CI status..."
  gh pr checks "$RELEASE_PR_NUMBER" --watch --interval 10 || {
    echo "Error: CI still failing on PR #$RELEASE_PR_NUMBER" >&2
    exit 1
  }

  echo "Merging PR #$RELEASE_PR_NUMBER..."
  gh pr merge "$RELEASE_PR_NUMBER" --merge

  publish "$RELEASE_TAG"

  git checkout main
  git pull --ff-only
  rm -f "$STATE_FILE"
  exit 0
fi

# ── Phase 1 ─────────────────────────────────────────────────────────────────

CURRENT_BRANCH="$(git branch --show-current)"
CURRENT_VERSION="$(tr -d 'v \n' < "$ROOT/.plugin-version")"

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: must be on main (currently on $CURRENT_BRANCH)." >&2
  echo "       main is the trunk; work reaches it through PRs." >&2
  exit 1
fi

if [[ -n "$(git diff --name-only -- ':!.beads')" ]] ||
   [[ -n "$(git diff --cached --name-only -- ':!.beads')" ]]; then
  echo "Error: uncommitted changes (excluding .beads/). Commit or stash first." >&2
  git status -s
  exit 1
fi

git fetch origin main --quiet
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  echo "Error: local main is not identical to origin/main. Pull first." >&2
  exit 1
fi

# --- Step 1: bump (optional) ---

NEW_VERSION="${1:-$CURRENT_VERSION}"
TAG="v${NEW_VERSION}"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: tag $TAG already exists" >&2
  exit 1
fi

if [[ "$CURRENT_VERSION" == "$NEW_VERSION" ]]; then
  echo "Releasing the version main already carries: $NEW_VERSION"

  echo "Running gates..."
  bun run typecheck
  bun run lint
  bun run validate
  bun run test:unit

  publish "$TAG"
  exit 0
fi

echo "Bumping $CURRENT_VERSION → $NEW_VERSION"

RELEASE_BRANCH="release/$TAG"
git checkout -b "$RELEASE_BRANCH"

echo "v${NEW_VERSION}" > "$ROOT/.plugin-version"
for file in \
  "$ROOT/package.json" \
  "$ROOT/plugins/bmad/.claude-plugin/plugin.json" \
  "$ROOT/.claude-plugin/marketplace.json"; do
  sed_inplace "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$file"
done
bun run update-readme

# `validate` requires all four anchors to agree, so a partial bump — the
# failure mode of the old BSD-only sed — cannot reach a PR.
bun run validate

git add .plugin-version package.json plugins/bmad/.claude-plugin/plugin.json \
  .claude-plugin/marketplace.json README.md .github/badges
git commit -m "chore: bump version to $NEW_VERSION"

# Issue-tracker bookkeeping must never be able to abort a release: under
# `set -e` a `bd` that is present but incompatible (or simply failing)
# used to kill the run *after* the bump commit, leaving a release branch
# with no PR behind it.
if command -v bd >/dev/null 2>&1 && [[ -d "$ROOT/.beads" ]]; then
  echo "Syncing beads..."
  if bd sync; then
    if [[ -n "$(git status --porcelain .beads/)" ]]; then
      git add .beads/
      git commit -m "chore: sync beads before release"
    fi
  else
    echo "⚠ bd sync failed — continuing without a beads commit." >&2
  fi
fi

git push -u origin "$RELEASE_BRANCH"

PR_URL=$(gh pr create --base main --title "release: $TAG" --body "Version bump to \`$NEW_VERSION\` for release \`$TAG\`.

Tagging and the GitHub release happen once this is merged —
\`./scripts/release.sh --after-ci\`.")
echo "PR created: $PR_URL"
PR_NUMBER="${PR_URL##*/}"

cat > "$STATE_FILE" <<EOF
RELEASE_PR_NUMBER=$PR_NUMBER
RELEASE_TAG=$TAG
RELEASE_VERSION=$NEW_VERSION
RELEASE_BRANCH=$RELEASE_BRANCH
EOF

echo "Waiting for CI..."
if gh pr checks "$PR_NUMBER" --watch --interval 10; then
  exec "$0" --after-ci
fi

echo ""
echo "CI has not passed yet. State saved to .release-state."
echo "Once it is green: ./scripts/release.sh --after-ci"
exit 1
