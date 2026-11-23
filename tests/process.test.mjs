import test from 'node:test';
import assert from 'node:assert/strict';
import { runCommand } from '../scripts/process.mjs';

test('uses inherited stdio, working directory and Windows shell mode', () => {
  let invocation;
  const result = { status: 0, error: null };
  const actual = runCommand('corepack', ['pnpm', 'install'], {
    cwd: '/workspace/code-oss',
    platform: 'win32',
    spawn: (...args) => { invocation = args; return result; }
  });
  assert.equal(actual, result);
  assert.deepEqual(invocation, [
    'corepack',
    ['pnpm', 'install'],
    { cwd: '/workspace/code-oss', stdio: 'inherit', shell: true, windowsHide: false }
  ]);
});

test('does not enable a shell on POSIX platforms', () => {
  let options;
  runCommand('pnpm', ['run', 'watch'], {
    cwd: '/workspace/code-oss',
    platform: 'linux',
    spawn: (_command, _args, value) => {
      options = value;
      return { status: 0, error: null };
    }
  });
  assert.equal(options.shell, false);
});

test('reports executable startup errors and preserves their cause', () => {
  const cause = new Error('ENOENT');
  assert.throws(
    () => runCommand('corepack', [], { spawn: () => ({ status: null, error: cause }) }),
    (error) => error.message.includes('Unable to start "corepack"') && error.cause === cause
  );
});

test('preserves non-zero exit codes for callers', () => {
  assert.throws(
    () => runCommand('npm', ['install'], {
      spawn: () => ({ status: 17, error: null, signal: null })
    }),
    (error) => error.exitCode === 17 && error.message.includes('exit code 17')
  );
});

test('treats signal termination as a failed command', () => {
  assert.throws(
    () => runCommand('code', [], {
      spawn: () => ({ status: null, error: null, signal: 'SIGTERM' })
    }),
    (error) => error.exitCode === 1 && error.message.includes('SIGTERM')
  );
});
