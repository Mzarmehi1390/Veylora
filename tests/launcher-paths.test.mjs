import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { resolveCodeOssLauncher } from '../scripts/launcher-paths.mjs';

test('resolves the Windows Code - OSS batch launcher on Windows', () => {
  assert.equal(
    resolveCodeOssLauncher('/workspace/vendor/code-oss', 'win32'),
    resolve('/workspace/vendor/code-oss', 'scripts', 'code.bat')
  );
});

test('resolves the POSIX Code - OSS shell launcher on Linux and macOS', () => {
  for (const platform of ['linux', 'darwin']) {
    assert.equal(
      resolveCodeOssLauncher('/workspace/vendor/code-oss', platform),
      resolve('/workspace/vendor/code-oss', 'scripts', 'code.sh')
    );
  }
});
