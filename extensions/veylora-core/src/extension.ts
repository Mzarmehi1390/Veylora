import * as vscode from 'vscode';
import {
  applyScaffoldMarker,
  buildWorkspaceConfig,
  isScaffoldId,
  listScaffolds,
  planScaffold,
  renderScaffold,
  scaffoldOpenPath,
  type ScaffoldId
} from './scaffolds';
import { applyModernProfile, applyModernProfileToAll } from './profile';
import { aiSettingsFilter, readAiStatus } from './ai';
import { primaryFolderLabel, selectWorkspaceFolder, workspaceFolderCount } from './workspace';
import { configureTasks, detectProjectKind, suggestTasks } from './tasks';

const OUTPUT_CHANNEL = 'Veylora';
const WORKSPACE_CONFIG_REL = '.veylora/workspace.json';

let dashboardPanel: vscode.WebviewPanel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel(OUTPUT_CHANNEL);
  context.subscriptions.push(output);

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'veylora.openDashboard';
  statusBarItem.tooltip = 'Open Veylora Dashboard';
  context.subscriptions.push(statusBarItem);
  refreshStatusBar();
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => refreshStatusBar()),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('veylora')) refreshStatusBar();
    })
  );

  const sidebarProvider = new VeyloraSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('veylora.workspace', sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: false }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('veylora.openDashboard', () => openDashboard(context)),
    vscode.commands.registerCommand('veylora.createWorkspaceConfig', () => createWorkspaceConfig()),
    vscode.commands.registerCommand('veylora.showDiagnostics', () => showDiagnostics()),
    vscode.commands.registerCommand('veylora.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', '@ext:veylora.veylora-core')
    ),
    vscode.commands.registerCommand('veylora.welcome', () =>
      vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        'veylora.veylora-core#veylora.gettingStarted',
        false
      )
    ),
    vscode.commands.registerCommand('veylora.workspaceHealth', () => workspaceHealth()),
    vscode.commands.registerCommand('veylora.newProject', () => newProjectFromTemplate()),
    vscode.commands.registerCommand('veylora.applyModernProfile', () => applyModernProfile(output)),
    vscode.commands.registerCommand('veylora.applyProfileToAll', () => applyModernProfileToAll(output)),
    vscode.commands.registerCommand('veylora.configureAI', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', aiSettingsFilter())
    ),
    vscode.commands.registerCommand('veylora.configureTasks', () => configureTasks(output))
  );

  void maybeShowInitHint(context);
}

export function deactivate(): void {
  dashboardPanel?.dispose();
  dashboardPanel = undefined;
}

function refreshStatusBar(): void {
  if (!statusBarItem) return;
  const show = vscode.workspace.getConfiguration('veylora.workspace').get<boolean>('showStatusBarItem', true);
  if (!show) {
    statusBarItem.hide();
    return;
  }
  const count = workspaceFolderCount();
  const label = count === 0 ? '$(vm) Veylora' : `$(vm) Veylora (${count})`;
  statusBarItem.text = label;
  statusBarItem.show();
}

async function maybeShowInitHint(context: vscode.ExtensionContext): Promise<void> {
  if (!vscode.workspace.getConfiguration('veylora.workspace').get<boolean>('autoInitHint', true)) return;
  const folder = await selectWorkspaceFolder();
  if (!folder) return;
  const configUri = vscode.Uri.joinPath(folder.uri, WORKSPACE_CONFIG_REL);
  try {
    await vscode.workspace.fs.stat(configUri);
  } catch {
    const key = `veylora.initHint.${folder.uri.toString()}`;
    if (context.globalState.get<boolean>(key)) return;
    const action = await vscode.window.showInformationMessage(
      `Initialize a Veylora workspace for "${folder.name}"?`,
      'Initialize',
      'Later'
    );
    if (action === 'Initialize') {
      await createWorkspaceConfig();
    }
    await context.globalState.update(key, true);
  }
}

