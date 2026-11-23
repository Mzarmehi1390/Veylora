import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCodeOssLauncher } from './launcher-paths.mjs';
import { runCommand } from './process.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');
const extension = resolve(root, 'extensions', 'veylora-core');
const launcher = resolveCodeOssLauncher(upstream);

function main() {
  if (!existsSync(resolve(upstream, 'package.json'))) {
    throw new Error('Code - OSS source is missing. Run npm run bootstrap from the Veylora repository root.');
  }

  if (!existsSync(launcher)) {
    throw new Error(
      `The Code - OSS launcher for ${process.platform} was not found at ${launcher}. ` +
      'Check that the pinned Code - OSS submodule is initialized correctly.'
    );
  }

  runCommand('npm', ['run', 'compile'], { cwd: extension });
  runCommand(launcher, [
    `--extensionDevelopmentPath=${extension}`,
    ...process.argv.slice(2)
  ], { cwd: upstream });
}

try {
  main();
} catch (error) {
  console.error(`Veylora launch failed: ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
}
