import * as vscode from 'vscode';

export interface TaskSignal {
  id: string;
  present: boolean;
  label: string;
  hint?: string;
}

const MARKERS: Array<{ rel: string; id: string; label: string; hint?: string }> = [
  { rel: 'package.json', id: 'node', label: 'Node / npm', hint: 'npm scripts available' },
  { rel: 'pyproject.toml', id: 'python', label: 'Python (pyproject)', hint: 'uv / poetry / pip' },
  { rel: 'requirements.txt', id: 'python-req', label: 'Python requirements' },
  { rel: 'Pipfile', id: 'python-pipenv', label: 'Pipenv' },
  { rel: 'Cargo.toml', id: 'rust', label: 'Rust / Cargo' },
  { rel: 'go.mod', id: 'go', label: 'Go modules' },
  { rel: 'pom.xml', id: 'java-maven', label: 'Maven' },
  { rel: 'build.gradle', id: 'java-gradle', label: 'Gradle' },
  { rel: '.vscode/tasks.json', id: 'vscode-tasks', label: 'VS Code tasks.json' },
  { rel: 'Makefile', id: 'make', label: 'Makefile' },
  { rel: 'justfile', id: 'just', label: 'justfile' },
  { rel: 'deno.json', id: 'deno', label: 'Deno' },
  { rel: 'bun.lockb', id: 'bun', label: 'Bun' }
];

export async function detectTaskSignals(folder: vscode.WorkspaceFolder): Promise<TaskSignal[]> {
  const results: TaskSignal[] = [];
  for (const marker of MARKERS) {
    const uri = vscode.Uri.joinPath(folder.uri, marker.rel);
    try {
      await vscode.workspace.fs.stat(uri);
      results.push({
        id: marker.id,
        present: true,
        label: marker.label,
        hint: marker.hint
      });
    } catch {
      results.push({
        id: marker.id,
        present: false,
        label: marker.label
      });
    }
  }
  return results;
}

export function formatTaskSignals(signals: TaskSignal[]): string[] {
  const present = signals.filter((signal) => signal.present);
  if (present.length === 0) {
    return ['○ No common task markers detected (package.json, pyproject.toml, Cargo.toml, etc.)'];
  }
  const lines = ['Task signals:'];
  for (const signal of present) {
    lines.push(`  ✓ ${signal.label}${signal.hint ? ` — ${signal.hint}` : ''}`);
  }
  return lines;
}

export async function showTaskSignals(output: vscode.OutputChannel): Promise<void> {
  const folder = await vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Detect task signals in which folder?'
  });
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder first.');
    return;
  }

  const signals = await detectTaskSignals(folder);
  const lines = [`Veylora Task Signals — ${folder.name}`, `Path: ${folder.uri.fsPath}`, '', ...formatTaskSignals(signals)];
  output.clear();
  for (const line of lines) output.appendLine(line);
  output.show(true);
  const count = signals.filter((s) => s.present).length;
  void vscode.window.showInformationMessage(
    count === 0
      ? 'No common task markers found in this folder.'
      : `Found ${count} task signal(s). See the Veylora output channel for details.`
  );
}
