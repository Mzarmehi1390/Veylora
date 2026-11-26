import * as vscode from 'vscode';
import {
  applyScaffoldMarker,
  buildWorkspaceConfig,
  displayProjectName,
  listScaffolds,
  planScaffold,
  renderScaffold,
  sanitizeProjectName,
  scaffoldOpenPath,
  type ScaffoldId
} from './scaffolds';

type DashboardCommand =
  | 'createWorkspaceConfig'
  | 'showDiagnostics'
  | 'openSettings'
  | 'workspaceHealth'
  | 'welcome'
  | 'newProject';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Veylora');

  const commands = [
    vscode.commands.registerCommand('veylora.openDashboard', () => openDashboardPanel(context, output)),
    vscode.commands.registerCommand('veylora.createWorkspaceConfig', () => initializeWorkspace(output)),
    vscode.commands.registerCommand('veylora.showDiagnostics', () => writeDiagnostics(output)),
    vscode.commands.registerCommand('veylora.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', 'veylora')
    ),
    vscode.commands.registerCommand('veylora.welcome', () => openDashboardPanel(context, output)),
    vscode.commands.registerCommand('veylora.workspaceHealth', () => runWorkspaceHealth(output)),
    vscode.commands.registerCommand('veylora.newProject', () => createProjectFromTemplate(output))
  ];

  const view = vscode.window.registerWebviewViewProvider(
    'veylora.workspace',
    new WorkspaceViewProvider(context.extensionUri, output),
    { webviewOptions: { retainContextWhenHidden: true } }
  );

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(code) Veylora';
  statusBar.tooltip = 'Open Veylora Dashboard (Ctrl+Shift+V)';
  statusBar.command = 'veylora.openDashboard';
  if (vscode.workspace.getConfiguration('veylora.workspace').get<boolean>('showStatusBarItem', true)) {
    statusBar.show();
  }

  context.subscriptions.push(output, ...commands, view, statusBar);
  output.appendLine('Veylora Core 0.4 activated.');

  void maybeHintWorkspaceInit(context, output);
}

export function deactivate(): void {
  // Resources disposed via ExtensionContext.subscriptions.
}

class WorkspaceViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly output: vscode.OutputChannel
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
    view.webview.html = renderDashboard(view.webview, this.extensionUri);
    view.webview.onDidReceiveMessage((message: unknown) =>
      handleDashboardMessage(message, this.output)
    );
  }
}

function openDashboardPanel(context: vscode.ExtensionContext, output: vscode.OutputChannel): void {
  const panel = vscode.window.createWebviewPanel(
    'veylora.dashboard',
    'Veylora Dashboard',
    vscode.ViewColumn.One,
    { enableScripts: true, localResourceRoots: [context.extensionUri] }
  );
  panel.webview.html = renderDashboard(panel.webview, context.extensionUri);
  panel.webview.onDidReceiveMessage((message: unknown) => handleDashboardMessage(message, output));
}

async function handleDashboardMessage(message: unknown, output: vscode.OutputChannel): Promise<void> {
  if (!isDashboardMessage(message)) return;
  switch (message.command) {
    case 'createWorkspaceConfig':
      await initializeWorkspace(output);
      break;
    case 'showDiagnostics':
      writeDiagnostics(output);
      break;
    case 'openSettings':
      await vscode.commands.executeCommand('workbench.action.openSettings', 'veylora');
      break;
    case 'workspaceHealth':
      await runWorkspaceHealth(output);
      break;
    case 'newProject':
      await createProjectFromTemplate(output);
      break;
    case 'welcome':
      break;
  }
}

function isDashboardMessage(value: unknown): value is { command: DashboardCommand } {
  if (typeof value !== 'object' || value === null || !('command' in value)) return false;
  const command = (value as { command?: unknown }).command;
  return (
    command === 'createWorkspaceConfig' ||
    command === 'showDiagnostics' ||
    command === 'openSettings' ||
    command === 'workspaceHealth' ||
    command === 'welcome' ||
    command === 'newProject'
  );
}

