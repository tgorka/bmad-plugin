# Release Process

`main` is the trunk and is protected, so a release either **tags what main
already carries** — the usual case, because `bun run sync` set the version
anchors and the work reached main through PRs — or bumps the version first
through a short-lived `release/vX` PR.

[`scripts/release.sh`](../scripts/release.sh) drives both.

## Usage

```sh
./scripts/release.sh                # tag + publish the version main carries
./scripts/release.sh 6.11.0.1       # bump to this version first, then release
./scripts/release.sh --after-ci     # finish a release whose bump PR is now green
```

## Pre-release checklist

The script's own preconditions, in the order it checks them:

- [ ] **On `main`.** Any other branch is a hard error — work reaches main
      through PRs, so a release is cut from the trunk.
- [ ] **Working tree clean, excluding `.beads/`** — both unstaged and staged.
      `.beads/` is exempt because the script syncs and commits it itself.
- [ ] **Local `main` identical to `origin/main`.** Tagging a local-only
      commit would publish a tag nobody else can resolve.
- [ ] **The tag `v<version>` does not already exist.**

## The common path: no bump

When `.plugin-version` already holds the target version, the script runs the
four gates itself (`typecheck`, `lint`, `validate`, `test:unit`), then tags
`origin/main` and publishes. Nothing is committed and no PR is opened.

This is the normal shape of a sync release: `bun run sync -- --tag vX.Y.Z`
writes all four version anchors as part of regenerating the tree, so by the
time that work has merged, main already carries the release version.

## The bump path

Given a version argument that differs from the current one:

1. **Branch.** Creates `release/v<version>` from main.
2. **Bump.** Rewrites `.plugin-version`, `package.json`,
   `plugins/bmad/.claude-plugin/plugin.json` and the `bmad` entry in
   `.claude-plugin/marketplace.json`, then `bun run update-readme`.
   The `bmad-manticore` entry is left alone — it tracks the upstream module
   version, not the plugin version.
3. **Verify the bump landed everywhere.** `bun run validate` requires all
   four anchors to agree, so a partial bump cannot reach a PR.
4. **Sync beads** if `bd` is available. Failure here is a warning, never
   fatal — issue bookkeeping must not be able to abort a release.
5. **PR + CI.** Pushes the branch, opens `release: v<version>` against main,
   and watches the checks. Green → continues straight into the finish phase.
   Not green → saves `.release-state` and exits 1 with instructions.
6. **Finish** (`--after-ci`): merges the PR, tags `origin/main`, publishes,
   returns to main and removes `.release-state`.

## Release notes

Notes come from the `## [<version>]` section of
[`CHANGELOG.md`](../CHANGELOG.md), not from `--generate-notes`. A sync
release touches on the order of 1,900 regenerated files, so a generated
commit list is noise; the CHANGELOG section is the only place the release is
actually explained. Write it before releasing. If no matching section
exists, the script warns and falls back to generated notes.

## Portability

The in-place edits go through a `sed_inplace` helper that uses the attached
suffix form (`sed -i.release-bak`) and removes the backup, which is the one
spelling both GNU and BSD/macOS `sed` accept.

This used to be `sed -i ''`, the BSD-only form. On Linux, GNU `sed` read the
empty string as the script and the real expression as a filename, and under
`set -euo pipefail` the run aborted **after** `.plugin-version` had already
been rewritten — a partial bump that also tripped the clean-tree
precondition on the next attempt. Both the portable helper and the
`validate` call in step 3 exist to stop that recurring.

## After a release

- Confirm the tag resolves: `git ls-remote --tags origin | grep v<version>`.
- The marketplace serves the default branch, so users are on the new version
  as soon as main moves; the tag is what `#v<version>` pins resolve against.
- `claude plugin update` can report "already at the latest version" from a
  stale marketplace cache — see the README troubleshooting note.
