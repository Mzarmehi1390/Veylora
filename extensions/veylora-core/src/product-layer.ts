export interface ScaffoldFile {
  relativePath: string;
  contents: string;
}

export interface ScaffoldTask {
  label: string;
  type: 'shell';
  command: string;
  args: string[];
  group?: 'build' | 'none' | { kind: 'build' | 'none'; isDefault?: boolean };
  problemMatcher: string[];
  isBackground?: boolean;
  presentation?: { reveal: 'always' | 'silent'; panel: 'shared' };
}

export interface Scaffold {
  id: 'python' | 'node' | 'web';
  label: string;
  description: string;
  detail: string;
  entry: string;
  files: ScaffoldFile[];
  tasks: ScaffoldTask[];
}

export interface WritePlan {
  write: ScaffoldFile[];
  skip: string[];
}

export interface TaskDocument {
  version: string;
  tasks: ScaffoldTask[];
}

export const MODERN_PROFILE = {
  'editor.formatOnSave': true,
  'editor.tabSize': 2,
  'editor.insertSpaces': true,
  'editor.wordWrap': 'on',
  'editor.minimap.enabled': false,
  'editor.stickyScroll.enabled': true,
  'editor.bracketPairColorization.enabled': true,
  'editor.guides.bracketPairs': 'active',
  'editor.smoothScrolling': true,
  'editor.cursorSmoothCaretAnimation': 'on',
  'editor.linkedEditing': true,
  'editor.renderWhitespace': 'selection',
  'editor.largeFileOptimizations': true,
  'workbench.list.smoothScrolling': true,
  'workbench.startupEditor': 'none',
  'files.trimTrailingWhitespace': true,
  'files.insertFinalNewline': true,
  'files.watcherExclude': {
    '**/.git/objects/**': true,
    '**/.git/subtree-cache/**': true,
    '**/node_modules/**': true,
    '**/.venv/**': true,
    '**/venv/**': true,
    '**/dist/**': true
  },
  'search.exclude': {
    '**/node_modules': true,
    '**/.venv': true,
    '**/venv': true,
    '**/dist': true
  },
  'explorer.compactFolders': false,
  'telemetry.telemetryLevel': 'off',
  'git.autofetch': true
} as const;

const PYTHON_GITIGNORE = `__pycache__/
*.py[cod]
.venv/
venv/
.pytest_cache/
.mypy_cache/
`;

const NODE_GITIGNORE = `node_modules/
dist/
.npm/
`;

const WEB_GITIGNORE = `.DS_Store
`;

