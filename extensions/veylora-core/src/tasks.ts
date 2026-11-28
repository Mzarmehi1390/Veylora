import * as vscode from 'vscode';
import { selectWorkspaceFolder } from './workspace';

export type ProjectKind = 'node' | 'python' | 'web' | 'unknown';

export interface TaskSuggestion {
  kind: ProjectKind;
  label: string;
  tasks: Array<{ label: string; command: string; args?: string[] }>;
}

const MARKERS: Array<{ kind: ProjectKind; files: string[] }> = [
  { kind: 'node', files: ['package.json'] },
  { kind: 'python', files: ['pyproject.toml', 'requirements.txt', 'setup.py'] },
  { kind: 'web', files: ['index.html', 'public/index.html'] }
];

export async function detectProjectKind(folder: vscode.WorkspaceFolder): Promise<ProjectKind> {
  for (const marker of MARKERS) {
    for (const rel of marker.files) {
      const uri = vscode.Uri.joinPath(folder.uri, rel);
      try {
        await vscode.workspace.fs.stat(uri);
        return marker.kind;
      } catch {
        // continue
      }
    }
  }
  return 'unknown';
}

export function suggestTasks(kind: ProjectKind): TaskSuggestion {
  switch (kind) {
    case 'node':
      return {
        kind,
        label: 'Node / npm',
        tasks: [
          { label: 'npm: install', command: 'npm', args: ['install'] },
          { label: 'npm: test', command: 'npm', args: ['test'] },
          { label: 'npm: start', command: 'npm', args: ['start'] }
        ]
      };
    case 'python':
      return {
        kind,
        label: 'Python',
        tasks: [
          { label: 'python: install', command: 'python', args: ['-m', 'pip', 'install', '-r', 'requirements.txt'] },
          { label: 'python: test', command: 'python', args: ['-m', 'pytest'] },
          { label: 'python: run', command: 'python', args: ['main.py'] }
        ]
      };
    case 'web':
      return {
        kind,
        label: 'Static web',
        tasks: [
          { label: 'serve', command: 'npx', args: ['--yes', 'serve', '.'] }
        ]
      };
    default:
      return {
        kind: 'unknown',
        label: 'Generic',
        tasks: []
      };
  }
}

export function buildTasksJson(suggestion: TaskSuggestion): Record<string, unknown> {
  const tasks = suggestion.tasks.map((t) => ({
    label: t.label,
    type: 'shell',
    command: t.command,
    args: t.args ?? [],
    group: 'build',
    problemMatcher: []
  }));
  return {
    version: '2.0.0',
    tasks
  };
}

export async function ensureTasksConfig(
  folder: vscode.WorkspaceFolder,
  output: vscode.OutputChannel
): Promise<boolean> {
  const tasksUri = vscode.Uri.joinPath(folder.uri, '.vscode/tasks.json');
  try {
    await vscode.workspace.fs.stat(tasksUri);
    output.appendLine('.vscode/tasks.json already present — leaving it unchanged.');
    return false;
  } catch {
    // create
  }

  const kind = await detectProjectKind(folder);
  const suggestion = suggestTasks(kind);
  if (suggestion.tasks.length === 0) {
    output.appendLine('No automatic task suggestions for this folder kind.');
    return false;
  }

  const content = JSON.stringify(buildTasksJson(suggestion), null, 2) + '\n';
  const dir = vscode.Uri.joinPath(folder.uri, '.vscode');
  try {
    await vscode.workspace.fs.createDirectory(dir);
  } catch {
    // exists
  }
  await vscode.workspace.fs.writeFile(tasksUri, new TextEncoder().encode(content));
  output.appendLine(`Wrote .vscode/tasks.json (${suggestion.label}) for ${folder.name}.`);
  return true;
}

export async function configureTasks(output: vscode.OutputChannel): Promise<void> {
  const folder = await selectWorkspaceFolder('Configure tasks for which folder?');
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder first.');
    return;
  }

  const created = await ensureTasksConfig(folder, output);
  void vscode.window.showInformationMessage(
    created
      ? 'Veylora wrote a starter .vscode/tasks.json for this folder.'
      : 'Tasks configuration already present or no automatic suggestions available.'
  );
}
