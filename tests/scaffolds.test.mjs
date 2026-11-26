import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyScaffoldMarker,
  buildWorkspaceConfig,
  displayProjectName,
  isSafeRelativePath,
  listScaffolds,
  planScaffold,
  renderScaffold,
  sanitizeProjectName
} from '../extensions/veylora-core/src/scaffolds.ts';

const context = { projectName: 'My App', displayName: 'My App' };

test('project templates are Python, Node, and local web', () => {
  const scaffolds = listScaffolds();
  assert.deepEqual(
    scaffolds.map((item) => item.id),
    ['python', 'node', 'web']
  );
  assert.equal(scaffolds.find((item) => item.id === 'python')?.openPath, 'src/main.py');
  assert.equal(scaffolds.find((item) => item.id === 'node')?.openPath, 'src/index.js');
  assert.equal(scaffolds.find((item) => item.id === 'web')?.openPath, 'index.html');
});

test('templates stay inside the folder and do not call third parties', () => {
  for (const scaffold of listScaffolds()) {
    const files = renderScaffold(scaffold.id, context);
    assert.ok(files.length > 0);
    for (const file of files) {
      assert.equal(isSafeRelativePath(file.relativePath), true, file.relativePath);
      assert.equal(file.contents.endsWith('\n'), true, file.relativePath);
      assert.equal(file.contents.includes('telemetry'), false, file.relativePath);
      assert.equal(file.contents.includes('marketplace.visualstudio.com'), false);
      assert.equal(/https?:\/\/(?!127\.0\.0\.1)/.test(file.contents), false, file.relativePath);
    }
  }
});

test('existing files are skipped and nothing is overwritten', () => {
  const files = renderScaffold('node', context);
  const plan = planScaffold(files, ['package.json', 'README.md']);
  assert.deepEqual(plan.skip, ['package.json', 'README.md']);
  assert.equal(
    plan.create.some((file) => file.relativePath === 'package.json'),
    false
  );
  assert.equal(
    plan.create.some((file) => file.relativePath === 'src/index.js'),
    true
  );
});

test('unsafe scaffold paths are rejected', () => {
  assert.equal(isSafeRelativePath('../secret'), false);
  assert.equal(isSafeRelativePath('/etc/passwd'), false);
  assert.throws(() => planScaffold([{ relativePath: '../secret', contents: 'no\n' }], []));
});

test('node and python manifests are valid and dependency-free', () => {
  const nodePkg = JSON.parse(
    renderScaffold('node', context).find((file) => file.relativePath === 'package.json')?.contents ?? '{}'
  );
  assert.equal(nodePkg.name, 'my-app');
  assert.equal(nodePkg.private, true);
  assert.equal(nodePkg.type, 'module');
  assert.equal(nodePkg.dependencies, undefined);
  assert.equal(nodePkg.scripts.start, 'node src/index.js');

  const python = renderScaffold('python', context).find((file) => file.relativePath === 'pyproject.toml');
  assert.ok(python?.contents.includes('name = "my-app"'));
  assert.equal(python?.contents.includes('dependencies'), false);
});

test('web scaffold escapes the folder name and stays local', () => {
  const files = renderScaffold('web', { projectName: 'A&B', displayName: 'A&B <script>' });
  const html = files.find((file) => file.relativePath === 'index.html')?.contents ?? '';
  const escapedHeading = 'A&' + 'amp;B ' + '&' + 'lt;script' + '&' + 'gt;';
  assert.equal(html.includes('A&B <script>'), false);
  assert.ok(html.includes('<h1>' + escapedHeading + '</h1>'));
  assert.ok(html.includes('src="./main.js"'));
  assert.equal(html.includes('http'), false);
});

test('project names become safe package slugs', () => {
  assert.equal(sanitizeProjectName('Hello World'), 'hello-world');
  assert.equal(sanitizeProjectName('  '), 'veylora-app');
  assert.equal(sanitizeProjectName('../etc'), 'etc');
  assert.equal(displayProjectName('  '), 'Veylora App');
});

test('workspace scaffold marker preserves existing keys', () => {
  const merged = applyScaffoldMarker(
    { schemaVersion: 2, name: 'demo', notes: 'keep' },
    'web',
    '2026-01-01T00:00:00.000Z'
  );
  assert.equal(merged.ok, true);
  if (!merged.ok) return;
  assert.equal(merged.document.name, 'demo');
  assert.equal(merged.document.notes, 'keep');
  assert.deepEqual(merged.document.scaffold, {
    id: 'web',
    appliedAt: '2026-01-01T00:00:00.000Z',
    managedBy: 'veylora-core'
  });
  assert.equal(applyScaffoldMarker(['nope'], 'web', '2026-01-01T00:00:00.000Z').ok, false);
});

test('initialized workspace config keeps schema v2 modern defaults', () => {
  const modern = buildWorkspaceConfig({
    name: 'demo',
    createdAt: '2026-01-01T00:00:00.000Z',
    modern: true,
    scaffoldId: 'python',
    scaffoldAppliedAt: '2026-01-01T00:00:00.000Z'
  });
  assert.equal(modern.schemaVersion, 2);
  assert.equal(modern.product, 'Veylora IDE');
  assert.equal(modern.editor && modern.editor.minimap.enabled, false);
  assert.equal(modern.scaffold.id, 'python');

  const classic = buildWorkspaceConfig({
    name: 'demo',
    createdAt: '2026-01-01T00:00:00.000Z',
    modern: false
  });
  assert.deepEqual(classic.editor, { formatOnSave: true, tabSize: 2 });
  assert.equal(classic.scaffold, undefined);
});
