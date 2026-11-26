import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODERN_PROFILE,
  SCAFFOLDS,
  mergeTaskDocument,
  parseTaskDocument,
  planWrites,
  scaffoldById
} from '../extensions/veylora-core/src/product-layer.ts';

const FORBIDDEN = [
  'marketplace.visualstudio.com',
  'defaultChatAgent',
  'telemetry.vscode',
  'https://dc.services.visualstudio.com'
];

test('scaffolds are python, node and web and never overwrite by plan', () => {
  assert.deepEqual(
    SCAFFOLDS.map((scaffold) => scaffold.id),
    ['python', 'node', 'web']
  );
  for (const scaffold of SCAFFOLDS) {
    assert.equal(scaffoldById(scaffold.id), scaffold);
    const paths = scaffold.files.map((file) => file.relativePath);
    assert.ok(paths.includes(scaffold.entry));
    assert.equal(new Set(paths).size, paths.length);
    for (const file of scaffold.files) {
      assert.ok(file.contents.trim().length > 0);
      for (const needle of FORBIDDEN) {
        assert.equal(file.contents.includes(needle), false, scaffold.id + ' ' + file.relativePath);
      }
    }
    const existing = new Set([scaffold.entry]);
    const plan = planWrites(scaffold.files, existing);
    assert.ok(plan.skip.includes(scaffold.entry));
    assert.equal(
      plan.write.some((file) => file.relativePath === scaffold.entry),
      false
    );
    assert.ok(scaffold.tasks.length > 0);
    assert.ok(scaffold.tasks.every((task) => task.label && task.command && Array.isArray(task.args)));
  }
});

test('scaffold plans reject path traversal', () => {
  assert.throws(() =>
    planWrites([{ relativePath: '../secret', contents: 'no' }], new Set())
  );
  assert.throws(() =>
    planWrites([{ relativePath: 'nested/../../nope', contents: 'no' }], new Set())
  );
});

test('task recipes append without replacing existing labels', () => {
  const python = scaffoldById('python');
  assert.ok(python);
  const created = mergeTaskDocument(null, python.tasks);
  assert.deepEqual(created.added, ['Run Python']);
  assert.equal(created.document.version, '2.0.0');

  const again = mergeTaskDocument(created.document, python.tasks);
  assert.deepEqual(again.added, []);
  assert.deepEqual(again.skipped, ['Run Python']);
  assert.equal(again.document.tasks.length, 1);

  const parsed = parseTaskDocument(JSON.stringify(created.document));
  assert.equal(parsed.tasks[0].label, 'Run Python');
  assert.throws(() => parseTaskDocument('{ "tasks": ['));
  assert.throws(() => parseTaskDocument('[]'));
});

test('modern profile is workspace-scoped, privacy-first and performance-aware', () => {
  assert.equal(MODERN_PROFILE['telemetry.telemetryLevel'], 'off');
  assert.equal(MODERN_PROFILE['editor.formatOnSave'], true);
  assert.equal(MODERN_PROFILE['editor.minimap.enabled'], false);
  assert.equal(MODERN_PROFILE['editor.largeFileOptimizations'], true);
  assert.equal(MODERN_PROFILE['files.watcherExclude']['**/node_modules/**'], true);
  assert.equal(MODERN_PROFILE['search.exclude']['**/.venv'], true);
  assert.equal(Object.hasOwn(MODERN_PROFILE, 'defaultChatAgent'), false);
});
