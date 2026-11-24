import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveCodeOssLauncher,
  resolveCodeOssWindowsExecutable
} from './launcher-paths.mjs';
import { runCommand } from './process.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, 'vendor', 'code-oss');
const extension = resolve(root, 'extensions', 'veylora-core');
const userArgs = process.argv.slice(2);
const usesWindowsCommandShims = process.platform === 'win32';

function launchWindows() {
  const productPath = resolve(upstream, 'product.json');
  if (!existsSync(productPath)) {
    throw new Error('Code - OSS product.json is missing. Run npm run brand after bootstrapping the submodule.');
  }

  const product = JSON.parse(readFileSync(productPath, 'utf8'));
  const executable = resolveCodeOssWindowsExecutable(upstream, product.nameShort);

  // Mirror scripts/code.bat's pre-launch preparation without invoking cmd.exe.
  if (!process.env.VSCODE_SKIP_PRELAUNCH) {
    runCommand(process.execPath, ['build/lib/preLaunch.ts'], { cwd: upstream });
  }

  if (!existsSync(executable)) {
    throw new Error(
      `The built Code - OSS executable was not found at ${executable}. ` +
      'Allow the upstream pre-launch step to complete and verify the native build prerequisites.'
    );
  }

  const environment = {
    ...process.env,
    NODE_ENV: 'development',
    VSCODE_DEV: '1',
    VSCODE_CLI: '1',
    ELECTRON_ENABLE_LOGGING: '1',
    ELECTRON_ENABLE_STACK_DUMPING: '1'
  };

  if (userArgs[0] === '--builtin') {
    runCommand(executable, ['build/builtin'], { cwd: upstream, env: environment });
    return;
  }

  const args = ['.'];
  if (!userArgs.includes('--extensionTestsPath')) {
    args.push('--disable-extension=vscode.vscode-api-tests');
  }
  args.push(...userArgs, `--extensionDevelopmentPath=${extension}`);

  // A native .exe preserves argument boundaries and avoids cmd.exe expansion.
  runCommand(executable, args, {
    cwd: upstream,
    env: environment,
    shell: false
  });
}

function main() {
  if (!existsSync(resolve(upstream, 'package.json'))) {
    throw new Error('Code - OSS source is missing. Run npm run bootstrap from the Veylora repository root.');
  }

  runCommand('npm', ['run', 'compile'], {
    cwd: extension,
    shell: usesWindowsCommandShims
  });

  if (usesWindowsCommandShims) {
    launchWindows();
    return;
  }

  const launcher = resolveCodeOssLauncher(upstream);
  if (!existsSync(launcher)) {
    throw new Error(
      `The Code - OSS launcher for ${process.platform} was not found at ${launcher}. ` +
      'Check that the pinned Code - OSS submodule is initialized correctly.'
    );
  }

  runCommand(launcher, [
    ...userArgs,
    `--extensionDevelopmentPath=${extension}`
  ], { cwd: upstream });
}

try {
  main();
} catch (error) {
  console.error(`Veylora launch failed: ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
}
