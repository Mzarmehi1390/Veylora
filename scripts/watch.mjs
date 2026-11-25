import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand } from './process.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');

function main() {
  if (!existsSync(resolve(upstream, 'package.json'))) {
    throw new Error('Code - OSS source is missing. Run npm run bootstrap from the Veylora repository root.');
  }

  if (!existsSync(resolve(upstream, 'node_modules'))) {
    throw new Error('Code - OSS dependencies are missing. Run npm run bootstrap and wait for it to finish.');
  }

  runCommand('corepack', ['pnpm', 'run', 'watch'], {
    cwd: upstream,
    shell: process.platform === 'win32'
  });
}

try {
  main();
} catch (error) {
  console.error(`Veylora development watcher failed: ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
}