function openDashboard(context: vscode.ExtensionContext): void {
  if (dashboardPanel) {
    dashboardPanel.reveal(vscode.ViewColumn.One);
    void updateDashboardHtml(dashboardPanel.webview);
    return;
  }

  dashboardPanel = vscode.window.createWebviewPanel(
    'veyloraDashboard',
    'Veylora',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [context.extensionUri],
      retainContextWhenHidden: true
    }
  );

  const disposable = dashboardPanel.webview.onDidReceiveMessage(async (message) => {
    if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;
    switch (message.type) {
      case 'openSettings':
        await vscode.commands.executeCommand('veylora.openSettings');
        break;
      case 'welcome':
        await vscode.commands.executeCommand('veylora.welcome');
        break;
      case 'health':
        await vscode.commands.executeCommand('veylora.workspaceHealth');
        break;
      case 'newProject':
        await vscode.commands.executeCommand('veylora.newProject');
        break;
      case 'applyProfile':
        await vscode.commands.executeCommand('veylora.applyModernProfile');
        break;
      case 'configureAI':
        await vscode.commands.executeCommand('veylora.configureAI');
        break;
      case 'configureTasks':
        await vscode.commands.executeCommand('veylora.configureTasks');
        break;
      case 'refresh':
        await updateDashboardHtml(dashboardPanel!.webview);
        break;
      default:
        break;
    }
  });

  dashboardPanel.onDidDispose(() => {
    disposable.dispose();
    dashboardPanel = undefined;
  });

  void updateDashboardHtml(dashboardPanel.webview);
}

