import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ConfigurationService } from '../config/configurationService';
import { PathResolver } from '../services/pathResolver';
import { ExtensionRuntimeState } from '../types';
import { DiagnosticCheck, DiagnosticReport, summarizeDiagnosticReport } from './diagnosticModel';

export async function runDiagnosticWizard(
  runner: PythonBackendRunner,
  configuration: ConfigurationService,
  resolver: PathResolver,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel
): Promise<void> {
  const report = await collectDiagnosticReport(runner, configuration, resolver, state);
  const summary = summarizeDiagnosticReport(report);

  output.appendLine('=== TSL Diagnostic Wizard ===');
  output.appendLine(`Generated at: ${report.generatedAt}`);
  output.appendLine(`Backend root: ${report.backendRoot}`);
  for (const check of report.checks) {
    output.appendLine(`[${check.status.toUpperCase()}] ${check.name}: ${check.detail}`);
    output.appendLine(`  Next: ${check.nextAction}`);
  }
  output.appendLine('Last known state:');
  output.appendLine(JSON.stringify(report.lastKnownState, null, 2));
  output.appendLine(`Summary: ${summary}`);
  output.show(true);

  writeDiagnosticArtifact(report);

  const action = await vscode.window.showInformationMessage(`TSL Diagnostic Wizard: ${summary}`, 'Open Output');
  if (action === 'Open Output') {
    output.show(true);
  }
}

