# TSL Workbench (Beta)

TSL Workbench is a VS Code extension for TSL validation workflows.  
It uses the existing Python backend (`python/tsl_validation` + `python/ide_bridge.py`) and does **not** depend on private Codex APIs.

## What it can do

- Run lint / smoke / spec / oracle on current `.tsl` file
- Run pyTSL preflight checks
- Run a multi-layer Diagnostic Wizard (backend / python / connection / validation paths / runtime hints)
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

`npm test` now runs:
- unit tests (`node --test`)
- Extension Host integration tests (`@vscode/test-electron`)

Notes for integration tests:
- They require downloading a VS Code test binary (`update.code.visualstudio.com`) on first run.
- In restricted/offline environments, integration tests are skipped with warning by default.
- Set `TSL_STRICT_INTEGRATION_TESTS=1` to fail hard when integration test setup cannot complete.

Development Host (F5):

1. Open `vscode-extension/` in VS Code.
2. Run `npm install` once.
3. Press `F5` to launch Extension Development Host.

Install generated `.vsix`:

1. VS Code → Command Palette → `Extensions: Install from VSIX...`
2. Choose generated `tsl-workbench-*.vsix`

## Clean-install acceptance path (empty workspace + external backend)

Use this path to validate a first-time installation:

1. Install `.vsix`.
2. Open an empty/new workspace folder.
3. Set:
   - `tslWorkbench.backend.mode = external_workspace_mode`
   - `tslWorkbench.backend.root = <path-to-backend-repo-root>`
4. Run `TSL: Configure Connection` (host/port/mode/password).
5. Run `TSL: Run Diagnostic Wizard`.
6. Run `TSL: Run Preflight`.
7. Open a `.tsl` file and run:
   - `TSL: Run Lint on Current File`
   - `TSL: Run Smoke on Current File`

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
- `TSL: Run Diagnostic Wizard`

Validation adapter setting:

- `tslWorkbench.validation.adapter`: `auto` (default) / `mock` / `pytsl`
- Recommended default for mixed environments: `auto`

## First-use path (recommended)

1. Configure `tslWorkbench.backend.mode` and `tslWorkbench.backend.root` (if needed).
2. Run `TSL: Configure Connection`.
3. Run `TSL: Run Preflight`.
4. Open a `.tsl` file and run `TSL: Run Smoke on Current File`.
5. If needed, run `TSL: Ask Codex to Fix Current File`.

On first activation, the extension now gives an in-product next-step prompt (configure connection / run preflight / open settings) based on detected readiness.

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
- Live `pytsl` execution still depends on local SDK/runtime/account environment; use adapter `auto`/`mock` for non-live setups.

## Publisher/Marketplace readiness

Before Marketplace publish, replace package metadata:

- `publisher` in `package.json` (currently placeholder)
- versioning policy and release notes cadence
- final branding/icon review

Current package includes a marketplace icon and preview flag for hardened beta distribution.

## Troubleshooting

See [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) for failure-kind/stage mapping and live-mode diagnostics.