export const SCAFFOLDS: readonly Scaffold[] = [
  {
    id: 'python',
    label: 'Python',
    description: 'pyproject.toml + main.py',
    detail: 'Runnable script. Does not overwrite files that already exist.',
    entry: 'main.py',
    files: [
      {
        relativePath: 'main.py',
        contents: `def main() -> None:
    print("Hello from Veylora.")


if __name__ == "__main__":
    main()
`
      },
      {
        relativePath: 'pyproject.toml',
        contents: `[project]
name = "veylora-app"
version = "0.1.0"
description = "Python project scaffolded by Veylora."
requires-python = ">=3.11"
`
      },
      { relativePath: '.gitignore', contents: PYTHON_GITIGNORE }
    ],
    tasks: [
      {
        label: 'Run Python',
        type: 'shell',
        command: 'python',
        args: ['main.py'],
        group: { kind: 'build', isDefault: true },
        problemMatcher: [],
        presentation: { reveal: 'always', panel: 'shared' }
      }
    ]
  },
  {
    id: 'node',
    label: 'Node',
    description: 'package.json + index.mjs',
    detail: 'ESM script with an npm start task. Existing files are kept.',
    entry: 'index.mjs',
    files: [
      {
        relativePath: 'package.json',
        contents: `{
  "name": "veylora-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node index.mjs"
  }
}
`
      },
      {
        relativePath: 'index.mjs',
        contents: `console.log("Hello from Veylora.");
`
      },
      { relativePath: '.gitignore', contents: NODE_GITIGNORE }
    ],
    tasks: [
      {
        label: 'Run Node',
        type: 'shell',
        command: 'npm',
        args: ['start'],
        group: { kind: 'build', isDefault: true },
        problemMatcher: [],
        presentation: { reveal: 'always', panel: 'shared' }
      }
    ]
  },
  {
    id: 'web',
    label: 'Web',
    description: 'Static HTML, CSS and JS',
    detail: 'Local page served with python -m http.server. Existing files are kept.',
    entry: 'index.html',
    files: [
      {
        relativePath: 'index.html',
        contents: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Veylora Web</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main>
    <p class="eyebrow">Veylora scaffold</p>
    <h1>Start here.</h1>
    <p class="lede">A quiet page with no trackers. Edit <code>app.js</code>, then refresh.</p>
    <button type="button" id="pulse">Say hello</button>
    <p id="status" role="status"></p>
  </main>
  <script src="./app.js"></script>
</body>
</html>
`
      },
      {
        relativePath: 'styles.css',
        contents: `:root {
  color-scheme: light;
  --ink: #1c1915;
  --muted: #5e584e;
  --paper: #f3efe6;
  --accent: #3d3680;
  --line: #d9d1c3;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  background:
    linear-gradient(180deg, #f7f4ee 0%, var(--paper) 40%, #e7efe8 100%);
  color: var(--ink);
  font-family: "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif;
}

main {
  max-width: 38rem;
  margin: 0 auto;
  padding: 18vh 1.5rem 4rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-family: "Segoe UI", sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

h1 {
  margin: 0;
  font-size: clamp(2.6rem, 7vw, 4.2rem);
  font-weight: 560;
  letter-spacing: -0.03em;
  line-height: 0.95;
  border-left: 6px solid var(--accent);
  padding-left: 0.7rem;
}

.lede {
  margin: 1.25rem 0 1.5rem;
  max-width: 32rem;
  color: var(--muted);
  font-size: 1.15rem;
  line-height: 1.5;
}

button {
  font-family: "Segoe UI", sans-serif;
  font-size: 0.95rem;
  color: #fff;
  background: var(--accent);
  border: 0;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  cursor: pointer;
}

button:hover { filter: brightness(1.08); }

#status {
  min-height: 1.4rem;
  margin: 1rem 0 0;
  font-family: "Segoe UI", sans-serif;
  color: var(--ink);
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.92em;
}
`
      },
      {
        relativePath: 'app.js',
        contents: `const button = document.querySelector("#pulse");
const status = document.querySelector("#status");

button?.addEventListener("click", () => {
  const now = new Date().toLocaleTimeString();
  if (status) status.textContent = "Hello from Veylora · " + now;
});
`
      },
      { relativePath: '.gitignore', contents: WEB_GITIGNORE }
    ],
    tasks: [
      {
        label: 'Serve Web',
        type: 'shell',
        command: 'python',
        args: ['-m', 'http.server', '4173'],
        group: 'none',
        problemMatcher: [],
        isBackground: true,
        presentation: { reveal: 'always', panel: 'shared' }
      }
    ]
  }
];

export function scaffoldById(id: string): Scaffold | undefined {
  return SCAFFOLDS.find((scaffold) => scaffold.id === id);
}

export function assertSafeRelativePath(relativePath: string): void {
  if (relativePath.length === 0 || relativePath.startsWith('/') || relativePath.includes('\\')) {
    throw new Error('Unsafe scaffold path: ' + relativePath);
  }
  const parts = relativePath.split('/');
  if (parts.some((part) => part.length === 0 || part === '.' || part === '..')) {
    throw new Error('Unsafe scaffold path: ' + relativePath);
  }
}

export function planWrites(files: readonly ScaffoldFile[], existing: ReadonlySet<string>): WritePlan {
  const write: ScaffoldFile[] = [];
  const skip: string[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    assertSafeRelativePath(file.relativePath);
    if (seen.has(file.relativePath)) {
      throw new Error('Duplicate scaffold path: ' + file.relativePath);
    }
    seen.add(file.relativePath);
    if (existing.has(file.relativePath)) skip.push(file.relativePath);
    else write.push(file);
  }
  return { write, skip };
}

export function parseTaskDocument(text: string): TaskDocument {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('tasks.json is not valid JSON. Veylora will not overwrite it.');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('tasks.json must be a JSON object.');
  }
  const record = value as { version?: unknown; tasks?: unknown };
  if (typeof record.version !== 'string' || !Array.isArray(record.tasks)) {
    throw new Error('tasks.json must contain a version and a tasks array.');
  }
  return { version: record.version, tasks: record.tasks as ScaffoldTask[] };
}

export function mergeTaskDocument(existing: TaskDocument | null, incoming: readonly ScaffoldTask[]): {
  document: TaskDocument;
  added: string[];
  skipped: string[];
} {
  const base: TaskDocument = existing
    ? { version: existing.version, tasks: [...existing.tasks] }
    : { version: '2.0.0', tasks: [] };
  const labels = new Set(
    base.tasks
      .map((task) => task.label)
      .filter((label): label is string => typeof label === 'string' && label.length > 0)
  );
  const added: string[] = [];
  const skipped: string[] = [];
  for (const task of incoming) {
    if (labels.has(task.label)) {
      skipped.push(task.label);
      continue;
    }
    base.tasks.push(task);
    labels.add(task.label);
    added.push(task.label);
  }
  return { document: base, added, skipped };
}

export function profileEntries(): Array<[string, unknown]> {
  return Object.entries(MODERN_PROFILE).map(([key, value]) => [
    key,
    JSON.parse(JSON.stringify(value)) as unknown
  ]);
}
