import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PLUGIN_DIR = resolve(import.meta.dir, '../plugins/bmad');
const SKILLS_DIR = join(PLUGIN_DIR, 'skills');
const RUNTIME_DIR = join(PLUGIN_DIR, 'runtime/_bmad');

function skillDirs(): string[] {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

describe('skill tree', () => {
  test('no deprecated upstream shims survive the sync prune', () => {
    const offenders = skillDirs().filter((name) => {
      const skillMd = join(SKILLS_DIR, name, 'SKILL.md');
      if (!existsSync(skillMd)) return false;
      const text = readFileSync(skillMd, 'utf8');
      const fm = text.match(/^---\n([\s\S]*?)\n---/);
      return fm?.[1]?.includes('DEPRECATED') ?? false;
    });
    expect(offenders).toEqual([]);
  });

  test('skills retired upstream are absent', () => {
    const retired = [
      'bmad-distillator', // superseded by bmad-spec (v6.8.0)
      'bmad-create-ux-design', // replaced by bmad-ux (v6.8.0)
      'bmad-investigate', // retired (v6.10.0)
      // consolidated into intent-based gds-gdd / gds-prd / gds-ux
      'gds-create-gdd',
      'gds-edit-gdd',
      'gds-validate-gdd',
      'gds-create-prd',
      'gds-edit-prd',
      'gds-validate-prd',
      'gds-create-ux-design',
      // deprecated shims pruned by sync
      'bmad-create-prd',
      'bmad-edit-prd',
      'bmad-validate-prd',
      'bmad-create-architecture',
    ];
    const present = retired.filter((name) =>
      existsSync(join(SKILLS_DIR, name)),
    );
    expect(present).toEqual([]);
  });

  test('current-surface skills introduced up to v6.10.0 are present', () => {
    const expected = [
      'bmad-prd',
      'bmad-architecture',
      'bmad-ux',
      'bmad-spec',
      'bmad-forge-idea',
      'bmad-dev-auto',
      'bmad-eval-runner',
      'gds-gdd',
      'gds-prd',
      'gds-ux',
      'gds-investigate',
    ];
    const missing = expected.filter(
      (name) => !existsSync(join(SKILLS_DIR, name, 'SKILL.md')),
    );
    expect(missing).toEqual([]);
  });
});

describe('runtime template', () => {
  test('ships the files skills resolve from {project-root}/_bmad', () => {
    const required = [
      'config.toml',
      'scripts/memlog.py',
      'scripts/resolve_config.py',
      'scripts/resolve_customization.py',
      '_config/bmad-help.csv',
      '_config/manifest.yaml',
      'bmm/config.yaml',
      'custom/config.toml',
      'custom/config.user.toml',
      // stored under a safe name so it can't ignore sibling template
      // files in this repo; init.sh restores the real .gitignore name
      'custom/dot.gitignore',
    ];
    const missing = required.filter(
      (rel) => !existsSync(join(RUNTIME_DIR, rel)),
    );
    expect(missing).toEqual([]);
    expect(existsSync(join(RUNTIME_DIR, 'custom/.gitignore'))).toBe(false);
  });

  test('project name is templatized, not the throwaway install dir', () => {
    const configToml = readFileSync(join(RUNTIME_DIR, 'config.toml'), 'utf8');
    expect(configToml).toContain('__BMAD_PROJECT_NAME__');
    expect(configToml).not.toContain('.upstream-install');
  });

  test('manifests carry no rows for pruned deprecated shims', () => {
    for (const csv of ['skill-manifest.csv', 'files-manifest.csv']) {
      const text = readFileSync(join(RUNTIME_DIR, '_config', csv), 'utf8');
      expect(text).not.toMatch(
        /bmad-create-prd|bmad-edit-prd|bmad-validate-prd|bmad-create-architecture/,
      );
    }
  });
});

describe('plugin manifest', () => {
  test('declares skills and commands', () => {
    const manifest = JSON.parse(
      readFileSync(join(PLUGIN_DIR, '.claude-plugin/plugin.json'), 'utf8'),
    );
    expect(manifest.skills).toBe('./skills/');
    expect(manifest.commands).toBe('./commands/');
    expect(existsSync(join(PLUGIN_DIR, 'commands/init.md'))).toBe(true);
    expect(existsSync(join(PLUGIN_DIR, 'scripts/init.sh'))).toBe(true);
  });
});
