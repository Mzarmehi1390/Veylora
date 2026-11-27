import * as vscode from 'vscode';
import { showAiStatus, openAiSettings } from './ai';
import { applyModernProfile, applyModernProfileToAll } from './profile';
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
import { primaryFolderLabel, selectWorkspaceFolder, workspaceFolderCount } from './workspace';

type DashboardCommand =
  | 'createWorkspaceConfig'
  | 'showDiagnostics'
  | 'openSettings'
  | 'workspaceHealth'
  | 'welcome'
  | 'newProject'
  | 'applyModernProfile'
  | 'applyProfileToAll'
  | 'aiStatus';

const WALKTHROUGH_ID = 'veylora.veylora-core#veylora.gettingStarted';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Veylora');

  const commands = [
    vscode.commands.registerCommand('veylora.openDashboard', () => openDashboardPanel(context, output)),
    vscode.commands.registerCommand('veylora.createWorkspaceConfig', () => initializeWorkspace(output)),
    vscode.commands.registerCommand('veylora.showDiagnostics', () => writeDiagnostics(output)),
    vscode.commands.registerCommand('veylora.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', 'veylora')
    ),
    vscode.commands.registerCommand('veylora.welcome', () => openWelcome(context, output)),
    vscode.commands.registerCommand('veylora.workspaceHealth', () => runWorkspaceHealth(output)),
    vscode.commands.registerCommand('veylora.newProject', () => createProjectFromTemplate(output)),
    vscode.commands.registerCommand('veylora.applyModernProfile', () => applyModernProfile(output)),
    vscode.commands.registerCommand('veylora.applyProfileToAll', () => applyModernProfileToAll(output)),
    vscode.commands.registerCommand('veylora.aiStatus', () => showAiStatus(output)),
    vscode.commands.registerCommand('veylora.openAiSettings', () => openAiSettings())
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
  output.appendLine('Veylora Core 0.4.2 activated.');

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
    case 'applyModernProfile':
      await applyModernProfile(output);
      break;
    case 'applyProfileToAll':
      await applyModernProfileToAll(output);
      break;
    case 'aiStatus':
      await showAiStatus(output);
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
    command === 'newProject' ||
    command === 'applyModernProfile' ||
    command === 'applyProfileToAll' ||
    command === 'aiStatus'
  );
}
