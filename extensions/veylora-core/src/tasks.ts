import * as vscode from 'vscode';
import { selectWorkspaceFolder } from './workspace';

export interface TaskDefinition {
  label: string;
  type: 'shell';
  command: string;
  args?: string[];
  group?: { kind: string; isDefault?: boolean };
  isBackground?: boolean;
  problemMatcher?: unknown[];
}

const COMMON_TASKS: Record<string, TaskDefinition[]> = {
  python: [
    {
      label: 'Run Python',
      type: 'shell',
      command: 'python',
      args: ['-m', 'pip', 'list'],
      group: { kind: 'build', isDefault: false },
      problemMatcher: []
    }
  ],
  node: [
    {
      label: 'npm install',
      type: 'shell',
      command: 'npm',
      args: ['install'],
      group: { kind: 'build', isDefault: false },
      problemMatcher: []
    },
    {
      label: 'npm test',
      type: 'shell',
      command: 'npm',
      args: ['test'],
      group: { kind: 'test', isDefault: true },
      problemMatcher: []
    }
  ],
  web: [
    {
      label: 'Serve static site',
      type: 'shell',
      command: 'python',
      args: ['-m', 'http.server', '5173'],
      isBackground: true,
      problemMatcher: []
    }
  ]
};

export function defaultTasksForScaffold(scaffoldId?: string): TaskDefinition[] {
  if (!scaffoldId) return [];
  return COMMON_TASKS[scaffoldId] ?? [];
}

export async function ensureTasksJson(
  output: vscode.OutputChannel,
  scaffoldId?: string
): Promise<number> {
  const folder = await selectWorkspaceFolder('Add or update tasks for which folder?');
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder first.');
    return 0;
  }

  const tasksUri = vscode.Uri.joinPath(folder.uri, '.vscode/tasks.json');
  const encoder = new TextEncoder();
  let existing: { version?: string; tasks?: TaskDefinition[] } = { version: '2.0.0', tasks: [] };

  try {
    const raw = await vscode.workspace.fs.readFile(tasksUri);
    const parsed = JSON.parse(new TextDecoder().decode(raw));
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tasks)) {
      existing = parsed;
    }
  } catch {
    // create new
  }

  const toAdd = defaultTasksForScaffold(scaffoldId);
  const existingLabels = new Set((existing.tasks ?? []).map((t) => t.label));
  const added: TaskDefinition[] = [];

  for (const task of toAdd) {
    if (!existingLabels.has(task.label)) {
      added.push(task);
      existingLabels.add(task.label);
    }
  }

  if (added.length === 0 && existing.tasks && existing.tasks.length > 0) {
    output.appendLine(`Tasks already present in ${folder.name}; nothing to add.`);
    void vscode.window.showInformationMessage('Workspace tasks already cover the recommended set.');
    return 0;
  }

  existing.version = existing.version ?? '2.0.0';
  existing.tasks = [...(existing.tasks ?? []), ...added];

  try {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folder.uri, '.vscode'));
  } catch {
    // exists
  }

  await vscode.workspace.fs.writeFile(
    tasksUri,
    encoder.encode(JSON.stringify(existing, null, 2) + '\n')
  );

  output.appendLine(
    `Ensured ${existing.tasks.length} task(s) in ${folder.name} (added ${added.length}).`
  );
  void vscode.window.showInformationMessage(
    added.length === 0
      ? 'Tasks file created or updated.'
      : `Added ${added.length} recommended task(s) to .vscode/tasks.json.`
  );
  return added.length;
}
