import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptsDirectory = resolve(root, 'scripts');

test('every first-party JavaScript launcher script passes Node syntax validation', () => {
  const scripts = readdirSync(scriptsDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.mjs'))
    .map(entry => entry.name)
    .sort();

  assert.ok(scripts.length > 0, 'expected first-party .mjs scripts');

  for (const script of scripts) {
    const path = resolve(scriptsDirectory, script);
    const result = spawnSync(process.execPath, ['--check', path], {
      encoding: 'utf8',
      windowsHide: true
    });

    assert.ifError(result.error);
    assert.equal(
      result.status,
      0,
      `Syntax validation failed for ${script}:\n${result.stderr || result.stdout}`
    );
  }
});
