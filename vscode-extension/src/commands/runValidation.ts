import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ensureFileExists } from '../backend/runnerUtils';
import { ExtensionRuntimeState, LintDiagnostic, ValidationMode } from '../types';
import {
  suggestPreflightNextAction,
  suggestValidationNextAction,
  summarizePreflightFailure,
  summarizeValidationFailure,
} from './validationFeedback';

export async function runLintCurrentFile(
  runner: PythonBackendRunner,
  diagnostics: vscode.DiagnosticCollection,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri
): Promise<void> {
  const filePath = requireCurrentTslFilePath(targetUri);
  ensureFileExists(filePath);

  const payload = await runner.lint(filePath);
  publishDiagnostics(filePath, payload.diagnostics, diagnostics);

  state.validationStatus = payload.status;
  state.lastValidationMode = 'lint';
  state.lastFailureKind = payload.status === 'fail' ? 'lint_error' : 'none';
  state.lastFilePath = filePath;
  state.statusBarSummary = payload.status === 'pass' ? '$(check) TSL Ready' : '$(error) TSL Lint Failed';

  output.appendLine(`Lint ${payload.status}: ${filePath}`);
  if (payload.status === 'pass') {
    vscode.window.showInformationMessage(`TSL lint passed: ${payload.diagnostic_count} diagnostics.`);
  } else {
    vscode.window.showWarningMessage(`TSL lint failed: ${payload.diagnostic_count} diagnostics. Check Problems + Output.`);
  }
}

export async function runPreflight(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel
): Promise<void> {
  const casePath = runner.getPreflightCasePath();
  ensureFileExists(casePath);

  const payload = await runner.preflight();
  state.preflightStatus = payload.status;
  state.connectionSummary = await runner.getConnectionSummary();
  state.statusBarSummary = payload.status === 'pass' ? '$(check) TSL Preflight Passed' : '$(error) TSL Preflight Failed';

  output.appendLine(`Preflight ${payload.status}: mode=${payload.connection_mode}`);
  if (payload.status === 'pass') {
    vscode.window.showInformationMessage('TSL preflight passed.');
  } else {
    const reason = summarizePreflightFailure(payload);
    const nextAction = suggestPreflightNextAction(payload);
    vscode.window.showWarningMessage(`TSL preflight failed: ${reason}. Next: ${nextAction}`);
  }
}

export async function runValidationMode(
  mode: ValidationMode,
  runner: PythonBackendRunner,
  diagnostics: vscode.DiagnosticCollection,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri
): Promise<void> {
  const filePath = requireCurrentTslFilePath(targetUri);
  ensureFileExists(filePath);

  const payload = await runner.validate(filePath, mode);
  const lintDiagnostics = (payload.result?.diagnostics ?? []) as LintDiagnostic[];
  publishDiagnostics(filePath, lintDiagnostics, diagnostics);

  const reportPath = runner.getLastReportPath();
  state.validationStatus = payload.status;
  state.lastValidationMode = mode;
  state.lastFailureKind = payload.failure_kind || 'none';
  state.lastReportPath = reportPath;
  state.lastFilePath = filePath;
  state.statusBarSummary = payload.status === 'pass' ? `$(check) TSL ${mode} Passed` : `$(error) TSL ${mode} Failed`;

  output.appendLine(`Validation ${mode} ${payload.status}: ${filePath}`);

  const msg = `TSL ${mode} ${payload.status} (${payload.failure_kind || 'none'})`;
  if (payload.status === 'pass') {
    vscode.window.showInformationMessage(msg);
  } else {
    const detail = summarizeValidationFailure(mode, payload);
    const nextAction = suggestValidationNextAction(payload);
    vscode.window.showWarningMessage(`${detail}. Next: ${nextAction}`);
  }
}

export async function openLastReport(state: ExtensionRuntimeState): Promise<void> {
  if (!state.lastReportPath) {
    throw new Error('No report has been generated yet.');
  }
  if (!fs.existsSync(state.lastReportPath)) {
    throw new Error(`Last report file not found: ${state.lastReportPath}. Check tslWorkbench.validation.reportPath and rerun validation.`);
  }
  const doc = await vscode.workspace.openTextDocument(state.lastReportPath);
  await vscode.window.showTextDocument(doc, { preview: false });
}

export function convertLintDiagnostics(filePath: string, lintDiagnostics: LintDiagnostic[]): vscode.Diagnostic[] {
  return lintDiagnostics.map((item) => {
    const line = Math.max(0, (item.range?.[0] ?? 1) - 1);
    const col = Math.max(0, (item.range?.[1] ?? 1) - 1);
    const range = new vscode.Range(line, col, line, col + 1);
    const severity =
      item.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : item.severity === 'warning'
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;

    const d = new vscode.Diagnostic(range, `${item.message} (${item.suggestion})`, severity);
    d.code = item.code;
    d.source = 'tsl-validation';
    return d;
  });
}

function publishDiagnostics(
  filePath: string,
  lintDiagnostics: LintDiagnostic[],
  diagnostics: vscode.DiagnosticCollection
): void {
  diagnostics.set(vscode.Uri.file(filePath), convertLintDiagnostics(filePath, lintDiagnostics));
}

function requireCurrentTslFilePath(targetUri?: vscode.Uri): string {
  if (targetUri?.scheme === 'file' && targetUri.fsPath.toLowerCase().endsWith('.tsl')) {
    return targetUri.fsPath;
  }
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'tsl') {
    throw new Error('Open or select a .tsl file first.');
  }
  return editor.document.uri.fsPath;
}
