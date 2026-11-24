import { resolve } from 'node:path';

/** Resolve the upstream shell launcher used on POSIX systems. */
export function resolveCodeOssLauncher(upstream, platform = process.platform) {
  if (platform === 'win32') {
    throw new Error('The Windows batch launcher must not be invoked through a command shell.');
  }
  return resolve(upstream, 'scripts', 'code.sh');
}

/**
 * Resolve the built Electron executable used for a safe native Windows launch.
 * The product name is a single filename segment from the local product.json.
 */
export function resolveCodeOssWindowsExecutable(upstream, nameShort) {
  if (
    typeof nameShort !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9 ._-]*$/.test(nameShort) ||
    /[ .]$/.test(nameShort) ||
    nameShort.toLowerCase().endsWith('.exe')
  ) {
    throw new TypeError('Code - OSS product nameShort must be a safe Windows filename without an extension.');
  }

  return resolve(upstream, '.build', 'electron', `${nameShort}.exe`);
}
