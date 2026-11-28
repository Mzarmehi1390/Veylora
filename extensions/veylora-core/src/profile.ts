import * as vscode from 'vscode';
import { selectWorkspaceFolder } from './workspace';

export const MODERN_PROFILE: Record<string, unknown> = {
  'editor.formatOnSave': true,
  'editor.tabSize': 2,
  'editor.insertSpaces': true,
  'editor.wordWrap': 'on',
  'editor.minimap.enabled': false,
  'editor.stickyScroll.enabled': true,
  'editor.bracketPairColorization.enabled': true,
  'editor.guides.bracketPairs': 'active',
  'editor.smoothScrolling': true,
  'editor.cursorSmoothCaretAnimation': 'on',
  'editor.linkedEditing': true,
  'editor.renderWhitespace': 'selection',
  'editor.largeFileOptimizations': true,
  'editor.fontLigatures': true,
  'editor.unicodeHighlight.ambiguousCharacters': true,
  'workbench.list.smoothScrolling': true,
  'workbench.startupEditor': 'none',
  'workbench.editor.enablePreview': false,
  'workbench.editor.enablePreviewFromQuickOpen': false,
  'workbench.editor.revealIfOpen': true,
  'files.trimTrailingWhitespace': true,
  'files.insertFinalNewline': true,
  'files.autoSave': 'afterDelay',
  'files.watcherExclude': {
    '**/.git/objects/**': true,
    '**/.git/subtree-cache/**': true,
    '**/node_modules/**': true,
    '**/.venv/**': true,
    '**/venv/**': true,
    '**/dist/**': true,
    '**/.tox/**': true,
    '**/__pycache__/**': true
  },
  'search.exclude': {
    '**/node_modules': true,
    '**/.venv': true,
    '**/venv': true,
    '**/dist': true,
    '**/.tox': true,
    '**/__pycache__': true
  },
  'explorer.compactFolders': false,
  'telemetry.telemetryLevel': 'off',
  'update.mode': 'manual',
  'extensions.autoUpdate': false,
  'extensions.autoCheckUpdates': false,
  'git.autofetch': true,
  'git.confirmSync': false
};

export function profileEntries(): Array<[string, unknown]> {
  return Object.entries(MODERN_PROFILE).map(([key, value]) => [
    key,
    JSON.parse(JSON.stringify(value)) as unknown
  ]);
}

async function applyToFolder(
  folder: vscode.WorkspaceFolder,
  output: vscode.OutputChannel
): Promise<number> {
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showWarningMessage('Trust this workspace before applying Veylora defaults.');
    return 0;
  }

  const config = vscode.workspace.getConfiguration(undefined, folder.uri);
  const updated: string[] = [];
  for (const [key, value] of profileEntries()) {
    const inspected = config.inspect(key);
    if (JSON.stringify(inspected?.workspaceFolderValue) === JSON.stringify(value)) continue;
    await config.update(key, value, vscode.ConfigurationTarget.WorkspaceFolder);
    updated.push(key);
  }
  output.appendLine(
    'Modern profile applied to ' + folder.uri.fsPath + ' (' + updated.length + ' settings).'
  );
  for (const key of updated) output.appendLine('  ' + key);
  return updated.length;
}

export async function applyModernProfile(output: vscode.OutputChannel): Promise<void> {
  const folder = await selectWorkspaceFolder('Apply modern profile to which folder?');
  if (!folder) {
    void vscode.window.showWarningMessage(
      'Open a project folder before applying the Veylora settings profile.'
    );
    return;
  }

  try {
    const updated = await applyToFolder(folder, output);
    void vscode.window.showInformationMessage(
      updated === 0
        ? 'Veylora modern profile already matches this workspace folder.'
        : 'Veylora modern profile applied (' +
            updated +
            ' workspace settings). Telemetry is off for this folder.'
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    output.appendLine('Modern profile failed: ' + detail);
    void vscode.window.showErrorMessage('Could not apply the Veylora profile: ' + detail);
  }
}

export async function applyModernProfileToAll(output: vscode.OutputChannel): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    void vscode.window.showWarningMessage('Open at least one project folder first.');
    return;
  }

  let total = 0;
  try {
    for (const folder of folders) {
      total += await applyToFolder(folder, output);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    output.appendLine('Modern profile (all) failed: ' + detail);
    void vscode.window.showErrorMessage('Could not apply the Veylora profile: ' + detail);
    return;
  }

  void vscode.window.showInformationMessage(
    'Veylora modern profile applied across ' + folders.length + ' folder(s) (' + total + ' settings updated).'
  );
}