async function updateDashboardHtml(webview: vscode.Webview): Promise<void> {
  const nonce = getNonce();
  const ai = readAiStatus();
  const folders = workspaceFolderCount();
  const label = primaryFolderLabel();
  const trusted = vscode.workspace.isTrusted;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Veylora</title>
  <style nonce="${nonce}">
    :root { color-scheme: light dark; --fg: #e6e6e6; --muted: #a0a0a0; --accent: #7c74f2; --bg: #1e1e1e; --card: #252526; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); margin: 0; padding: 1.5rem; }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    .muted { color: var(--muted); margin: 0 0 1.25rem; }
    .card { background: var(--card); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
    .row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
    button { background: var(--accent); color: white; border: none; border-radius: 6px; padding: 0.45rem 0.9rem; cursor: pointer; font-size: 0.9rem; }
    button.secondary { background: transparent; border: 1px solid #555; color: var(--fg); }
    .status { font-weight: 500; }
  </style>
</head>
<body>
  <h1>Veylora</h1>
  <p class="muted">Modern, privacy-first workspace on Code - OSS</p>

  <div class="card">
    <div class="status">Workspace</div>
    <div>${escapeHtml(label)}</div>
    <div class="muted">${folders} folder(s) · ${trusted ? 'Trusted' : 'Restricted'}</div>
    <div class="row">
      <button data-cmd="health">Health Check</button>
      <button class="secondary" data-cmd="newProject">New Project</button>
      <button class="secondary" data-cmd="applyProfile">Apply Modern Profile</button>
      <button class="secondary" data-cmd="configureTasks">Configure Tasks</button>
    </div>
  </div>

  <div class="card">
    <div class="status">AI Assistant</div>
    <div>${escapeHtml(ai.summary)}</div>
    <div class="row">
      <button data-cmd="configureAI">Configure AI</button>
      <button class="secondary" data-cmd="refresh">Refresh</button>
    </div>
  </div>

  <div class="card">
    <div class="status">Getting Started</div>
    <div class="row">
      <button data-cmd="welcome">Open Walkthrough</button>
      <button class="secondary" data-cmd="openSettings">Settings</button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-cmd]');
      if (!btn) return;
      vscode.postMessage({ type: btn.dataset.cmd });
    });
  </script>
</body>
</html>`;
  webview.html = html;
}

class VeyloraSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };
    void updateDashboardHtml(webviewView.webview);

    const disposable = webviewView.webview.onDidReceiveMessage(async (message) => {
      if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;
      switch (message.type) {
        case 'openSettings':
          await vscode.commands.executeCommand('veylora.openSettings');
          break;
        case 'welcome':
          await vscode.commands.executeCommand('veylora.welcome');
          break;
        case 'health':
          await vscode.commands.executeCommand('veylora.workspaceHealth');
          break;
        case 'newProject':
          await vscode.commands.executeCommand('veylora.newProject');
          break;
        case 'applyProfile':
          await vscode.commands.executeCommand('veylora.applyModernProfile');
          break;
        case 'configureAI':
          await vscode.commands.executeCommand('veylora.configureAI');
          break;
        case 'configureTasks':
          await vscode.commands.executeCommand('veylora.configureTasks');
          break;
        case 'refresh':
          await updateDashboardHtml(webviewView.webview);
          break;
        default:
          break;
      }
    });
    webviewView.onDidDispose(() => disposable.dispose());
  }
}

async function createWorkspaceConfig(): Promise<void> {
  const folder = await selectWorkspaceFolder('Initialize workspace for which folder?');
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder first.');
    return;
  }

  const configUri = vscode.Uri.joinPath(folder.uri, WORKSPACE_CONFIG_REL);
  try {
    await vscode.workspace.fs.stat(configUri);
    const replace = await vscode.window.showWarningMessage(
      `.veylora/workspace.json already exists in "${folder.name}". Replace it?`,
      { modal: true },
      'Replace'
    );
    if (replace !== 'Replace') return;
  } catch {
    // first run
  }

  const modern = vscode.workspace.getConfiguration('veylora.modernDefaults').get<boolean>('enabled', true);
  const config = buildWorkspaceConfig({
    name: folder.name,
    createdAt: new Date().toISOString(),
    modern
  });

  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(configUri, encoder.encode(JSON.stringify(config, null, 2) + '\n'));
  output.appendLine(`Initialized workspace config at ${configUri.fsPath}`);
  void vscode.window.showInformationMessage(`Veylora workspace initialized for "${folder.name}".`);
  if (dashboardPanel) void updateDashboardHtml(dashboardPanel.webview);
}

async function newProjectFromTemplate(): Promise<void> {
  const folder = await selectWorkspaceFolder('Scaffold project into which folder?');
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder first.');
    return;
  }

  const picks = listScaffolds().map((s) => ({
    label: s.label,
    description: s.detail,
    id: s.id as ScaffoldId
  }));
  const picked = await vscode.window.showQuickPick(picks, {
    placeHolder: 'Choose a project template',
    title: 'Veylora: New Project from Template'
  });
  if (!picked || !isScaffoldId(picked.id)) return;

  const name = folder.name;
  const files = renderScaffold(picked.id, { projectName: name, displayName: name });

  const existing: string[] = [];
  for (const file of files) {
    const uri = vscode.Uri.joinPath(folder.uri, file.relativePath);
    try {
      await vscode.workspace.fs.stat(uri);
      existing.push(file.relativePath);
    } catch {
      // missing
    }
  }

  const plan = planScaffold(files, existing);
  const encoder = new TextEncoder();
  for (const file of plan.create) {
    const uri = vscode.Uri.joinPath(folder.uri, file.relativePath);
    const dir = vscode.Uri.joinPath(uri, '..');
    try {
      await vscode.workspace.fs.createDirectory(dir);
    } catch {
      // exists
    }
    await vscode.workspace.fs.writeFile(uri, encoder.encode(file.contents));
  }

  // Stamp workspace config
  const configUri = vscode.Uri.joinPath(folder.uri, WORKSPACE_CONFIG_REL);
  let doc: Record<string, unknown> | undefined;
  try {
    const raw = await vscode.workspace.fs.readFile(configUri);
    doc = JSON.parse(new TextDecoder().decode(raw)) as Record<string, unknown>;
  } catch {
    doc = buildWorkspaceConfig({
      name,
      createdAt: new Date().toISOString(),
      modern: vscode.workspace.getConfiguration('veylora.modernDefaults').get<boolean>('enabled', true)
    });
  }
  const stamped = applyScaffoldMarker(doc, picked.id, new Date().toISOString());
  if (stamped.ok) {
    await vscode.workspace.fs.writeFile(
      configUri,
      encoder.encode(JSON.stringify(stamped.document, null, 2) + '\n')
    );
  }

  const openPath = scaffoldOpenPath(picked.id);
  const openUri = vscode.Uri.joinPath(folder.uri, openPath);
  try {
    const docUri = await vscode.workspace.openTextDocument(openUri);
    await vscode.window.showTextDocument(docUri);
  } catch {
    // ignore open failure
  }

  output.appendLine(
    `Scaffolded ${picked.id} into ${folder.uri.fsPath} (created ${plan.create.length}, skipped ${plan.skip.length}).`
  );
  void vscode.window.showInformationMessage(
    `Created ${plan.create.length} file(s) from the ${picked.label} template${plan.skip.length ? ` (${plan.skip.length} existing skipped)` : ''}.`
  );
  if (dashboardPanel) void updateDashboardHtml(dashboardPanel.webview);
}

async function workspaceHealth(): Promise<void> {
  const folder = await selectWorkspaceFolder('Run health check on which folder?');
  if (!folder) {
    void vscode.window.showWarningMessage('Open a project folder first.');
    return;
  }

  const lines: string[] = [`Veylora Workspace Health — ${folder.name}`, `Path: ${folder.uri.fsPath}`, ''];

  const configUri = vscode.Uri.joinPath(folder.uri, WORKSPACE_CONFIG_REL);
  try {
    const raw = await vscode.workspace.fs.readFile(configUri);
    const parsed = JSON.parse(new TextDecoder().decode(raw));
    lines.push(`✓ .veylora/workspace.json present (schema ${parsed.schemaVersion ?? '?'})`);
    if (parsed.scaffold?.id) lines.push(`  scaffold: ${parsed.scaffold.id}`);
  } catch {
    lines.push('✗ .veylora/workspace.json missing — run Initialize Workspace');
  }

  const settingsUri = vscode.Uri.joinPath(folder.uri, '.vscode/settings.json');
  try {
    await vscode.workspace.fs.stat(settingsUri);
    lines.push('✓ .vscode/settings.json present');
  } catch {
    lines.push('○ .vscode/settings.json not found (modern profile not applied yet)');
  }

  const tasksUri = vscode.Uri.joinPath(folder.uri, '.vscode/tasks.json');
  try {
    await vscode.workspace.fs.stat(tasksUri);
    lines.push('✓ .vscode/tasks.json present');
  } catch {
    lines.push('○ .vscode/tasks.json not found');
  }

  const kind = await detectProjectKind(folder);
  const suggestion = suggestTasks(kind);
  lines.push(`Project kind: ${kind}${suggestion.tasks.length ? ` (${suggestion.label})` : ''}`);
  if (suggestion.tasks.length) {
    lines.push('  suggested tasks: ' + suggestion.tasks.map((t) => t.label).join(', '));
  }

  const ai = readAiStatus();
  lines.push('', `AI: ${ai.summary}`);
  lines.push(`Trusted: ${vscode.workspace.isTrusted ? 'yes' : 'no'}`);
  lines.push(`Folders in workspace: ${workspaceFolderCount()}`);

  output.clear();
  for (const line of lines) output.appendLine(line);
  output.show(true);
  void vscode.window.showInformationMessage('Veylora health check written to the Veylora output channel.');
}

function showDiagnostics(): void {
  const lines = [
    'Veylora Runtime Diagnostics',
    `Version: ${vscode.extensions.getExtension('veylora.veylora-core')?.packageJSON.version ?? 'unknown'}`,
    `VS Code: ${vscode.version}`,
    `Workspace folders: ${workspaceFolderCount()}`,
    `Primary: ${primaryFolderLabel()}`,
    `Trusted: ${vscode.workspace.isTrusted}`,
    `AI: ${readAiStatus().summary}`,
    `Platform: ${process.platform} ${process.arch}`,
    `Node: ${process.version}`
  ];
  output.clear();
  for (const line of lines) output.appendLine(line);
  output.show(true);
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
