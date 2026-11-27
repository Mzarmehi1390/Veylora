import * as vscode from 'vscode';

export interface AIConfig {
  enabled: boolean;
  endpoint: string;
  model: string;
}

export function readAIConfig(): AIConfig {
  const cfg = vscode.workspace.getConfiguration('veylora.ai');
  return {
    enabled: cfg.get<boolean>('enabled', false),
    endpoint: (cfg.get<string>('endpoint', '') ?? '').trim().replace(/\/$/, ''),
    model: (cfg.get<string>('model', 'llama3.2') ?? 'llama3.2').trim() || 'llama3.2'
  };
}

export async function openLocalAIAssistant(output: vscode.OutputChannel): Promise<void> {
  const config = readAIConfig();
  if (!config.enabled || !config.endpoint) {
    const choice = await vscode.window.showInformationMessage(
      'Veylora Local AI is optional and fully user-controlled. Set an OpenAI-compatible endpoint (for example Ollama at http://127.0.0.1:11434/v1) and enable it.',
      'Open AI Settings'
    );
    if (choice === 'Open AI Settings') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'veylora.ai');
    }
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'veylora.ai',
    'Veylora Local AI',
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  const nonce = createNonce();
  panel.webview.html = renderAIPanel(nonce, config.model);
  panel.webview.onDidReceiveMessage(async (message: unknown) => {
    if (!isChatMessage(message)) return;
    try {
      const reply = await chatCompletion(config, message.prompt);
      panel.webview.postMessage({ type: 'reply', text: reply });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      output.appendLine('Local AI request failed: ' + detail);
      panel.webview.postMessage({ type: 'error', text: detail });
    }
  });

  output.appendLine('Opened Local AI assistant for endpoint ' + config.endpoint);
}

function isChatMessage(value: unknown): value is { type: 'chat'; prompt: string } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { type?: unknown; prompt?: unknown };
  return candidate.type === 'chat' && typeof candidate.prompt === 'string' && candidate.prompt.trim().length > 0;
}

async function chatCompletion(config: AIConfig, prompt: string): Promise<string> {
  const url = config.endpoint + '/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })
  });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ' from ' + url);
  }
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from local endpoint');
  }
  return text.trim();
}

function renderAIPanel(nonce: string, model: string): string {
  const safeModel = escapeHtml(model);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Veylora Local AI</title>
  <style nonce="${nonce}">
    body { margin: 0; padding: 16px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); background: transparent; }
    h1 { margin: 0 0 8px; font-size: 16px; }
    .muted { color: var(--vscode-descriptionForeground); font-size: 12px; margin-bottom: 16px; }
    #log { min-height: 120px; margin-bottom: 12px; white-space: pre-wrap; font-size: 13px; line-height: 1.45; }
    textarea { width: 100%; min-height: 72px; box-sizing: border-box; resize: vertical; padding: 8px; border-radius: 6px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); font-family: inherit; }
    button { margin-top: 8px; padding: 8px 14px; border: 0; border-radius: 6px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor: pointer; }
  </style>
</head>
<body>
  <h1>Local AI</h1>
  <p class="muted">Talks only to your configured endpoint. Model: ${safeModel}. Nothing is sent to a third-party service by Veylora Core.</p>
  <div id="log"></div>
  <textarea id="prompt" placeholder="Ask something…"></textarea>
  <button id="send">Send</button>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const log = document.getElementById('log');
    const prompt = document.getElementById('prompt');
    const send = document.getElementById('send');
    function append(prefix, text) {
      log.textContent += (log.textContent ? '\n\n' : '') + prefix + text;
      log.scrollTop = log.scrollHeight;
    }
    send.addEventListener('click', () => {
      const text = prompt.value.trim();
      if (!text) return;
      append('You: ', text);
      prompt.value = '';
      vscode.postMessage({ type: 'chat', prompt: text });
    });
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data.type === 'reply') append('Assistant: ', data.text);
      if (data.type === 'error') append('Error: ', data.text);
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
