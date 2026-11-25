import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWindowsLaunchPlan } from './windows-launch-plan.mjs';
import { resolveCodeOssLauncher } from './launcher-paths.mjs';
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
  const plan = createWindowsLaunchPlan({
    upstream,
    extension,
    productName: product.nameShort,
    args: userArgs,
    env: process.env,
    nodeExecutable: process.execPath
  });

  // Mirror scripts/code.bat while keeping user-controlled arguments out of cmd.exe.
  if (plan.prelaunch) {
    runCommand(plan.prelaunch.command, plan.prelaunch.args, {
      cwd: plan.prelaunch.cwd,
      shell: false
    });
  }

  if (!existsSync(plan.launch.command)) {
    throw new Error(
      `The built Code - OSS executable was not found at ${plan.launch.command}. ` +
      'Allow the upstream pre-launch step to complete and verify the native build prerequisites.'
    );
  }

  runCommand(plan.launch.command, plan.launch.args, {
    cwd: plan.launch.cwd,
    env: plan.launch.env,
    shell: plan.launch.shell
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
