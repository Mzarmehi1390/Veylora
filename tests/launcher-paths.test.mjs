import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import {
  resolveCodeOssLauncher,
  resolveCodeOssWindowsExecutable
} from '../scripts/launcher-paths.mjs';

test('resolves the POSIX Code - OSS shell launcher on Linux and macOS', () => {
  for (const platform of ['linux', 'darwin']) {
    assert.equal(
      resolveCodeOssLauncher('/workspace/vendor/code-oss', platform),
      resolve('/workspace/vendor/code-oss', 'scripts', 'code.sh')
    );
  }
});

test('does not expose the Windows batch launcher as a normal executable', () => {
  assert.throws(
    () => resolveCodeOssLauncher('C:\\workspace\\vendor\\code-oss', 'win32'),
    /must not be invoked through a command shell/
  );
});

test('resolves the branded Windows Electron executable', () => {
  assert.equal(
    resolveCodeOssWindowsExecutable('/workspace/vendor/code-oss', 'Veylora'),
    resolve('/workspace/vendor/code-oss', '.build', 'electron', 'Veylora.exe')
  );
});

test('rejects product names that could escape the executable directory', () => {
  for (const name of ['../outside', '..\\outside', 'Veylora.exe', 'bad/name', 'name.']) {
    assert.throws(
      () => resolveCodeOssWindowsExecutable('/workspace/vendor/code-oss', name),
      /safe Windows filename/
    );
  }
});
