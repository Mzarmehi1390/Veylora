import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(
  new URL('../extensions/veylora-core/package.json', import.meta.url), 'utf8'
));

test('Veylora Core declares its dashboard and initialization commands', () => {
  const commands = manifest.contributes.commands.map((item) => item.command);
  assert.ok(commands.includes('veylora.openDashboard'));
  assert.ok(commands.includes('veylora.createWorkspaceConfig'));
  assert.equal(manifest.main, './dist/extension.js');
});

test('Veylora contributes a first-party activity bar view and theme', () => {
  assert.ok(manifest.contributes.viewsContainers.activitybar.some((item) => item.id === 'veylora'));
  assert.ok(manifest.contributes.views.veylora.some((item) => item.id === 'veylora.workspace'));
  assert.ok(manifest.contributes.themes.some((item) => item.label === 'Veylora Dark'));
});

test('the upstream Code - OSS source is pinned as a submodule', async () => {
  const modules = await readFile(new URL('../.gitmodules', import.meta.url), 'utf8');
  assert.match(modules, /path = vendor\/code-oss/);
  assert.match(modules, /https:\/\/github\.com\/microsoft\/vscode\.git/);
});
