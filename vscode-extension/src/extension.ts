import * as vscode from 'vscode';
import { PythonBackendRunner } from './backend/pythonRunner';
import { ConfigurationService } from './config/configurationService';
import {
  askCodexContinueFromReport,
  askCodexExplainCurrentError,
  askCodexFixCurrentFile,
  askCodexHandOffSelection,
} from './commands/codexHandoff';
import { prepareCodexWorkspaceContext } from './commands/codexWorkspaceContext';
import { runDiagnosticWizard } from './commands/diagnosticWizard';
import { installTslPyRuntime } from './commands/installTslPyRuntime';
import { openLastReport, runLintCurrentFile, runPreflight, runValidationMode } from './commands/runValidation';
import { runSetupWizard } from './commands/setupWizard';
import { PathResolver } from './services/pathResolver';
import { ExtensionRuntimeState } from './types';
import { TslWorkbenchProvider } from './views/tslWorkbenchProvider';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const output = vscode.window.createOutputChannel('TSL Workbench');
  const diagnostics = vscode.languages.createDiagnosticCollection('tsl-validation');
  const configuration = new ConfigurationService(context.secrets);

  let pathResolver: PathResolver | undefined;
  let runner: PythonBackendRunner | undefined;
  let lastDiscoveryError = '';

  const state: ExtensionRuntimeState = {
    connectionSummary: 'not configured',
    backendSummary: 'setup required',
    preflightStatus: 'unknown',
    validationStatus: 'unknown',
    lastValidationMode: '',
    lastFailureKind: 'none',
    lastReportPath: '',
    lastFilePath: '',
    codexHandoffStatus: 'idle',
    statusBarSummary: '$(warning) TSL Setup required',
  };

  const provider = new TslWorkbenchProvider(state);
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'tslWorkbench.configureConnection';
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
    statusBar.command = runner ? 'tslWorkbench.runPreflight' : 'tslWorkbench.configureConnection';
    statusBar.color = state.statusBarSummary.includes('Failed')
      ? new vscode.ThemeColor('errorForeground')
      : state.statusBarSummary.includes('Ready') || state.statusBarSummary.includes('Passed')
        ? new vscode.ThemeColor('charts.green')
        : undefined;
  };

  const rebuildRuntime = async (showError: boolean): Promise<boolean> => {
    try {
      pathResolver = new PathResolver({
        workspaceRoot,
        extensionPath: context.extensionPath,
        backendMode: configuration.getBackendMode(),
        configuredBackendRoot: configuration.getBackendRoot(),
        pythonModulePath: configuration.getBackendPythonModulePath(),
      });
      runner = new PythonBackendRunner(output, configuration, pathResolver);
      lastDiscoveryError = '';
      state.backendSummary = summarizeBackend(pathResolver);
      state.lastReportPath = pathResolver.resolveValidationReportPath(configuration.getValidationReportPath());
      state.connectionSummary = await runner.getConnectionSummary();
      const hint = await runner.getConnectionHint();
      state.statusBarSummary =
        hint === 'ready'
          ? '$(check) TSL Ready'
          : hint === 'blocked'
            ? '$(warning) TSL Config incomplete'
            : '$(warning) TSL Setup required';
      refreshUi();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runner = undefined;
      pathResolver = undefined;
      lastDiscoveryError = message;
      state.backendSummary = `setup required (${message})`;
      state.connectionSummary = 'backend not discovered';
      state.lastReportPath = '';
      state.statusBarSummary = '$(warning) TSL Setup required';
      output.appendLine(`[setup] Backend discovery pending: ${message}`);
      refreshUi();
      if (showError) {
        vscode.window.showWarningMessage(`TSL Workbench setup is incomplete: ${message}`, 'Start Setup').then((action) => {
          if (action === 'Start Setup') {
            void vscode.commands.executeCommand('tslWorkbench.configureConnection');
          }
        });
      }
      return false;
    }
  };

  const ensureRunnerInteractive = async (): Promise<PythonBackendRunner> => {
    if (runner) {
      return runner;
    }
    await rebuildRuntime(false);
    if (runner) {
      return runner;
    }
    const action = await vscode.window.showInformationMessage(
      `TSL Workbench needs one-time setup before running commands.${lastDiscoveryError ? `\n${lastDiscoveryError}` : ''}`,
      { modal: false },
      'Start Setup',
      'Cancel'
    );
    if (action !== 'Start Setup') {
      throw new Error('TSL Workbench setup is required.');
    }
    const saved = await runSetupWizard(configuration, { workspaceRoot, extensionPath: context.extensionPath, output });
    if (!saved) {
      throw new Error('TSL Workbench setup was cancelled.');
    }
    await rebuildRuntime(true);
    if (!runner) {
      throw new Error(`TSL backend is still unavailable.${lastDiscoveryError ? ` ${lastDiscoveryError}` : ''}`);
    }
    return runner;
  };

  const ensureRunnerAndResolver = async (): Promise<{ runner: PythonBackendRunner; resolver: PathResolver }> => {
    const liveRunner = await ensureRunnerInteractive();
    if (!pathResolver) {
      throw new Error('TSL backend resolver is unavailable. Run TSL: Configure Connection.');
    }
    return { runner: liveRunner, resolver: pathResolver };
  };

  context.subscriptions.push(
    registerSafeCommand('tslWorkbench.runSetupWizard', output, async () => {
      const saved = await runSetupWizard(configuration, { workspaceRoot, extensionPath: context.extensionPath, output });
      if (!saved) {
        return;
      }
      await rebuildRuntime(true);
      if (runner) {
        state.connectionSummary = await runner.getConnectionSummary();
      }
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.configureConnection', output, async () => {
      const saved = await runSetupWizard(configuration, { workspaceRoot, extensionPath: context.extensionPath, output });
      if (!saved) {
        return;
      }
      await rebuildRuntime(true);
      if (runner) {
        state.connectionSummary = await runner.getConnectionSummary();
      }
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runPreflight', output, async () => {
      const liveRunner = await ensureRunnerInteractive();
      await runPreflight(liveRunner, state, output);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runLintCurrentFile', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await runLintCurrentFile(liveRunner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runSmokeCurrentFile', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await runValidationMode('smoke', liveRunner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runSpecCurrentFile', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await runValidationMode('spec', liveRunner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.runOracleCurrentFile', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await runValidationMode('oracle', liveRunner, diagnostics, state, output, targetUri);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.openLastReport', output, async () => {
      await openLastReport(state);
    }),
    registerSafeCommand('tslWorkbench.askCodexFixCurrentFile', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await askCodexFixCurrentFile(liveRunner, state, output, targetUri, context.extensionPath);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexExplainCurrentError', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await askCodexExplainCurrentError(liveRunner, state, output, targetUri, context.extensionPath);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexContinueFromReport', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await askCodexContinueFromReport(liveRunner, state, output, targetUri, context.extensionPath);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.askCodexHandOffSelection', output, async (targetUri?: vscode.Uri) => {
      const liveRunner = await ensureRunnerInteractive();
      await askCodexHandOffSelection(liveRunner, state, output, targetUri, context.extensionPath);
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.prepareCodexContext', output, async (targetUri?: vscode.Uri) => {
      const runtime = await ensureRunnerAndResolver();
      await prepareCodexWorkspaceContext({
        runner: runtime.runner,
        configuration,
        resolver: runtime.resolver,
        state,
        output,
        extensionPath: context.extensionPath,
        targetUri,
      });
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.installTslPyRuntime', output, async () => {
      const liveRunner = await ensureRunnerInteractive();
      await installTslPyRuntime(liveRunner, configuration, output);
      state.connectionSummary = await liveRunner.getConnectionSummary();
      state.statusBarSummary = '$(check) TSLPy Runtime Checked';
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.clearStoredPassword', output, async () => {
      await configuration.clearPassword();
      await rebuildRuntime(false);
      state.statusBarSummary = '$(warning) TSL Config incomplete';
      vscode.window.showInformationMessage('TSL password removed from SecretStorage.');
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.resetConnection', output, async () => {
      await configuration.resetConnectionSettings();
      await rebuildRuntime(false);
      state.statusBarSummary = runner ? '$(warning) TSL Setup required' : '$(warning) TSL Setup required';
      vscode.window.showInformationMessage('TSL connection settings reset.');
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.revealConnectionSummary', output, async () => {
      const runtime = await ensureRunnerAndResolver();
      const summary = [
        `Connection: ${await runtime.runner.getConnectionSummary()}`,
        `Backend: ${summarizeBackend(runtime.resolver)}`,
        `Report path: ${runtime.runner.getLastReportPath()}`,
      ].join('\n');
      vscode.window.showInformationMessage(summary, { modal: false });
    }),
    registerSafeCommand('tslWorkbench.runDiagnosticWizard', output, async () => {
      const runtime = await ensureRunnerAndResolver();
      await runDiagnosticWizard(runtime.runner, configuration, runtime.resolver, state, output);
      state.statusBarSummary = state.statusBarSummary.includes('Failed')
        ? state.statusBarSummary
        : '$(tools) TSL Diagnostics Updated';
      refreshUi();
    }),
    registerSafeCommand('tslWorkbench.refreshSidebar', output, async () => {
      await rebuildRuntime(false);
      refreshUi();
    })
  );

  await rebuildRuntime(false);
  output.appendLine('TSL Workbench activated.');
  void showStartupSetupOnce(context, runner !== undefined);
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

async function showStartupSetupOnce(context: vscode.ExtensionContext, isReady: boolean): Promise<void> {
  if (isReady) {
    return;
  }
  const key = 'tslWorkbench.setupWizardPrompt.v1';
  if (context.workspaceState.get<boolean>(key)) {
    return;
  }
  const action = await vscode.window.showInformationMessage(
    'TSL Workbench needs a one-time setup: backend root, connection mode, Python path, then host/login.',
    'Start Setup',
    'Later'
  );
  await context.workspaceState.update(key, true);
  if (action === 'Start Setup') {
    await vscode.commands.executeCommand('tslWorkbench.configureConnection');
  }
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
