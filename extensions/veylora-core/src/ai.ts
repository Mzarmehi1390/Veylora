import * as vscode from 'vscode';

export interface AiConfig {
  enabled: boolean;
  provider: string;
  endpoint: string;
  model: string;
}

export function readAiConfig(): AiConfig {
  const cfg = vscode.workspace.getConfiguration('veylora.ai');
  return {
    enabled: cfg.get<boolean>('enabled', false),
    provider: cfg.get<string>('provider', 'none') ?? 'none',
    endpoint: cfg.get<string>('endpoint', '') ?? '',
    model: cfg.get<string>('model', '') ?? ''
  };
}

export function isAiConfigured(config: AiConfig = readAiConfig()): boolean {
  if (!config.enabled) return false;
  if (config.provider === 'none' || !config.provider) return false;
  return config.endpoint.trim().length > 0;
}

export async function showAiStatus(output: vscode.OutputChannel): Promise<void> {
  const config = readAiConfig();
  const configured = isAiConfigured(config);
  output.clear();
  output.appendLine('Veylora — AI Assistant Status');
  output.appendLine('==============================');
  output.appendLine('Enabled: ' + config.enabled);
  output.appendLine('Provider: ' + config.provider);
  output.appendLine('Endpoint: ' + (config.endpoint || '(not set)'));
  output.appendLine('Model: ' + (config.model || '(not set)'));
  output.appendLine('Configured: ' + (configured ? 'yes' : 'no'));
  output.appendLine('');
  output.appendLine(
    'AI is optional and user-controlled. No provider is preconfigured. ' +
      'Point the endpoint at a local or remote OpenAI-compatible service you trust.'
  );
  output.show(true);

  if (configured) {
    void vscode.window.showInformationMessage(
      'Veylora AI is configured (' + config.provider + '). Endpoint is set; no automatic calls are made.'
    );
  } else {
    const choice = await vscode.window.showInformationMessage(
      'Veylora AI is not configured. Open settings to choose a provider and endpoint?',
      'Open AI Settings',
      'Later'
    );
    if (choice === 'Open AI Settings') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'veylora.ai');
    }
  }
}

export async function openAiSettings(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.openSettings', 'veylora.ai');
}
