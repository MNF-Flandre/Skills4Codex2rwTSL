# TSL Workbench (Beta)

TSL Workbench is a VS Code extension for TSL validation workflows.  
It uses the existing Python backend (`python/tsl_validation` + `python/ide_bridge.py`) and does **not** depend on private Codex APIs.

## What it can do

- Run lint / smoke / spec / oracle on current `.tsl` file
- Run pyTSL preflight checks
- Show diagnostics in Problems
- Generate Codex handoff prompts (fix / explain / continue)
- Show connection/backend/last-run status in Sidebar + Status Bar

## Install and run locally

From the `vscode-extension/` directory:

```bash
npm install
npm run compile
npm test
npm run package
```

Development Host (F5):

1. Open `vscode-extension/` in VS Code.
2. Run `npm install` once.
3. Press `F5` to launch Extension Development Host.

Install generated `.vsix`:

1. VS Code → Command Palette → `Extensions: Install from VSIX...`
2. Choose generated `tsl-workbench-*.vsix`

## Backend location model

The extension separates:

- **VS Code extension install location**
- **current workspace**
- **backend project root**

Use settings:

- `tslWorkbench.backend.mode`: `auto` / `repo_attached_mode` / `external_workspace_mode`
- `tslWorkbench.backend.root`: explicit backend root (required in strict external mode)
- `tslWorkbench.backend.pythonModulePath`: usually `python`

Backend root must contain:

- `python/ide_bridge.py`
- `python/tsl_validation/cli.py`

## Configure connection

Run command: `TSL: Configure Connection`

Configuration split:

- settings: host, port, username, mode, sdkPath, localClientPath
- SecretStorage: password

Extra commands:

- `TSL: Run Preflight`
- `TSL: Clear Stored Password`
- `TSL: Reset Connection Config`
- `TSL: Reveal Current Connection Summary`

Validation adapter setting:

- `tslWorkbench.validation.adapter`: `auto` (default) / `mock` / `pytsl`
- Recommended default for mixed environments: `auto`

## First-use path (recommended)

1. Configure `tslWorkbench.backend.mode` and `tslWorkbench.backend.root` (if needed).
2. Run `TSL: Configure Connection`.
3. Run `TSL: Run Preflight`.
4. Open a `.tsl` file and run `TSL: Run Smoke on Current File`.
5. If needed, run `TSL: Ask Codex to Fix Current File`.

## Codex handoff workflow

Supported scenes:

- `TSL: Ask Codex to Fix Current File`
- `TSL: Ask Codex to Explain Current Error`
- `TSL: Ask Codex to Continue From Report`
- `TSL: Ask Codex for Current Selection`

Prompt output:

- `clipboard`
- `newDocument`
- `both`
- `workspaceTempFile`

Prompt style:

- `tslWorkbench.codex.promptStyle`: `full` / `concise`

## Beta limitations

- This extension still depends on a valid Python backend project root.
- It is validation-driven (not a full LSP implementation).
- `publisher` is placeholder (`todo-publisher`); replace before Marketplace release.
