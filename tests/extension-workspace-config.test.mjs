import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspaceConfig,
  escapeHtml,
  isFileNotFoundError
} from '../extensions/veylora-core/src/workspace-config.ts';

test('creates a stable versioned workspace configuration', () => {
  const config = createWorkspaceConfig('Sample Project', '2026-11-26T08:00:00.000Z');

  assert.deepEqual(config, {
    schemaVersion: 1,
    name: 'Sample Project',
    createdAt: '2026-11-26T08:00:00.000Z',
    editor: { formatOnSave: true, tabSize: 2 },
    tasks: []
  });
});

test('creates independent task collections for separate workspaces', () => {
  const first = createWorkspaceConfig('First');
  const second = createWorkspaceConfig('Second');

  first.tasks.push({ label: 'build' });
  assert.deepEqual(second.tasks, []);
});

test('recognizes only the workspace filesystem FileNotFound error code', () => {
  assert.equal(isFileNotFoundError(Object.assign(new Error('missing'), { code: 'FileNotFound' })), true);
  assert.equal(isFileNotFoundError(Object.assign(new Error('denied'), { code: 'NoPermissions' })), false);
  assert.equal(isFileNotFoundError(new Error('missing')), false);
  assert.equal(isFileNotFoundError(null), false);
  assert.equal(isFileNotFoundError('FileNotFound'), false);
});

test('escapes every HTML-sensitive character in workspace labels', () => {
  assert.equal(
    escapeHtml(`<script data-name="x">O'Reilly & friends</script>`),
    '&lt;script data-name=&quot;x&quot;&gt;O&#39;Reilly &amp; friends&lt;/script&gt;'
  );
  assert.equal(escapeHtml('Plain workspace'), 'Plain workspace');
});
