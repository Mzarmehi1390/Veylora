import * as vscode from 'vscode';

const TASKS_REL = '.vscode/tasks.json';

export interface BasicTask {
  label: string;
  type: 'shell';
  command: string;
  args?: string[];
  group?: { kind: string; isDefault?: boolean };
  isBackground?: boolean;
  problemMatcher?: unknown[];
}

export function defaultTasksDocument(tasks: BasicTask[]): string {
  return JSON.stringify({ version: '2.0.0', tasks }, null, 2) + '\n';
}

/** Detect a reasonable starter task set from common project markers. */
export async function suggestTasks(folder: vscode.WorkspaceFolder): Promise<BasicTask[]> {
  const root = folder.uri;
  const exists = async (rel: string): Promise<boolean> => {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, rel));
      return true;
    } catch {
      return false;
    }
  };

  if (await exists('package.json')) {
    return [
      {
        label: 'Start',
        type: 'shell',
        command: 'npm',
        args: ['start'],
        group: { kind: 'build', isDefault: true },
        problemMatcher: []
      },
      {
        label: 'Test',
        type: 'shell',
        command: 'npm',
        args: ['test'],
        group: { kind: 'test' },
        problemMatcher: []
      }
    ];
  }

  if (await exists('pyproject.toml') || await exists('src/main.py')) {
    return [
      {
        label: 'Run Python',
        type: 'shell',
        command: 'python',
        args: ['src/main.py'],
        group: { kind: 'build', isDefault: true },
        problemMatcher: []
      }
    ];
  }

  if (await exists('index.html')) {
    return [
      {
        label: 'Serve static site',
        type: 'shell',
        command: 'python',
        args: ['-m', 'http.server', '5173'],
        isBackground: true,
        problemMatcher: []
      }
    ];
  }

  return [
    {
      label: 'Echo project path',
      type: 'shell',
      command: process.platform === 'win32' ? 'echo' : 'echo',
      args: [folder.uri.fsPath],
      group: { kind: 'build', isDefault: true },
      problemMatcher: []
    }
  ];
}

export async function tasksFileExists(folder: vscode.WorkspaceFolder): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.joinPath(folder.uri, TASKS_REL));
    return true;
  } catch {
    return false;
  }
}
