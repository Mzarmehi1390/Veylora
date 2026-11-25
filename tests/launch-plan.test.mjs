import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createWindowsLaunchPlan } from '../scripts/windows-launch-plan.mjs';

const upstream = resolve('/workspace/vendor/code-oss');
const extension = resolve('/workspace/extensions/veylora-core');
const executable = resolve(upstream, '.build', 'electron', 'Veylora.exe');

test('builds a safe default Windows launch plan and preserves argument boundaries', () => {
  const env = { PATH: 'C:\\tools', CUSTOM_FLAG: 'kept' };
  const userArgs = ['--new-window', 'C:\\Projects\\my workspace', '--user-data-dir=C:\\data dir'];
  const plan = createWindowsLaunchPlan({
    upstream,
    extension,
    productName: 'Veylora',
    args: userArgs,
    env,
    nodeExecutable: 'C:\\Program Files\\nodejs\\node.exe'
  });

  assert.deepEqual(plan.prelaunch, {
    command: 'C:\\Program Files\\nodejs\\node.exe',
    args: ['build/lib/preLaunch.ts'],
    cwd: upstream
  });
  assert.equal(plan.launch.command, executable);
  assert.equal(plan.launch.cwd, upstream);
  assert.equal(plan.launch.shell, false);
  assert.deepEqual(plan.launch.args, [
    '.',
    '--disable-extension=vscode.vscode-api-tests',
    ...userArgs,
    `--extensionDevelopmentPath=${extension}`
  ]);
  assert.equal(plan.launch.env.PATH, env.PATH);
  assert.equal(plan.launch.env.CUSTOM_FLAG, env.CUSTOM_FLAG);
  assert.equal(plan.launch.env.NODE_ENV, 'development');
  assert.equal(plan.launch.env.VSCODE_DEV, '1');
  assert.equal(plan.launch.env.VSCODE_CLI, '1');
});

test('does not disable the API test extension when extension tests are requested', () => {
  const plan = createWindowsLaunchPlan({
    upstream,
    extension,
    productName: 'Veylora',
    args: ['--extensionTestsPath', 'C:\\tests\\suite.js'],
    env: {}
  });

  assert.equal(
    plan.launch.args.includes('--disable-extension=vscode.vscode-api-tests'),
    false
  );
});

test('matches upstream builtin mode without injecting normal workbench arguments', () => {
  const env = { PATH: 'C:\\tools' };
  const plan = createWindowsLaunchPlan({
    upstream,
    extension,
    productName: 'Veylora',
    args: ['--builtin'],
    env
  });

  assert.deepEqual(plan.launch, {
    command: executable,
    args: ['build/builtin'],
    cwd: upstream,
    shell: false
  });
  assert.deepEqual(plan.prelaunch.args, ['build/lib/preLaunch.ts']);
});

test('honors VSCODE_SKIP_PRELAUNCH and keeps direct execution', () => {
  const plan = createWindowsLaunchPlan({
    upstream,
    extension,
    productName: 'Veylora',
    args: ['--new-window'],
    env: { VSCODE_SKIP_PRELAUNCH: '1' }
  });

  assert.equal(plan.prelaunch, null);
  assert.equal(plan.launch.shell, false);
});

test('rejects non-string CLI arguments before process execution', () => {
  assert.throws(
    () => createWindowsLaunchPlan({
      upstream,
      extension,
      productName: 'Veylora',
      args: ['--new-window', { injected: true }],
      env: {}
    }),
    /array of strings/
  );
});

test('rejects unsafe product executable names', () => {
  assert.throws(
    () => createWindowsLaunchPlan({
      upstream,
      extension,
      productName: '..\\outside',
      args: [],
      env: {}
    }),
    /safe Windows filename/
  );
});

test('preserves API test extension when extension test path uses equals syntax', () => {
  const plan = createWindowsLaunchPlan({
    upstream,
    extension,
    productName: 'Veylora',
    args: ['--extensionTestsPath=C:\\\\tests\\\\suite.js'],
    env: {}
  });

  assert.equal(
    plan.launch.args.includes('--disable-extension=vscode.vscode-api-tests'),
    false
  );
});
