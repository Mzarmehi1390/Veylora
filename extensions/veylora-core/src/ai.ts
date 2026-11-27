import * as vscode from 'vscode';

export const AI_PROVIDERS = ['none', 'ollama', 'openai-compatible', 'custom'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export interface AiStatus {
  enabled: boolean;
  provider: AiProvider;
  endpoint: string;
  model: string;
  configured: boolean;
  summary: string;
}

export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}

export function readAiStatus(): AiStatus {
  const cfg = vscode.workspace.getConfiguration('veylora.ai');
  const enabled = cfg.get<boolean>('enabled', false);
  const rawProvider = cfg.get<string>('provider', 'none') ?? 'none';
  const provider: AiProvider = isAiProvider(rawProvider) ? rawProvider : 'none';
  const endpoint = (cfg.get<string>('endpoint', '') ?? '').trim();
  const model = (cfg.get<string>('model', '') ?? '').trim();

  const configured =
    enabled &&
    provider !== 'none' &&
    endpoint.length > 0 &&
    model.length > 0;

  let summary: string;
  if (!enabled) {
    summary = 'AI assistant is disabled (privacy-first default).';
  } else if (provider === 'none') {
    summary = 'AI enabled but no provider selected.';
  } else if (!endpoint || !model) {
    summary = `Provider ${provider} selected — set endpoint and model to activate.`;
  } else {
    summary = `Ready: ${provider} · ${model} @ ${endpoint}`;
  }

  return { enabled, provider, endpoint, model, configured, summary };
}

export function aiSettingsFilter(): string {
  return 'veylora.ai';
}
