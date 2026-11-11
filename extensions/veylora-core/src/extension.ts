import * as vscode from 'vscode';

type DashboardCommand = 'createWorkspaceConfig' | 'showDiagnostics' | 'openSettings';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Veylora');
  const commands = [
    vscode.commands.registerCommand('veylora.openDashboard', async () => {
      const panel = vscode.window.createWebviewPanel(
        'veylora.dashboard',
        'Veylora Dashboard',
        vscode.ViewColumn.One,
        { enableScripts: true, localResourceRoots: [context.extensionUri] }
      );
      panel.webview.html = renderDashboard(panel.webview, context.extensionUri);
      panel.webview.onDidReceiveMessage(
        (message: unknown) => handleDashboardMessage(message, output)
      );
    }),
    vscode.commands.registerCommand('veylora.createWorkspaceConfig', () => initializeWorkspace(output)),
    vscode.commands.registerCommand('veylora.showDiagnostics', () => writeDiagnostics(output)),
    vscode.commands.registerCommand('veylora.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', 'veylora')
    )
  ];

  const view = vscode.window.registerWebviewViewProvider(
    'veylora.workspace',
    new WorkspaceViewProvider(context.extensionUri, output),
    { webviewOptions: { retainContextWhenHidden: true } }
  );
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(code) Veylora';
  statusBar.tooltip = 'Open Veylora Dashboard';
  statusBar.command = 'veylora.openDashboard';
  if (vscode.workspace.getConfiguration('veylora.workspace').get<boolean>('showStatusBarItem', true)) {
    statusBar.show();
  }
  context.subscriptions.push(output, ...commands, view, statusBar);
  output.appendLine('Veylora Core activated.');
}

export function deactivate(): void {
  // Extension resources are disposed through ExtensionContext.subscriptions.
}

class WorkspaceViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly output: vscode.OutputChannel
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
    view.webview.html = renderDashboard(view.webview, this.extensionUri);
    view.webview.onDidReceiveMessage(
      (message: unknown) => handleDashboardMessage(message, this.output)
    );
  }
}

async function handleDashboardMessage(message: unknown, output: vscode.OutputChannel): Promise<void> {
  if (!isDashboardMessage(message)) return;
  switch (message.command) {
    case 'createWorkspaceConfig': await initializeWorkspace(output); break;
    case 'showDiagnostics': writeDiagnostics(output); break;
    case 'openSettings':
      await vscode.commands.executeCommand('workbench.action.openSettings', 'veylora');
      break;
  }
}

function isDashboardMessage(value: unknown): value is { command: DashboardCommand } {
  if (typeof value !== 'object' || value === null || !('command' in value)) return false;
  const command = (value as { command?: unknown }).command;
  return command === 'createWorkspaceConfig' || command === 'showDiagnostics' || command === 'openSettings';
}

async function initializeWorkspace(output: vscode.OutputChannel): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder before initializing a Veylora workspace.');
    return;
  }

  const directory = vscode.Uri.joinPath(folder.uri, '.veylora');
  const configUri = vscode.Uri.joinPath(directory, 'workspace.json');
  try {
    await vscode.workspace.fs.stat(configUri);
    const choice = await vscode.window.showWarningMessage(
      'A Veylora workspace configuration already exists. Replace it?',
      { modal: true },
      'Replace'
    );
    if (choice !== 'Replace') return;
  } catch {
    // A missing file is the expected first-run path.
  }

  const config = {
    schemaVersion: 1,
    name: folder.name,
    createdAt: new Date().toISOString(),
    editor: { formatOnSave: true, tabSize: 2 },
    tasks: []
  };
  try {
    await vscode.workspace.fs.createDirectory(directory);
    await vscode.workspace.fs.writeFile(
      configUri,
      new TextEncoder().encode(JSON.stringify(config, null, 2) + '\n')
    );
    output.appendLine('Initialized workspace: ' + folder.uri.fsPath);
    void vscode.window.showInformationMessage('Veylora workspace initialized.');
    const document = await vscode.workspace.openTextDocument(configUri);
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    output.appendLine('Workspace initialization failed: ' + detail);
    void vscode.window.showErrorMessage('Could not initialize the Veylora workspace: ' + detail);
  }
}

function writeDiagnostics(output: vscode.OutputChannel): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  const version = vscode.extensions.getExtension('veylora.veylora-core')?.packageJSON.version ?? 'development';
  output.clear();
  output.appendLine('Veylora IDE — Runtime Diagnostics');
  output.appendLine('--------------------------------');
  output.appendLine('Veylora Core: ' + version);
  output.appendLine('Code - OSS API: ' + vscode.version);
  output.appendLine('Platform: ' + process.platform + ' (' + process.arch + ')');
  output.appendLine('Node runtime: ' + process.versions.node);
  output.appendLine('Workspace: ' + (folder?.uri.fsPath ?? 'No folder opened'));
  output.appendLine('Workspace folders: ' + (vscode.workspace.workspaceFolders?.length ?? 0));
  output.show(true);
}

function renderDashboard(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = createNonce();
  const icon = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'veylora.svg'));
  const folder = vscode.workspace.workspaceFolders?.[0];
  const name = escapeHtml(folder?.name ?? 'No folder opened');
  const path = escapeHtml(folder?.uri.fsPath ?? 'Open a folder to get started');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Veylora</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; padding: 22px 16px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .brand img { width: 34px; height: 34px; }
    h1 { margin: 0; font-size: 18px; font-weight: 650; }
    .muted { color: var(--vscode-descriptionForeground); font-size: 12px; }
    .card { padding: 14px; margin: 12px 0; border: 1px solid var(--vscode-panel-border); border-radius: 8px; background: var(--vscode-sideBar-background); }
    .card h2 { margin: 0 0 8px; font-size: 13px; }
    .path { overflow-wrap: anywhere; font-size: 11px; color: var(--vscode-descriptionForeground); }
    button { width: 100%; margin-top: 9px; padding: 8px 10px; border: 0; border-radius: 5px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); cursor: pointer; text-align: left; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .footer { margin-top: 22px; font-size: 11px; color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <header class="brand"><img src="${icon}" alt="Veylora"><div><h1>Veylora IDE</h1><div class="muted">Code Beyond Limits.</div></div></header>
  <section class="card"><h2>Current workspace</h2><strong>${name}</strong><p class="path">${path}</p><button data-command="createWorkspaceConfig">Initialize Veylora Workspace</button></section>
  <section class="card"><h2>Developer tools</h2><button data-command="showDiagnostics">Show Runtime Diagnostics</button><button data-command="openSettings">Veylora Settings</button></section>
  <p class="footer">Powered by the open-source Code - OSS workbench.</p>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('[data-command]').forEach((button) => {
      button.addEventListener('click', () => vscode.postMessage({ command: button.dataset.command }));
    });
  </script>
</body>
</html>`;
}

function createNonce(): string {
  const values = new Uint8Array(24);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    };
    return entities[character] ?? character;
  });
}
