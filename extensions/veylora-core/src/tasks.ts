export interface TaskDefinition {
  label: string;
  type: string;
  command?: string;
  args?: string[];
  group?: string | { kind: string; isDefault?: boolean };
  problemMatcher?: string | string[];
  presentation?: Record<string, unknown>;
  dependsOn?: string | string[];
}

export interface TasksDocument {
  version: string;
  tasks: TaskDefinition[];
}

export function emptyTasksDocument(): TasksDocument {
  return { version: '2.0.0', tasks: [] };
}

export function starterTasksFor(scaffoldId: string | undefined): TaskDefinition[] {
  switch (scaffoldId) {
    case 'python':
      return [
        {
          label: 'Python: Run',
          type: 'shell',
          command: 'python',
          args: ['${file}'],
          group: { kind: 'build', isDefault: true },
          problemMatcher: []
        },
        {
          label: 'Python: Create venv',
          type: 'shell',
          command: 'python',
          args: ['-m', 'venv', '.venv']
        }
      ];
    case 'node':
      return [
        {
          label: 'npm: start',
          type: 'npm',
          command: 'start',
          group: { kind: 'build', isDefault: true },
          problemMatcher: []
        },
        {
          label: 'npm: test',
          type: 'npm',
          command: 'test'
        },
        {
          label: 'npm: install',
          type: 'npm',
          command: 'install'
        }
      ];
    case 'web':
      return [
        {
          label: 'Web: Open index.html',
          type: 'shell',
          command: 'echo',
          args: ['Open index.html in a browser'],
          group: 'none'
        }
      ];
    default:
      return [
        {
          label: 'Veylora: Echo',
          type: 'shell',
          command: 'echo',
          args: ['Veylora tasks ready']
        }
      ];
  }
}

export function mergeTasks(
  existing: TasksDocument | undefined,
  incoming: TaskDefinition[]
): TasksDocument {
  const base = existing && Array.isArray(existing.tasks) ? existing : emptyTasksDocument();
  const labels = new Set(base.tasks.map((t) => t.label));
  const added = incoming.filter((t) => !labels.has(t.label));
  return {
    version: base.version || '2.0.0',
    tasks: [...base.tasks, ...added]
  };
}
