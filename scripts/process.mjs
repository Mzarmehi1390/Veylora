import { spawnSync } from 'node:child_process';

/**
 * Run a native tool with an injectable process boundary.
 *
 * Shell execution is opt-in: callers should enable it only for trusted,
 * fixed-argument Windows command shims such as npm.cmd or corepack.cmd.
 * User-provided CLI arguments must be passed to a native executable directly.
 */
export function runCommand(command, args, {
  cwd,
  env,
  stdio = 'inherit',
  shell = false,
  spawn = spawnSync
} = {}) {
  const options = { stdio, shell, windowsHide: false };
  if (cwd !== undefined) options.cwd = cwd;
  if (env !== undefined) options.env = env;

  const result = spawn(command, args, options);

  if (result.error) {
    throw new Error(`Unable to start "${command}": ${result.error.message}`, {
      cause: result.error
    });
  }

  if (result.status !== 0) {
    const exitCode = result.status ?? 1;
    const signal = result.signal ? ` (terminated by ${result.signal})` : '';
    const error = new Error(
      `Command "${command}" failed with exit code ${exitCode}${signal}.`
    );
    error.exitCode = exitCode;
    throw error;
  }

  return result;
}
