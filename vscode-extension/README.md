# TSL Workbench VS Code Extension

A VS Code extension prototype for TSL development that reuses the existing Python backend (`python/tsl_validation` + `python/ide_bridge.py`) and provides Codex-friendly handoff commands without private APIs.

## Features

- Sidebar workbench (Tree View) for connection/preflight/validation/handoff actions
- Native configuration via VS Code settings + command input flows
- SecretStorage-based password handling (`tslWorkbench.connection.password`)
- Current-file commands for `.tsl`:
  - Run Lint
  - Run Smoke
  - Run Spec
  - Run Oracle
- Output channel: **TSL Workbench**
- Problems diagnostics from lint results
- Codex handoff prompt generation:
  - copy to clipboard
  - open in new markdown document

## Prerequisites

- VS Code >= 1.90
- Python runtime available in PATH
- Repository opened as a workspace root

## Local Development

From `/home/runner/work/Skills4Codex2rwTSL/Skills4Codex2rwTSL/vscode-extension`:

```bash
npm install
npm run compile
```

Then press `F5` in VS Code to launch Extension Development Host.

## Backend Wiring

This extension calls Python commands directly:

- `python -m tsl_validation.cli lint`
- `python -m tsl_validation.cli preflight`
- `python -m tsl_validation.cli validate --mode smoke|spec|oracle`
- `python python/ide_bridge.py ask-fix`

Environment variables are injected from extension settings and SecretStorage.

## Configure Connection

Run command: **TSL: Configure Connection**

It collects:

- host
- port
- username
- password (SecretStorage)
- connection mode
- optional sdk path
- optional local client path

## Package `.vsix`

```bash
npm run package
```

This runs `vsce package` and produces a local `.vsix` artifact.

## Marketplace-Ready Notes

- Publisher placeholder is set to `todo-publisher` (replace before publishing).
- Command/view/config contributions are declared in `package.json`.
- Structure is ready for `vsce package` and future Marketplace submission.
