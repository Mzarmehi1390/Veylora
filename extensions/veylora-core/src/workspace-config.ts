export interface WorkspaceConfiguration {
  schemaVersion: 1;
  name: string;
  createdAt: string;
  editor: {
    formatOnSave: boolean;
    tabSize: number;
  };
  tasks: unknown[];
}

/** Build the initial workspace document without coupling it to VS Code APIs. */
export function createWorkspaceConfig(
  name: string,
  createdAt = new Date().toISOString()
): WorkspaceConfiguration {
  return {
    schemaVersion: 1,
    name,
    createdAt,
    editor: { formatOnSave: true, tabSize: 2 },
    tasks: []
  };
}

/** Distinguish a genuinely absent file from permission and provider failures. */
export function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'FileNotFound';
}

/** Escape values inserted into the dashboard's HTML text nodes. */
export function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return value.replace(/[&<>"']/g, character => entities[character] ?? character);
}
