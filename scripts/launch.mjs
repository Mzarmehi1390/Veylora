import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');
const extension = resolve(root, 'extensions', 'veylora-core');

if (!existsSync(resolve(upstream, 'scripts', 'code.sh'))) {
  throw new Error('Code - OSS source is missing. Run npm run bootstrap first.');
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npm', ['run', 'compile'], extension);
const launcher = process.platform === 'win32'
  ? join(upstream, 'scripts', 'code.bat')
  : join(upstream, 'scripts', 'code.sh');

run(launcher, [
  `--extensionDevelopmentPath=${extension}`,
  ...process.argv.slice(2)
], upstream);
