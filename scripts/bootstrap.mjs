import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand } from './process.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');
const extension = resolve(root, 'extensions', 'veylora-core');

function main() {
  runCommand('git', ['submodule', 'sync', '--recursive'], { cwd: root });
  runCommand('git', ['submodule', 'update', '--init', '--recursive'], { cwd: root });

  if (!existsSync(resolve(upstream, 'package.json'))) {
    throw new Error(
      'Code - OSS source is missing. Check network access and the Git submodule configuration.'
    );
  }

  runCommand('corepack', ['pnpm', 'install'], { cwd: upstream });
  runCommand('npm', ['install'], { cwd: extension });
  console.log('Veylora development dependencies are ready.');
}

try {
  main();
} catch (error) {
  console.error(`Veylora bootstrap failed: ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
}
