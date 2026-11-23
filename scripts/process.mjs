import { spawnSync } from 'node:child_process';

/** Run a native tool consistently across platforms and keep execution testable. */
export function runCommand(command, args, {
  cwd,
  stdio = 'inherit',
  platform = process.platform,
  spawn = spawnSync
} = {}) {
  const result = spawn(command, args, {
    cwd,
    stdio,
    shell: platform === 'win32',
    windowsHide: false
  });

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