async function maybeHintWorkspaceInit(
  context: vscode.ExtensionContext,
  output: vscode.OutputChannel
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('veylora.workspace');
  if (!cfg.get<boolean>('autoInitHint', true)) return;

  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return;

  const hinted = context.workspaceState.get<boolean>('veylora.initHintShown');
  if (hinted) return;

  const configUri = vscode.Uri.joinPath(folder.uri, '.veylora', 'workspace.json');
  try {
    await vscode.workspace.fs.stat(configUri);
    return;
  } catch {
    // Missing config — offer init once per workspace.
  }

  await context.workspaceState.update('veylora.initHintShown', true);
  const choice = await vscode.window.showInformationMessage(
    'This folder is not a Veylora workspace yet. Initialize modern defaults?',
    'Initialize',
    'Not now'
  );
  if (choice === 'Initialize') {
    await initializeWorkspace(output);
  }
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
    // First-run path.
  }

  const modern = vscode.workspace
    .getConfiguration('veylora')
    .get<boolean>('modernDefaults.enabled', true);

  const config = buildWorkspaceConfig({
    name: folder.name,
    createdAt: new Date().toISOString(),
    modern
  });

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

async function createProjectFromTemplate(output: vscode.OutputChannel): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder before creating a Veylora project.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    listScaffolds().map((item) => ({
      label: item.label,
      description: item.id,
      detail: item.detail,
      scaffoldId: item.id
    })),
    {
      placeHolder: 'Choose a privacy-first starter',
      title: 'New project from template'
    }
  );
  if (!picked) return;

  const files = renderScaffold(picked.scaffoldId, {
    projectName: sanitizeProjectName(folder.name),
    displayName: displayProjectName(folder.name)
  });
  const existing: string[] = [];
  for (const file of files) {
    try {
      await vscode.workspace.fs.stat(relativeUri(folder.uri, file.relativePath));
      existing.push(file.relativePath);
    } catch {
      // Missing file is the create path.
    }
  }

  const plan = planScaffold(files, existing);
  if (plan.skip.length > 0 && plan.create.length > 0) {
    const choice = await vscode.window.showWarningMessage(
      `Create ${plan.create.length} file(s)? ${plan.skip.length} existing file(s) will be left unchanged.`,
      { modal: true },
      'Create'
    );
    if (choice !== 'Create') return;
  }

  try {
    for (const file of plan.create) {
      const uri = relativeUri(folder.uri, file.relativePath);
      await ensureParentDirectory(folder.uri, file.relativePath);
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(file.contents));
    }
    await recordScaffoldChoice(folder, picked.scaffoldId, output);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    output.appendLine('Project scaffold failed: ' + detail);
    void vscode.window.showErrorMessage('Could not create the Veylora project: ' + detail);
    return;
  }

  const wrote = plan.create.map((file) => file.relativePath).join(', ') || '(none)';
  output.appendLine('Scaffold ' + picked.scaffoldId + ' wrote: ' + wrote);
  if (plan.skip.length > 0) {
    output.appendLine('Skipped existing: ' + plan.skip.join(', '));
  }

  if (plan.create.length === 0) {
    void vscode.window.showInformationMessage('Template files already exist and were left unchanged.');
  } else {
    void vscode.window.showInformationMessage('Veylora ' + picked.label + ' project created.');
  }

  const openRelative = scaffoldOpenPath(picked.scaffoldId);
  if (plan.create.some((file) => file.relativePath === openRelative) || plan.skip.includes(openRelative)) {
    const document = await vscode.workspace.openTextDocument(relativeUri(folder.uri, openRelative));
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
  }
}