export async function collectDiagnosticReport(
  runner: PythonBackendRunner,
  configuration: ConfigurationService,
  resolver: PathResolver,
  state: ExtensionRuntimeState
): Promise<DiagnosticReport> {
  const backendSummary = resolver.getBackendSummary();
  const profile = await runner.getConnectionProfile();
  const checks: DiagnosticCheck[] = [];

  const ideBridgePath = path.join(backendSummary.backendRoot, 'python', 'ide_bridge.py');
  const cliPath = path.join(backendSummary.backendRoot, 'python', 'tsl_validation', 'cli.py');
  checks.push({
    name: 'backend discovery',
    status: fs.existsSync(ideBridgePath) && fs.existsSync(cliPath) ? 'pass' : 'fail',
    detail: fs.existsSync(ideBridgePath) && fs.existsSync(cliPath)
      ? `backend root ok: ${backendSummary.backendRoot}`
      : `backend markers missing under ${backendSummary.backendRoot}`,
    nextAction: 'Set tslWorkbench.backend.root to a valid backend repo root and reload window.',
  });

  const pythonCheck = checkPythonRuntime(configuration.getPythonPath());
  checks.push(pythonCheck);
  checks.push({
    name: 'python module path',
    status: fs.existsSync(resolver.getPythonModuleRoot()) ? 'pass' : 'fail',
    detail: `PYTHONPATH root: ${resolver.getPythonModuleRoot()}`,
    nextAction: 'Fix tslWorkbench.backend.pythonModulePath to a directory that exists under backend root.',
  });

  const hasHostPort = Boolean(profile.host) && profile.port > 0;
  checks.push({
    name: 'connection config',
    status: hasHostPort && profile.hasPassword ? 'pass' : hasHostPort ? 'warn' : 'fail',
    detail: `${profile.mode} ${profile.host || '<missing-host>'}:${profile.port || 0} (password=${profile.hasPassword ? 'yes' : 'no'})`,
    nextAction: hasHostPort
      ? 'If password is missing, run "TSL: Configure Connection" or "TSL: Clear Stored Password" then reconfigure.'
      : 'Run "TSL: Configure Connection" and fill host/port/password.',
  });

  const smokeCase = resolver.resolveValidationCasePath('smoke', configuration.getValidationCasePath('smoke'));
  const specCase = resolver.resolveValidationCasePath('spec', configuration.getValidationCasePath('spec'));
  const oracleCase = resolver.resolveValidationCasePath('oracle', configuration.getValidationCasePath('oracle'));
  const taskPath = resolver.resolveValidationTaskPath(configuration.getValidationTaskPath());
  const reportPath = resolver.resolveValidationReportPath(configuration.getValidationReportPath());

  checks.push(checkPathExists('validation smoke case', smokeCase, true, 'Set tslWorkbench.validation.casePathSmoke to a valid file path.'));
  checks.push(checkPathExists('validation spec case', specCase, true, 'Set tslWorkbench.validation.casePathSpec to a valid file path.'));
  checks.push(checkPathExists('validation oracle case', oracleCase, true, 'Set tslWorkbench.validation.casePathOracle to a valid file path.'));
  checks.push(checkPathExists('validation task path', taskPath, true, 'Set tslWorkbench.validation.taskPath to a valid file path.'));
  checks.push({
    name: 'validation report path',
    status: fs.existsSync(path.dirname(reportPath)) ? 'pass' : 'warn',
    detail: reportPath,
    nextAction: 'Ensure report directory exists or update tslWorkbench.validation.reportPath.',
  });

  checks.push({
    name: 'sdk path hint',
    status: profile.sdkPath ? (fs.existsSync(profile.sdkPath) ? 'pass' : 'warn') : 'warn',
    detail: profile.sdkPath || 'not configured',
    nextAction: 'For local_client_bridge live mode, set connection.sdkPath when pyTSL SDK discovery fails.',
  });
  checks.push({
    name: 'local client path hint',
    status: profile.localClientPath ? (fs.existsSync(profile.localClientPath) ? 'pass' : 'warn') : 'warn',
    detail: profile.localClientPath || 'not configured',
    nextAction: 'For local_client_bridge mode, set connection.localClientPath if runtime client bridge is not auto-detected.',
  });

  checks.push({
    name: 'last known runtime state',
    status: state.preflightStatus === 'fail' || state.validationStatus === 'fail' ? 'warn' : 'pass',
    detail: `preflight=${state.preflightStatus}, validation=${state.validationStatus}, failure=${state.lastFailureKind || 'none'}`,
    nextAction: 'If warning/fail appears, run preflight, then lint/smoke/oracle and inspect Output + report.',
  });

  return {
    generatedAt: new Date().toISOString(),
    backendRoot: backendSummary.backendRoot,
    checks,
    lastKnownState: {
      preflightStatus: state.preflightStatus,
      validationStatus: state.validationStatus,
      lastValidationMode: state.lastValidationMode,
      lastFailureKind: state.lastFailureKind,
      lastReportPath: state.lastReportPath,
    },
  };
}

function checkPythonRuntime(pythonPath: string): DiagnosticCheck {
  try {
    const output = execFileSync(pythonPath || 'python', ['--version'], {
      encoding: 'utf-8',
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      name: 'python runtime',
      status: 'pass',
      detail: `${pythonPath || 'python'} (${output.trim() || 'ok'})`,
      nextAction: 'No action needed.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: 'python runtime',
      status: 'fail',
      detail: `${pythonPath || 'python'} not executable (${message})`,
      nextAction: 'Set tslWorkbench.pythonPath to a valid Python executable and rerun Diagnostic Wizard.',
    };
  }
}

function checkPathExists(name: string, targetPath: string, required: boolean, nextAction: string): DiagnosticCheck {
  const exists = fs.existsSync(targetPath);
  return {
    name,
    status: exists ? 'pass' : required ? 'fail' : 'warn',
    detail: targetPath,
    nextAction,
  };
}

function writeDiagnosticArtifact(report: DiagnosticReport): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    return;
  }
  const dir = path.join(workspaceRoot, '.tsl-workbench');
  fs.mkdirSync(dir, { recursive: true });
  const artifact = path.join(dir, 'diagnostic-last.json');
  fs.writeFileSync(artifact, JSON.stringify(report, null, 2), 'utf-8');
}
