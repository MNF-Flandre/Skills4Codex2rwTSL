import * as path from 'node:path';
import * as vscode from 'vscode';
import { PythonBackendRunner } from './backend/pythonRunner';
import { askCodexContinueFromReport, askCodexExplainCurrentError, askCodexFixCurrentFile } from './commands/codexHandoff';
import { openLastReport, runLintCurrentFile, runPreflight, runValidationMode } from './commands/runValidation';
import { ExtensionRuntimeState } from './types';
import { TslWorkbenchProvider } from './views/tslWorkbenchProvider';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showWarningMessage('TSL Workbench: open a workspace folder first.');
    return;
  }

  const output = vscode.window.createOutputChannel('TSL Workbench');
  const diagnostics = vscode.languages.createDiagnosticCollection('tsl-validation');

  const state: ExtensionRuntimeState = {
    connectionSummary: 'not configured',
    preflightStatus: 'unknown',
    validationStatus: 'unknown',
    lastValidationMode: '',
    lastReportPath: path.join(workspaceRoot, 'reports', 'vscode_last_report.md'),
    lastFilePath: '',
    codexHandoffStatus: 'idle',
  };

  const runner = new PythonBackendRunner(workspaceRoot, output, context.secrets);
  state.connectionSummary = await runner.getConnectionSummary();

  const provider = new TslWorkbenchProvider(state);
  context.subscriptions.push(
    output,
    diagnostics,
    vscode.window.registerTreeDataProvider('tslWorkbench.sidebar', provider),
    vscode.languages.registerCodeLensProvider({ language: 'tsl', scheme: 'file' }, new TslCodeLensProvider())
  );

  context.subscriptions.push(
    registerSafeCommand('tslWorkbench.configureConnection', async () => {
      await runner.configureConnectionInteractive();
      state.connectionSummary = await runner.getConnectionSummary();
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.runPreflight', async () => {
      await runPreflight(runner, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.runLintCurrentFile', async () => {
      await runLintCurrentFile(runner, diagnostics, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.runSmokeCurrentFile', async () => {
      await runValidationMode('smoke', runner, diagnostics, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.runSpecCurrentFile', async () => {
      await runValidationMode('spec', runner, diagnostics, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.runOracleCurrentFile', async () => {
      await runValidationMode('oracle', runner, diagnostics, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.openLastReport', async () => {
      await openLastReport(state);
    }),
    registerSafeCommand('tslWorkbench.askCodexFixCurrentFile', async () => {
      await askCodexFixCurrentFile(runner, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.askCodexExplainCurrentError', async () => {
      await askCodexExplainCurrentError(runner, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.askCodexContinueFromReport', async () => {
      await askCodexContinueFromReport(runner, state, output);
      provider.refresh();
    }),
    registerSafeCommand('tslWorkbench.refreshSidebar', async () => {
      provider.refresh();
    })
  );

  output.appendLine('TSL Workbench activated.');
}

export function deactivate(): void {}

function registerSafeCommand(command: string, callback: () => Promise<void>): vscode.Disposable {
  return vscode.commands.registerCommand(command, async () => {
    try {
      await callback();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`TSL Workbench: ${message}`);
    }
  });
}

class TslCodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (document.languageId !== 'tsl') {
      return [];
    }

    const position = new vscode.Position(0, 0);
    const range = new vscode.Range(position, position);

    return [
      new vscode.CodeLens(range, {
        command: 'tslWorkbench.runLintCurrentFile',
        title: 'Lint',
      }),
      new vscode.CodeLens(range, {
        command: 'tslWorkbench.runSmokeCurrentFile',
        title: 'Smoke',
      }),
      new vscode.CodeLens(range, {
        command: 'tslWorkbench.askCodexFixCurrentFile',
        title: 'Ask Codex',
      }),
    ];
  }
}
