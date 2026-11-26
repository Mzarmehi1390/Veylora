import * as vscode from 'vscode';

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
  'workbench.list.smoothScrolling': true,
  'workbench.startupEditor': 'none',
  'files.trimTrailingWhitespace': true,
  'files.insertFinalNewline': true,
  'files.watcherExclude': {
    '**/.git/objects/**': true,
    '**/.git/subtree-cache/**': true,
    '**/node_modules/**': true,
    '**/.venv/**': true,
    '**/venv/**': true,
    '**/dist/**': true
  },
  'search.exclude': {
    '**/node_modules': true,
    '**/.venv': true,
    '**/venv': true,
    '**/dist': true
  },
  'explorer.compactFolders': false,
  'telemetry.telemetryLevel': 'off',
  'git.autofetch': true
};

export function profileEntries(): Array<[string, unknown]> {
  return Object.entries(MODERN_PROFILE).map(([key, value]) => [
    key,
    JSON.parse(JSON.stringify(value)) as unknown
  ]);
}

export async function applyModernProfile(output: vscode.OutputChannel): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage(
      'Open a project folder before applying the Veylora settings profile.'
    );
    return;
  }
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showWarningMessage('Trust this workspace before applying Veylora defaults.');
    return;
  }

  const config = vscode.workspace.getConfiguration(undefined, folder.uri);
  const updated: string[] = [];
  try {
    for (const [key, value] of profileEntries()) {
      const inspected = config.inspect(key);
      if (JSON.stringify(inspected?.workspaceFolderValue) === JSON.stringify(value)) continue;
      await config.update(key, value, vscode.ConfigurationTarget.WorkspaceFolder);
      updated.push(key);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    output.appendLine('Modern profile failed: ' + detail);
    void vscode.window.showErrorMessage('Could not apply the Veylora profile: ' + detail);
    return;
  }

  output.appendLine(
    'Modern profile applied to ' + folder.uri.fsPath + ' (' + updated.length + ' settings).'
  );
  for (const key of updated) output.appendLine('  ' + key);
  void vscode.window.showInformationMessage(
    updated.length === 0
      ? 'Veylora modern profile already matches this workspace folder.'
      : 'Veylora modern profile applied (' +
          updated.length +
          ' workspace settings). Telemetry is off for this folder.'
  );
}
