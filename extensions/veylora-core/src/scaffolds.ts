import * as vscode from 'vscode';
import {
  mergeTaskDocument,
  parseTaskDocument,
  planWrites,
  type Scaffold,
  type TaskDocument
} from './product-layer';

export async function applyScaffold(
  folder: vscode.Uri,
  scaffold: Scaffold,
  output: vscode.OutputChannel
): Promise<void> {
  const existing = new Set<string>();
  for (const file of scaffold.files) {
    if (await pathExists(vscode.Uri.joinPath(folder, ...file.relativePath.split('/')))) {
      existing.add(file.relativePath);
    }
  }

  const plan = planWrites(scaffold.files, existing);
  const created: string[] = [];
  for (const file of plan.write) {
    const uri = vscode.Uri.joinPath(folder, ...file.relativePath.split('/'));
    const parentParts = file.relativePath.split('/').slice(0, -1);
    if (parentParts.length > 0) {
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folder, ...parentParts));
    }
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(file.contents));
    created.push(file.relativePath);
  }

  const taskNote = await mergeTasks(folder, scaffold, output);
  const summary =
    'Scaffold “' +
    scaffold.label +
    '”: wrote ' +
    created.length +
    ', kept ' +
    plan.skip.length +
    '. ' +
    taskNote;

  output.appendLine(summary);
  if (plan.skip.length > 0) output.appendLine('Kept existing: ' + plan.skip.join(', '));
  void vscode.window.showInformationMessage(summary);

  if (!existing.has(scaffold.entry)) {
    const entry = vscode.Uri.joinPath(folder, ...scaffold.entry.split('/'));
    const document = await vscode.workspace.openTextDocument(entry);
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
  }
}

async function mergeTasks(
  folder: vscode.Uri,
  scaffold: Scaffold,
  output: vscode.OutputChannel
): Promise<string> {
  const vscodeDir = vscode.Uri.joinPath(folder, '.vscode');
  const tasksUri = vscode.Uri.joinPath(vscodeDir, 'tasks.json');
  let existing: TaskDocument | null = null;
  try {
    const bytes = await vscode.workspace.fs.readFile(tasksUri);
    existing = parseTaskDocument(new TextDecoder().decode(bytes));
  } catch (error) {
    if (!isMissingFile(error)) {
      const detail = error instanceof Error ? error.message : String(error);
      output.appendLine(detail);
      return 'Tasks file was left unchanged.';
    }
  }

  const merged = mergeTaskDocument(existing, scaffold.tasks);
  if (merged.added.length === 0) return 'Tasks already present.';

  await vscode.workspace.fs.createDirectory(vscodeDir);
  await vscode.workspace.fs.writeFile(
    tasksUri,
    new TextEncoder().encode(JSON.stringify(merged.document, null, 2) + '\n')
  );
  return 'Added tasks: ' + merged.added.join(', ') + '.';
}

function isMissingFile(error: unknown): boolean {
  if (error instanceof vscode.FileSystemError) return error.code === 'FileNotFound';
  return error instanceof Error && /FileNotFound|ENOENT/i.test(error.message);
}

async function pathExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}
