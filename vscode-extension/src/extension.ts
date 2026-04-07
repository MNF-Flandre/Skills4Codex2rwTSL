import * as vscode from 'vscode';
import { PythonBackendRunner } from './backend/pythonRunner';
import { ConfigurationService } from './config/configurationService';
import {
  askCodexContinueFromReport,
  askCodexExplainCurrentError,
  askCodexFixCurrentFile,
  askCodexHandOffSelection,
} from './commands/codexHandoff';
import { openLastReport, runLintCurrentFile, runPreflight, runValidationMode } from './commands/runValidation';
import { PathResolver } from './services/pathResolver';
import { ExtensionRuntimeState } from './types';
import { TslWorkbenchProvider } from './views/tslWorkbenchProvider';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const output = vscode.window.createOutputChannel('TSL Workbench');
  const diagnostics = vscode.languages.createDiagnosticCollection('tsl-validation');

  const configuration = new ConfigurationService(context.secrets);
  let pathResolver: PathResolver;
  try {
    pathResolver = new PathResolver({
      workspaceRoot,
      extensionPath: context.extensionPath,
      backendMode: configuration.getBackendMode(),
      configuredBackendRoot: configuration.getBackendRoot(),
      pythonModulePath: configuration.getBackendPythonModulePath(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showWarningMessage(`TSL Workbench backend discovery failed: ${message}`);
    return;
  }

  const state: ExtensionRuntimeState = {
    connectionSummary: 'not configured',
    backendSummary: summarizeBackend(pathResolver),
    preflightStatus: 'unknown',
    validationStatus: 'unknown',
    lastValidationMode: '',
    lastFailureKind: 'none',
    lastReportPath: pathResolver.resolveValidationReportPath(configuration.getValidationReportPath()),
    lastFilePath: '',
    codexHandoffStatus: 'idle',
    statusBarSummary: 'TSL: Not configured',
  };

  const runner = new PythonBackendRunner(output, configuration, pathResolver);
  state.connectionSummary = await runner.getConnectionSummary();
  const hint = await runner.getConnectionHint();
  state.statusBarSummary = hint === 'ready' ? 'TSL: Ready' : hint === 'blocked' ? 'TSL: Config incomplete' : 'TSL: Not configured';

  const provider = new TslWorkbenchProvider(state);
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'tslWorkbench.runPreflight';
  statusBar.text = state.statusBarSummary;
  statusBar.tooltip = 'TSL Workbench status';
  statusBar.show();

  context.subscriptions.push(
    output,
    diagnostics,
    statusBar,
    vscode.window.registerTreeDataProvider('tslWorkbench.sidebar', provider),
    vscode.languages.registerCodeLensProvider({ language: 'tsl', scheme: 'file' }, new TslCodeLensProvider())
  );

  const refreshUi = () => {
    provider.refresh();
    statusBar.text = state.statusBarSummary;
  };

  context.subscriptions.push(
    registerSafeCommand('tslWorkbench.configureConnection', async () => {
      await runner.configureConnectionInteractive();
      state.connectionSummary = await runner.getConnectionSummary();
      state.statusBarSummary = (await runner.getConnectionHint()) === 'ready' ? 'TSL: Ready' : 'TSL: Config incomplete';
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runPreflight', async () => {
      await runPreflight(runner, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runLintCurrentFile', async () => {
      await runLintCurrentFile(runner, diagnostics, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runSmokeCurrentFile', async () => {
      await runValidationMode('smoke', runner, diagnostics, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runSpecCurrentFile', async () => {
      await runValidationMode('spec', runner, diagnostics, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runOracleCurrentFile', async () => {
      await runValidationMode('oracle', runner, diagnostics, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.openLastReport', async () => {
      await openLastReport(state);
    }),
    registerSafeCommand('tslWorkbench.askCodexFixCurrentFile', async () => {
      await askCodexFixCurrentFile(runner, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexExplainCurrentError', async () => {
      await askCodexExplainCurrentError(runner, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexContinueFromReport', async () => {
      await askCodexContinueFromReport(runner, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexHandOffSelection', async () => {
      await askCodexHandOffSelection(runner, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.clearStoredPassword', async () => {
      await runner.clearStoredPassword();
      state.connectionSummary = await runner.getConnectionSummary();
      state.statusBarSummary = 'TSL: Config incomplete';
      vscode.window.showInformationMessage('TSL password removed from SecretStorage.');
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.resetConnection', async () => {
      await runner.resetConnectionConfiguration();
      state.connectionSummary = await runner.getConnectionSummary();
      state.statusBarSummary = 'TSL: Not configured';
      vscode.window.showInformationMessage('TSL connection settings reset.');
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.revealConnectionSummary', async () => {
      const summary = [
        `Connection: ${await runner.getConnectionSummary()}`,
        `Backend: ${summarizeBackend(pathResolver)}`,
        `Report path: ${runner.getLastReportPath()}`,
      ].join('\n');
      vscode.window.showInformationMessage(summary, { modal: false });
    }),
    registerSafeCommand('tslWorkbench.refreshSidebar', async () => {
      refreshUi();
    })
  );

  output.appendLine('TSL Workbench activated.');
}

export function deactivate(): void {}

function summarizeBackend(resolver: PathResolver): string {
  const backend = resolver.getBackendSummary();
  return `${backend.effectiveMode} @ ${backend.backendRoot}`;
}

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
      new vscode.CodeLens(range, { command: 'tslWorkbench.runLintCurrentFile', title: 'TSL: Lint' }),
      new vscode.CodeLens(range, { command: 'tslWorkbench.runSmokeCurrentFile', title: 'TSL: Smoke' }),
      new vscode.CodeLens(range, { command: 'tslWorkbench.runOracleCurrentFile', title: 'TSL: Oracle' }),
      new vscode.CodeLens(range, { command: 'tslWorkbench.askCodexFixCurrentFile', title: 'TSL: Ask Codex' }),
    ];
  }
}

