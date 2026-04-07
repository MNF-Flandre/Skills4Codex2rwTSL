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
import { buildStartupGuidance } from './onboarding/startupGuidance';
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
    const action = await vscode.window.showWarningMessage(
      `TSL Workbench backend discovery failed: ${message}`,
      'Open Settings'
    );
    if (action === 'Open Settings') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'tslWorkbench.backend.root');
    }
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
    statusBarSummary: '$(circle-slash) TSL Not configured',
  };

  const runner = new PythonBackendRunner(output, configuration, pathResolver);
  const profile = await runner.getConnectionProfile();
  state.connectionSummary = await runner.getConnectionSummary();
  const hint = await runner.getConnectionHint();
  const startup = buildStartupGuidance({
    hasWorkspace: Boolean(workspaceRoot),
    connectionHint: hint === 'ready' ? 'ready' : hint === 'blocked' ? 'blocked' : 'not_configured',
    hasPassword: profile.hasPassword,
    host: profile.host,
    port: profile.port,
  });
  state.statusBarSummary = startup.statusBarSummary;

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
    statusBar.color = state.statusBarSummary.includes('Failed')
      ? new vscode.ThemeColor('errorForeground')
      : state.statusBarSummary.includes('Ready')
        ? new vscode.ThemeColor('charts.green')
        : undefined;
  };

  context.subscriptions.push(
    registerSafeCommand('tslWorkbench.configureConnection', output, async () => {
      await runner.configureConnectionInteractive();
      state.connectionSummary = await runner.getConnectionSummary();
      state.statusBarSummary = (await runner.getConnectionHint()) === 'ready' ? '$(check) TSL Ready' : '$(warning) TSL Config incomplete';
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runPreflight', output, async () => {
      await runPreflight(runner, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runLintCurrentFile', output, async (targetUri?: vscode.Uri) => {
      await runLintCurrentFile(runner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runSmokeCurrentFile', output, async (targetUri?: vscode.Uri) => {
      await runValidationMode('smoke', runner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runSpecCurrentFile', output, async (targetUri?: vscode.Uri) => {
      await runValidationMode('spec', runner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runOracleCurrentFile', output, async (targetUri?: vscode.Uri) => {
      await runValidationMode('oracle', runner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.openLastReport', output, async () => {
      await openLastReport(state);
    }),
    registerSafeCommand('tslWorkbench.askCodexFixCurrentFile', output, async (targetUri?: vscode.Uri) => {
      await askCodexFixCurrentFile(runner, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexExplainCurrentError', output, async (targetUri?: vscode.Uri) => {
      await askCodexExplainCurrentError(runner, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexContinueFromReport', output, async (targetUri?: vscode.Uri) => {
      await askCodexContinueFromReport(runner, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexHandOffSelection', output, async (targetUri?: vscode.Uri) => {
      await askCodexHandOffSelection(runner, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.clearStoredPassword', output, async () => {
      await runner.clearStoredPassword();
      state.connectionSummary = await runner.getConnectionSummary();
      state.statusBarSummary = '$(warning) TSL Config incomplete';
      vscode.window.showInformationMessage('TSL password removed from SecretStorage.');
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.resetConnection', output, async () => {
      await runner.resetConnectionConfiguration();
      state.connectionSummary = await runner.getConnectionSummary();
      state.statusBarSummary = '$(circle-slash) TSL Not configured';
      vscode.window.showInformationMessage('TSL connection settings reset.');
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.revealConnectionSummary', output, async () => {
      const summary = [
        `Connection: ${await runner.getConnectionSummary()}`,
        `Backend: ${summarizeBackend(pathResolver)}`,
        `Report path: ${runner.getLastReportPath()}`,
      ].join('\n');
      vscode.window.showInformationMessage(summary, { modal: false });
    }),
    registerSafeCommand('tslWorkbench.refreshSidebar', output, async () => {
      refreshUi();
    })
  );

  output.appendLine('TSL Workbench activated.');
  void showStartupGuidanceOnce(context, startup.message, startup.actions);
}

export function deactivate(): void {}

function summarizeBackend(resolver: PathResolver): string {
  const backend = resolver.getBackendSummary();
  return `${backend.effectiveMode} @ ${backend.backendRoot}`;
}

function registerSafeCommand(
  command: string,
  output: vscode.OutputChannel,
  callback: (...args: any[]) => Promise<void>
): vscode.Disposable {
  return vscode.commands.registerCommand(command, async (...args: any[]) => {
    try {
      await callback(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      output.appendLine(`[error] ${command}: ${message}`);
      const action = await vscode.window.showErrorMessage(`TSL Workbench: ${message}`, 'Open Output');
      if (action === 'Open Output') {
        output.show(true);
      }
    }
  });
}

async function showStartupGuidanceOnce(
  context: vscode.ExtensionContext,
  message: string,
  actions: Array<'Configure Connection' | 'Run Preflight' | 'Open Settings'>
): Promise<void> {
  const key = 'tslWorkbench.startupGuidance.v1';
  if (context.workspaceState.get<boolean>(key)) {
    return;
  }
  const action = await vscode.window.showInformationMessage(message, ...actions);
  if (action === 'Configure Connection') {
    await vscode.commands.executeCommand('tslWorkbench.configureConnection');
  } else if (action === 'Run Preflight') {
    await vscode.commands.executeCommand('tslWorkbench.runPreflight');
  } else if (action === 'Open Settings') {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'tslWorkbench');
  }
  await context.workspaceState.update(key, true);
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
