import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');
const extension = resolve(root, 'extensions', 'veylora-core');

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('git', ['submodule', 'sync', '--recursive']);
run('git', ['submodule', 'update', '--init', '--recursive']);

if (!existsSync(resolve(upstream, 'package.json'))) {
  throw new Error('Code - OSS source is missing. Check the Git submodule configuration.');
}

run('corepack', ['pnpm', 'install'], upstream);
run('npm', ['install'], extension);
console.log('Veylora development dependencies are ready.');
