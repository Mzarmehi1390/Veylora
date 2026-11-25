import { resolveCodeOssWindowsExecutable } from './launcher-paths.mjs';

/**
 * Build the Windows Code - OSS launch sequence without executing processes.
 * Keeping argument/environment policy pure makes it testable on every CI OS.
 */
export function createWindowsLaunchPlan({
  upstream,
  extension,
  productName,
  args = [],
  env = process.env,
  nodeExecutable = process.execPath
}) {
  if (!Array.isArray(args) || args.some(argument => typeof argument !== 'string')) {
    throw new TypeError('Windows launch arguments must be an array of strings.');
  }

  const executable = resolveCodeOssWindowsExecutable(upstream, productName);
  const prelaunch = env.VSCODE_SKIP_PRELAUNCH
    ? null
    : {
        command: nodeExecutable,
        args: ['build/lib/preLaunch.ts'],
        cwd: upstream
      };

  if (args[0] === '--builtin') {
    return {
      prelaunch,
      launch: {
        command: executable,
        args: ['build/builtin'],
        cwd: upstream,
        shell: false
      }
    };
  }

  const launchArgs = ['.'];
  if (!args.includes('--extensionTestsPath')) {
    launchArgs.push('--disable-extension=vscode.vscode-api-tests');
  }
  launchArgs.push(...args, `--extensionDevelopmentPath=${extension}`);

  return {
    prelaunch,
    launch: {
      command: executable,
      args: launchArgs,
      cwd: upstream,
      env: {
        ...env,
        NODE_ENV: 'development',
        VSCODE_DEV: '1',
        VSCODE_CLI: '1',
        ELECTRON_ENABLE_LOGGING: '1',
        ELECTRON_ENABLE_STACK_DUMPING: '1'
      },
      shell: false
    }
  };
}
