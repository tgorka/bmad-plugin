import { afterAll, describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const INIT_SH = resolve(import.meta.dir, '../plugins/bmad/scripts/init.sh');

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'bmad-init-'));
  tempDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function runInit(...args: string[]): Promise<string> {
  const proc = Bun.spawn(['bash', INIT_SH, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`init.sh exited with ${exitCode}: ${stderr}`);
  }
  return stdout;
}

describe('init.sh', () => {
  test('creates the full working-repo structure', async () => {
    const dir = makeTempDir();
    const output = await runInit(dir);

    for (const rel of [
      '_bmad/config.toml',
      '_bmad/scripts/memlog.py',
      '_bmad/scripts/resolve_customization.py',
      '_bmad/_config/bmad-help.csv',
      '_bmad/custom/config.toml',
      '_bmad/custom/config.user.toml',
      '_bmad-output/planning-artifacts',
      '_bmad-output/implementation-artifacts',
      'docs',
      'skills/test-artifacts',
    ]) {
      expect(existsSync(join(dir, rel))).toBe(true);
    }
    // dot.gitignore in the template materializes as a real .gitignore
    const gitignore = join(dir, '_bmad/custom/.gitignore');
    expect(existsSync(gitignore)).toBe(true);
    expect(readFileSync(gitignore, 'utf8')).toContain('*.user.toml');
    expect(existsSync(join(dir, '_bmad/custom/dot.gitignore'))).toBe(false);
    expect(output).toContain('created');
  });

  test('substitutes the project name into config files', async () => {
    const dir = makeTempDir();
    await runInit(dir);

    const configToml = readFileSync(join(dir, '_bmad/config.toml'), 'utf8');
    const bmmYaml = readFileSync(join(dir, '_bmad/bmm/config.yaml'), 'utf8');
    expect(configToml).toContain(`project_name = "${basename(dir)}"`);
    expect(bmmYaml).toContain(`project_name: ${basename(dir)}`);
    expect(configToml).not.toContain('__BMAD_PROJECT_NAME__');
    expect(bmmYaml).not.toContain('__BMAD_PROJECT_NAME__');
  });

  test('is idempotent and never overwrites existing files', async () => {
    const dir = makeTempDir();
    await runInit(dir);

    const configPath = join(dir, '_bmad/config.toml');
    writeFileSync(configPath, '# user-edited\n');

    const output = await runInit(dir);
    expect(output).toContain('Done: 0 created');
    expect(readFileSync(configPath, 'utf8')).toBe('# user-edited\n');
  });

  test('--dry-run creates nothing', async () => {
    const dir = makeTempDir();
    const output = await runInit(dir, '--dry-run');
    expect(output).toContain('[dry-run]');
    expect(existsSync(join(dir, '_bmad'))).toBe(false);
    expect(existsSync(join(dir, '_bmad-output'))).toBe(false);
  });
});
