import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCodeOssLauncher } from './launcher-paths.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');
const extension = resolve(root, 'extensions', 'veylora-core');
const launcher = resolveCodeOssLauncher(upstream);

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(resolve(upstream, 'package.json'))) {
  throw new Error('Code - OSS source is missing. Run npm run bootstrap first.');
}

if (!existsSync(launcher)) {
  throw new Error(
    `The Code - OSS launcher for ${process.platform} was not found at ${launcher}. ` +
    'Check that the pinned Code - OSS submodule is initialized correctly.'
  );
}

run('npm', ['run', 'compile'], extension);

run(launcher, [
  `--extensionDevelopmentPath=${extension}`,
  ...process.argv.slice(2)
], upstream);
