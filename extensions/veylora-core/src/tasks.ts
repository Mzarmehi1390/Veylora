import * as vscode from 'vscode';

export interface TaskSpec {
  label: string;
  type: 'shell';
  command: string;
  args?: string[];
  group?: { kind: string; isDefault?: boolean };
  isBackground?: boolean;
  problemMatcher?: unknown[];
}

export function defaultTasksForScaffold(scaffoldId: string | undefined): TaskSpec[] {
  switch (scaffoldId) {
    case 'python':
      return [
        {
          label: 'Run Python app',
          type: 'shell',
          command: 'python',
          args: ['src/main.py'],
          group: { kind: 'build', isDefault: true },
          problemMatcher: []
        }
      ];
    case 'node':
      return [
        {
          label: 'Start Node app',
          type: 'shell',
          command: 'npm',
          args: ['start'],
          group: { kind: 'build', isDefault: true },
          problemMatcher: []
        }
      ];
    case 'web':
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
    default:
      return [
        {
          label: 'Run (placeholder)',
          type: 'shell',
          command: 'echo',
          args: ['Add a real task in .vscode/tasks.json'],
          problemMatcher: []
        }
      ];
  }
}

export function tasksDocument(tasks: TaskSpec[]): string {
  return JSON.stringify({ version: '2.0.0', tasks }, null, 2) + '\n';
}
