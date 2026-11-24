import test from 'node:test';
import assert from 'node:assert/strict';
import { runCommand } from '../scripts/process.mjs';

test('disables shell execution by default, including on Windows', () => {
  let invocation;
  const result = { status: 0, error: null };
  const actual = runCommand('Veylora.exe', ['--new-window', 'C:\\work space'], {
    cwd: 'C:\\Veylora',
    platform: 'win32',
    spawn: (...args) => { invocation = args; return result; }
  });

  assert.equal(actual, result);
  assert.deepEqual(invocation, [
    'Veylora.exe',
    ['--new-window', 'C:\\work space'],
    {
      cwd: 'C:\\Veylora',
      stdio: 'inherit',
      shell: false,
      windowsHide: false
    }
  ]);
});

test('allows explicit shell use for trusted fixed-argument Windows command shims', () => {
  let invocation;
  runCommand('corepack', ['pnpm', 'install'], {
    cwd: 'C:\\workspace\\code-oss',
    shell: true,
    spawn: (...args) => {
      invocation = args;
      return { status: 0, error: null };
    }
  });

  assert.equal(invocation[2].shell, true);
  assert.deepEqual(invocation[1], ['pnpm', 'install']);
});

test('passes environment overrides to the child process', () => {
  let options;
  const env = { NODE_ENV: 'development', VSCODE_DEV: '1' };
  runCommand('Veylora.exe', [], {
    env,
    spawn: (_command, _args, value) => {
      options = value;
      return { status: 0, error: null };
    }
  });
  assert.equal(options.env, env);
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
