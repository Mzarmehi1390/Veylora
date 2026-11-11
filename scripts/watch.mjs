import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');

if (!existsSync(resolve(upstream, 'node_modules'))) {
  throw new Error('Dependencies are missing. Run npm run bootstrap first.');
}

const result = spawnSync('corepack', ['pnpm', 'run', 'watch'], {
  cwd: upstream,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
