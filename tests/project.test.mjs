import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootPath = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(
  await readFile(new URL('../extensions/veylora-core/package.json', import.meta.url), 'utf8')
);
const rootManifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('Veylora Core declares dashboard, health, welcome, scaffold, profile, AI and tasks commands', () => {
  const commands = manifest.contributes.commands.map((item) => item.command);
  assert.ok(commands.includes('veylora.openDashboard'));
  assert.ok(commands.includes('veylora.createWorkspaceConfig'));
  assert.ok(commands.includes('veylora.workspaceHealth'));
  assert.ok(commands.includes('veylora.welcome'));
  assert.ok(commands.includes('veylora.newProject'));
  assert.ok(commands.includes('veylora.applyModernProfile'));
  assert.ok(commands.includes('veylora.applyProfileToAll'));
  assert.ok(commands.includes('veylora.configureAI'));
  assert.ok(commands.includes('veylora.createTasks'));
  assert.equal(manifest.main, './dist/extension.js');
  assert.equal(manifest.version, '0.4.6');
});

test('Veylora contributes activity bar view, themes, keybindings and walkthrough', () => {
  assert.ok(manifest.contributes.viewsContainers.activitybar.some((item) => item.id === 'veylora'));
  assert.ok(manifest.contributes.views.veylora.some((item) => item.id === 'veylora.workspace'));
  assert.ok(manifest.contributes.themes.some((item) => item.label === 'Veylora Dark'));
  assert.ok(manifest.contributes.themes.some((item) => item.label === 'Veylora Light'));
  assert.ok(
    manifest.contributes.keybindings.some((item) => item.command === 'veylora.openDashboard')
  );
  assert.ok(
    manifest.contributes.keybindings.some((item) => item.command === 'veylora.newProject')
  );
  assert.ok(
    manifest.contributes.keybindings.some((item) => item.command === 'veylora.workspaceHealth')
  );
  assert.ok(
    manifest.contributes.keybindings.some((item) => item.command === 'veylora.createTasks')
  );
  assert.ok(manifest.contributes.walkthroughs.some((item) => item.id === 'veylora.gettingStarted'));
});

test('modern defaults and optional AI configuration are declared', () => {
  const props = manifest.contributes.configuration.properties;
  assert.ok(props['veylora.modernDefaults.enabled']);
  assert.ok(props['veylora.workspace.autoInitHint']);
  assert.ok(props['veylora.ai.enabled']);
  assert.ok(props['veylora.ai.provider']);
  assert.equal(props['veylora.ai.provider'].default, 'none');
  assert.equal(props['veylora.ai.enabled'].default, false);
});

test('the upstream Code - OSS source is pinned as a submodule', async () => {
  const modules = await readFile(new URL('../.gitmodules', import.meta.url), 'utf8');
  assert.ok(modules.includes('path = vendor/code-oss'));
  assert.ok(modules.includes('url = https://github.com/microsoft/vscode.git'));
});

test('cross-platform development commands point to Node orchestration scripts', () => {
  assert.equal(rootManifest.scripts.bootstrap, 'node scripts/bootstrap.mjs');
  assert.equal(rootManifest.scripts['dev:watch'], 'node scripts/watch.mjs');
  assert.equal(rootManifest.scripts['dev:launch'], 'node scripts/launch.mjs');
  assert.equal(rootManifest.version, '0.4.6');
});

test('all Veylora Node orchestration scripts parse successfully', () => {
  for (const script of [
    'scripts/bootstrap.mjs',
    'scripts/watch.mjs',
    'scripts/launch.mjs',
    'scripts/launcher-paths.mjs',
    'scripts/apply-branding.mjs'
  ]) {
    const result = spawnSync(
      process.execPath,
      ['--check', fileURLToPath(new URL('../' + script, import.meta.url))],
      { cwd: rootPath, encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr || script);
  }
});
