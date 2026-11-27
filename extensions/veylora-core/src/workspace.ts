import * as vscode from 'vscode';

/** Return the only open folder, or prompt when the workspace is multi-root. */
export async function selectWorkspaceFolder(
  placeHolder = 'Select a workspace folder'
): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;
  if (folders.length === 1) return folders[0];

  const picked = await vscode.window.showQuickPick(
    folders.map((folder) => ({
      label: folder.name,
      description: folder.uri.fsPath,
      folder
    })),
    {
      placeHolder,
      title: 'Veylora — multi-root workspace'
    }
  );
  return picked?.folder;
}

export function workspaceFolderCount(): number {
  return vscode.workspace.workspaceFolders?.length ?? 0;
}

export function primaryFolderLabel(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return 'No folder opened';
  if (folders.length === 1) return folders[0].name;
  return `${folders[0].name} (+${folders.length - 1} more)`;
}