async function recordScaffoldChoice(
  folder: vscode.WorkspaceFolder,
  scaffoldId: ScaffoldId,
  output: vscode.OutputChannel
): Promise<void> {
  const directory = vscode.Uri.joinPath(folder.uri, '.veylora');
  const configUri = vscode.Uri.joinPath(directory, 'workspace.json');
  const appliedAt = new Date().toISOString();
  let raw: Uint8Array | undefined;
  try {
    raw = await vscode.workspace.fs.readFile(configUri);
  } catch {
    raw = undefined;
  }

  let document: Record<string, unknown>;
  if (!raw) {
    const modern = vscode.workspace.getConfiguration('veylora').get<boolean>('modernDefaults.enabled', true);
    document = buildWorkspaceConfig({
      name: folder.name,
      createdAt: appliedAt,
      modern,
      scaffoldId,
      scaffoldAppliedAt: appliedAt
    });
  } else {
    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      output.appendLine('Scaffold marker skipped: workspace.json is not valid JSON');
      void vscode.window.showWarningMessage(
        'Project files were created, but .veylora/workspace.json could not be updated.'
      );
      return;
    }
    const merged = applyScaffoldMarker(parsed, scaffoldId, appliedAt);
    if (!merged.ok) {
      output.appendLine('Scaffold marker skipped: ' + merged.reason);
      void vscode.window.showWarningMessage(
        'Project files were created, but .veylora/workspace.json could not be updated.'
      );
      return;
    }
    document = merged.document;
  }

  await vscode.workspace.fs.createDirectory(directory);
  await vscode.workspace.fs.writeFile(configUri, new TextEncoder().encode(JSON.stringify(document, null, 2) + '\n'));
}

function relativeUri(folder: vscode.Uri, relativePath: string): vscode.Uri {
  const parts = relativePath.split('/');
  return vscode.Uri.joinPath(folder, ...parts);
}

async function ensureParentDirectory(folder: vscode.Uri, relativePath: string): Promise<void> {
  const parts = relativePath.split('/').slice(0, -1);
  let current = folder;
  for (const part of parts) {
    current = vscode.Uri.joinPath(current, part);
    try {
      await vscode.workspace.fs.stat(current);
    } catch {
      await vscode.workspace.fs.createDirectory(current);
    }
  }
}

async function runWorkspaceHealth(output: vscode.OutputChannel): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  output.clear();
  output.appendLine('Veylora — Workspace Health');
  output.appendLine('===========================');

  if (!folder) {
    output.appendLine('No folder opened.');
    output.show(true);
    void vscode.window.showWarningMessage('Open a folder to run a workspace health check.');
    return;
  }

  const checks: string[] = [];
  checks.push('Folder: ' + folder.uri.fsPath);

  const configUri = vscode.Uri.joinPath(folder.uri, '.veylora', 'workspace.json');
  try {
    await vscode.workspace.fs.stat(configUri);
    checks.push('[ok] .veylora/workspace.json present');
  } catch {
    checks.push('[!] .veylora/workspace.json missing — run “Veylora: Initialize Workspace”');
  }

  const gitUri = vscode.Uri.joinPath(folder.uri, '.git');
  try {
    await vscode.workspace.fs.stat(gitUri);
    checks.push('[ok] Git repository detected');
  } catch {
    checks.push('[·] No .git directory (optional)');
  }

  const packageJson = vscode.Uri.joinPath(folder.uri, 'package.json');
  const pyproject = vscode.Uri.joinPath(folder.uri, 'pyproject.toml');
  const requirements = vscode.Uri.joinPath(folder.uri, 'requirements.txt');
  let projectKind = 'generic';
  try {
    await vscode.workspace.fs.stat(packageJson);
    projectKind = 'Node / JavaScript';
    checks.push('[ok] package.json found');
  } catch {
    /* ignore */
  }
  try {
    await vscode.workspace.fs.stat(pyproject);
    projectKind = projectKind === 'generic' ? 'Python' : projectKind + ' + Python';
    checks.push('[ok] pyproject.toml found');
  } catch {
    try {
      await vscode.workspace.fs.stat(requirements);
      projectKind = projectKind === 'generic' ? 'Python' : projectKind + ' + Python';
      checks.push('[ok] requirements.txt found');
    } catch {
      /* ignore */
    }
  }
  checks.push('Detected project kind: ' + projectKind);
  checks.push('Open editors: ' + vscode.window.visibleTextEditors.length);
  checks.push('Workspace folders: ' + (vscode.workspace.workspaceFolders?.length ?? 0));

  for (const line of checks) output.appendLine(line);
  output.show(true);
  void vscode.window.showInformationMessage('Workspace health check complete — see Veylora output channel.');
}

