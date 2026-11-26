export const SCAFFOLD_IDS = ['python', 'node', 'web'] as const;

export type ScaffoldId = (typeof SCAFFOLD_IDS)[number];

export interface ScaffoldContext {
  projectName: string;
  displayName: string;
}

export interface ScaffoldFile {
  relativePath: string;
  contents: string;
}

export interface ScaffoldSummary {
  id: ScaffoldId;
  label: string;
  detail: string;
  openPath: string;
}

export interface ScaffoldPlan {
  create: ScaffoldFile[];
  skip: string[];
}

interface ScaffoldTemplate extends ScaffoldSummary {
  files: (context: ScaffoldContext) => ScaffoldFile[];
}

const SCAFFOLDS: readonly ScaffoldTemplate[] = [
  {
    id: 'python',
    label: 'Python',
    detail: 'pyproject.toml and src/main.py — stdlib only, no telemetry',
    openPath: 'src/main.py',
    files: (context) => [
      {
        relativePath: 'pyproject.toml',
        contents: pyproject(context.projectName)
      },
      {
        relativePath: 'src/main.py',
        contents: pythonMain(context.displayName)
      },
      {
        relativePath: '.gitignore',
        contents: pythonGitignore()
      },
      {
        relativePath: '.vscode/tasks.json',
        contents: tasksJson([
          {
            label: 'Run Python app',
            type: 'shell',
            command: 'python',
            args: ['src/main.py'],
            group: { kind: 'build', isDefault: true },
            problemMatcher: []
          }
        ])
      },
      {
        relativePath: 'README.md',
        contents: readme(
          context.displayName,
          'Local Python app created with Veylora. No accounts and no extra services.',
          'python src/main.py',
          'Requires Python 3.11+.'
        )
      }
    ]
  },
  {
    id: 'node',
    label: 'Node',
    detail: 'ESM package with a start script and a node:test check',
    openPath: 'src/index.js',
    files: (context) => [
      {
        relativePath: 'package.json',
        contents: nodePackage(context.projectName)
      },
      {
        relativePath: 'src/index.js',
        contents: nodeIndex(context.displayName)
      },
      {
        relativePath: 'src/index.test.js',
        contents: nodeTest()
      },
      {
        relativePath: '.gitignore',
        contents: 'node_modules/\ndist/\n.DS_Store\n'
      },
      {
        relativePath: '.vscode/tasks.json',
        contents: tasksJson([
          {
            label: 'Start Node app',
            type: 'shell',
            command: 'npm',
            args: ['start'],
            group: { kind: 'build', isDefault: true },
            problemMatcher: []
          }
        ])
      },
      {
        relativePath: 'README.md',
        contents: readme(
          context.displayName,
          'Local Node app created with Veylora. Dependencies stay empty until you add them.',
          'npm start',
          'Requires Node.js 22+. `npm test` runs the built-in test runner.'
        )
      }
    ]
  },
  {
    id: 'web',
    label: 'Web',
    detail: 'Static HTML, CSS, and JS with no third-party requests',
    openPath: 'index.html',
    files: (context) => [
      {
        relativePath: 'index.html',
        contents: webHtml(context.displayName)
      },
      {
        relativePath: 'styles.css',
        contents: webCss()
      },
      {
        relativePath: 'main.js',
        contents: webJs()
      },
      {
        relativePath: '.gitignore',
        contents: '.DS_Store\n'
      },
      {
        relativePath: '.vscode/tasks.json',
        contents: tasksJson([
          {
            label: 'Serve static site',
            type: 'shell',
            command: 'python',
            args: ['-m', 'http.server', '5173'],
            isBackground: true,
            problemMatcher: []
          }
        ])
      },
      {
        relativePath: 'README.md',
        contents: readme(
          context.displayName,
          'Static page created with Veylora. Scripts and styles are local — nothing is loaded from a third party.',
          'python -m http.server 5173',
          'Then open http://127.0.0.1:5173/ .'
        )
      }
    ]
  }
];

export function isScaffoldId(value: string): value is ScaffoldId {
  return (SCAFFOLD_IDS as readonly string[]).includes(value);
}

export function listScaffolds(): ScaffoldSummary[] {
  return SCAFFOLDS.map(({ id, label, detail, openPath }) => ({ id, label, detail, openPath }));
}

export function scaffoldOpenPath(id: ScaffoldId): string {
  const template = requireTemplate(id);
  return template.openPath;
}

export function renderScaffold(id: ScaffoldId, context: ScaffoldContext): ScaffoldFile[] {
  const files = requireTemplate(id).files({
    projectName: sanitizeProjectName(context.projectName),
    displayName: displayProjectName(context.displayName)
  });
  for (const file of files) {
    if (!isSafeRelativePath(file.relativePath)) {
      throw new Error('Unsafe scaffold path: ' + file.relativePath);
    }
    if (!file.contents.endsWith('\n')) {
      throw new Error('Scaffold file must end with a newline: ' + file.relativePath);
    }
  }
  return files.map((file) => ({ relativePath: file.relativePath, contents: file.contents }));
}

export function planScaffold(files: readonly ScaffoldFile[], existingRelativePaths: readonly string[]): ScaffoldPlan {
  const existing = new Set(existingRelativePaths.map(normalizeRelativePath));
  const create: ScaffoldFile[] = [];
  const skip: string[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const relativePath = normalizeRelativePath(file.relativePath);
    if (!isSafeRelativePath(relativePath)) {
      throw new Error('Unsafe scaffold path: ' + file.relativePath);
    }
    if (seen.has(relativePath)) continue;
    seen.add(relativePath);
    if (existing.has(relativePath)) {
      skip.push(relativePath);
    } else {
      create.push({ relativePath, contents: file.contents });
    }
  }

  return { create, skip };
}

