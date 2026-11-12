import { resolve } from 'node:path';

/** Resolve the native Code - OSS development launcher for the target OS. */
export function resolveCodeOssLauncher(upstream, platform = process.platform) {
  const filename = platform === 'win32' ? 'code.bat' : 'code.sh';
  return resolve(upstream, 'scripts', filename);
}