function writeDiagnostics(output: vscode.OutputChannel): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  const version =
    vscode.extensions.getExtension('veylora.veylora-core')?.packageJSON.version ?? 'development';
  output.clear();
  output.appendLine('Veylora IDE — Runtime Diagnostics');
  output.appendLine('--------------------------------');
  output.appendLine('Veylora Core: ' + version);
  output.appendLine('Code - OSS API: ' + vscode.version);
  output.appendLine('Platform: ' + process.platform + ' (' + process.arch + ')');
  output.appendLine('Node runtime: ' + process.versions.node);
  output.appendLine('Workspace: ' + (folder?.uri.fsPath ?? 'No folder opened'));
  output.appendLine('Workspace folders: ' + (vscode.workspace.workspaceFolders?.length ?? 0));
  output.appendLine('Extension mode: ' + vscode.env.appName);
  output.appendLine('UI kind: ' + vscode.env.uiKind);
  output.appendLine('Language: ' + vscode.env.language);
  output.show(true);
}

function renderDashboard(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = createNonce();
  const icon = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'veylora.svg'));
  const folder = vscode.workspace.workspaceFolders?.[0];
  const name = escapeHtml(folder?.name ?? 'No folder opened');
  const path = escapeHtml(folder?.uri.fsPath ?? 'Open a folder to get started');
  const api = escapeHtml(vscode.version);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Veylora</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      padding: 20px 16px 28px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      background: transparent;
    }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .brand img { width: 36px; height: 36px; }
    h1 { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: 0.2px; }
    .muted { color: var(--vscode-descriptionForeground); font-size: 12px; }
    .grid { display: grid; gap: 12px; }
    .card {
      padding: 14px 14px 12px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      background: color-mix(in srgb, var(--vscode-sideBar-background) 92%, #7167df 8%);
    }
    .card h2 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
    .path { overflow-wrap: anywhere; font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0 0 4px; }
    .meta { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
    button {
      width: 100%;
      margin-top: 8px;
      padding: 9px 11px;
      border: 0;
      border-radius: 6px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      cursor: pointer;
      text-align: left;
      font-size: 12px;
    }
    button.secondary {
      background: transparent;
      border: 1px solid var(--vscode-panel-border);
      color: var(--vscode-foreground);
    }
    button:hover { filter: brightness(1.08); }
    .footer { margin-top: 18px; font-size: 11px; color: var(--vscode-descriptionForeground); line-height: 1.45; }
    .pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      background: #7167df33;
      color: #c5bfff;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <header class="brand">
    <img src="${icon}" alt="Veylora">
    <div>
      <h1>Veylora IDE</h1>
      <div class="muted">Code Beyond Limits.</div>
    </div>
  </header>

  <div class="grid">
    <section class="card">
      <span class="pill">Workspace</span>
      <h2>${name}</h2>
      <p class="path">${path}</p>
      <p class="meta">API ${api}</p>
      <button data-command="createWorkspaceConfig">Initialize Veylora Workspace</button>
      <button class="secondary" data-command="newProject">New Project from Template</button>
      <button class="secondary" data-command="workspaceHealth">Run Health Check</button>
    </section>

    <section class="card">
      <h2>Developer tools</h2>
      <button data-command="showDiagnostics">Runtime Diagnostics</button>
      <button class="secondary" data-command="openSettings">Veylora Settings</button>
    </section>
  </div>

  <p class="footer">
    Powered by the open-source Code - OSS workbench.<br>
    Open VSX gallery · privacy-first product layer · first-party Veylora Core.
  </p>
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
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[character] ?? character;
  });
}
