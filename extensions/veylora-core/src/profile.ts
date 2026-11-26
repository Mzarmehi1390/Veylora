import * as vscode from 'vscode';
import { profileEntries } from './product-layer';

export async function applyModernProfile(output: vscode.OutputChannel): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage(
      'Open a project folder before applying the Veylora settings profile.'
    );
    return;
  }
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showWarningMessage(
      'Trust this workspace before applying Veylora defaults.'
    );
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