export function sanitizeProjectName(value: string): string {
  let slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');
  if (slug.length > 50) {
    slug = slug.slice(0, 50).replace(/[-_.]+$/g, '');
  }
  if (!slug) return 'veylora-app';
  return slug;
}

export function displayProjectName(value: string): string {
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').replace(/`/g, '').trim().slice(0, 80);
  return cleaned || 'Veylora App';
}

export function buildWorkspaceConfig(options: {
  name: string;
  createdAt: string;
  modern: boolean;
  scaffoldId?: ScaffoldId;
  scaffoldAppliedAt?: string;
}): Record<string, unknown> {
  const editor = options.modern
    ? {
        formatOnSave: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        minimap: { enabled: false },
        stickyScroll: { enabled: true },
        bracketPairColorization: { enabled: true }
      }
    : {
        formatOnSave: true,
        tabSize: 2
      };

  const config: Record<string, unknown> = {
    schemaVersion: 2,
    name: options.name,
    createdAt: options.createdAt,
    product: 'Veylora IDE',
    editor,
    tasks: [],
    notes: 'Generated by Veylora Core. Safe to edit.'
  };

  if (options.scaffoldId && options.scaffoldAppliedAt) {
    config.scaffold = {
      id: options.scaffoldId,
      appliedAt: options.scaffoldAppliedAt,
      managedBy: 'veylora-core'
    };
  }

  return config;
}

export function applyScaffoldMarker(
  existing: unknown,
  id: ScaffoldId,
  appliedAt: string
): { ok: true; document: Record<string, unknown> } | { ok: false; reason: string } {
  if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
    return { ok: false, reason: 'workspace.json is not a JSON object' };
  }

  const document: Record<string, unknown> = { ...(existing as Record<string, unknown>) };
  document.scaffold = {
    id,
    appliedAt,
    managedBy: 'veylora-core'
  };
  return { ok: true, document };
}

export function isSafeRelativePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized || normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) return false;
  return normalized.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..');
}

function requireTemplate(id: ScaffoldId): ScaffoldTemplate {
  const template = SCAFFOLDS.find((item) => item.id === id);
  if (!template) {
    throw new Error('Unknown scaffold: ' + id);
  }
  return template;
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

function tasksJson(tasks: unknown[]): string {
  return jsonText({ version: '2.0.0', tasks });
}

function pyproject(name: string): string {
  return `[project]
name = ${JSON.stringify(name)}
version = "0.1.0"
description = "Python app scaffolded by Veylora."
requires-python = ">=3.11"
readme = "README.md"

[tool.veylora]
template = "python"
privacy = "local-only"
`;
}

function pythonMain(displayName: string): string {
  return `"""Entry point for this Veylora Python project."""


def main() -> None:
    print(${JSON.stringify(displayName)})


if __name__ == "__main__":
    main()
`;
}

function pythonGitignore(): string {
  return `__pycache__/
*.py[cod]
.venv/
venv/
.pytest_cache/
.mypy_cache/
dist/
*.egg-info/
`;
}

function nodePackage(name: string): string {
  return jsonText({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    description: 'Node app scaffolded by Veylora.',
    scripts: {
      start: 'node src/index.js',
      test: 'node --test'
    },
    engines: {
      node: '>=22'
    }
  });
}

function nodeIndex(displayName: string): string {
  return `import { pathToFileURL } from 'node:url';

export function greet(name = ${JSON.stringify(displayName)}) {
  return \`Hello from \${name}\`;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  console.log(greet());
}
`;
}

function nodeTest(): string {
  return `import test from 'node:test';
import assert from 'node:assert/strict';
import { greet } from './index.js';

test('greet names the caller', () => {
  assert.match(greet('demo'), /demo/);
});
`;
}

function webHtml(displayName: string): string {
  const safe = escapeHtml(displayName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safe}</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main>
    <p class="eyebrow">Veylora scaffold</p>
    <h1>${safe}</h1>
    <p id="status">Local page. No third-party scripts.</p>
  </main>
  <script src="./main.js"></script>
</body>
</html>
`;
}

function webCss(): string {
  return `:root {
  color-scheme: light dark;
  --bg: #0f1117;
  --fg: #f4f6fb;
  --muted: #b7c0d4;
  --accent: #7c74f2;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #f7f8fc;
    --fg: #171923;
    --muted: #4b556d;
    --accent: #5146c8;
  }
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, sans-serif;
}

main {
  max-width: 36rem;
  padding: 2rem;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  font-size: 0.75rem;
}

h1 {
  font-size: 2.25rem;
  margin: 0.25rem 0 0.75rem;
}

p {
  color: var(--muted);
  line-height: 1.5;
}
`;
}

function webJs(): string {
  return `const status = document.querySelector('#status');
if (status) {
  status.textContent = 'Ready — running locally in Veylora.';
}
`;
}

function readme(displayName: string, summary: string, command: string, note: string): string {
  return `# ${displayName}

${summary}

## Run

\`\`\`bash
${command}
\`\`\`

${note}
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&' + 'amp;';
      case '<':
        return '&' + 'lt;';
      case '>':
        return '&' + 'gt;';
      case '"':
        return '&' + 'quot;';
      case "'":
        return '&' + '#39;';
      default:
        return character;
    }
  });
}
