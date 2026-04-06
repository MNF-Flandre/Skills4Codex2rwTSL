import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ExtensionRuntimeState } from '../types';

export async function askCodexFixCurrentFile(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel
): Promise<void> {
  const filePath = getCurrentTslFilePath() ?? state.lastFilePath;
  if (!filePath) {
    throw new Error('No TSL file selected for Codex handoff.');
  }

  const reportPath = state.lastReportPath || runner.getLastReportPath();
  const payload = await runner.askFix(filePath, reportPath);
  const repair = payload.repair_payload ?? {};
  const prompt = buildCodexPrompt('fix', repair);
  await emitPrompt(prompt);

  state.codexHandoffStatus = 'Prompt ready';
  state.lastFilePath = filePath;
  output.appendLine('Codex handoff prompt generated for fix flow.');
}

export async function askCodexExplainCurrentError(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel
): Promise<void> {
  const filePath = getCurrentTslFilePath() ?? state.lastFilePath;
  if (!filePath) {
    throw new Error('No TSL file selected for error explanation handoff.');
  }

  const reportPath = state.lastReportPath || runner.getLastReportPath();
  const payload = await runner.askFix(filePath, reportPath);
  const prompt = buildCodexPrompt('explain', payload.repair_payload ?? {});
  await emitPrompt(prompt);

  state.codexHandoffStatus = 'Explain prompt ready';
  output.appendLine('Codex handoff prompt generated for explain flow.');
}

export async function askCodexContinueFromReport(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel
): Promise<void> {
  const filePath = state.lastFilePath || getCurrentTslFilePath();
  if (!filePath) {
    throw new Error('No TSL file available to continue from report.');
  }

  const reportPath = state.lastReportPath || runner.getLastReportPath();
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report not found: ${reportPath}`);
  }

  const payload = await runner.askFix(filePath, reportPath);
  const prompt = buildCodexPrompt('continue', payload.repair_payload ?? {});
  await emitPrompt(prompt);

  state.codexHandoffStatus = 'Continue prompt ready';
  output.appendLine('Codex handoff prompt generated for continue-from-report flow.');
}

function getCurrentTslFilePath(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'tsl') {
    return undefined;
  }
  return editor.document.uri.fsPath;
}

function buildCodexPrompt(mode: 'fix' | 'explain' | 'continue', payload: Record<string, unknown>): string {
  const source = String(payload.source ?? '');
  const diagnostics = payload.diagnostics ?? [];
  const validationMode = String(payload.validation_mode ?? 'unknown');
  const failureKind = String(payload.failure_kind ?? 'unknown');
  const diffSummary = String(payload.diff_summary ?? '');
  const mismatchFields = JSON.stringify(payload.mismatch_fields ?? []);
  const referenceStrategy = String(payload.reference_strategy ?? 'unknown');
  const runtimeAdapter = String(payload.runtime_adapter ?? 'unknown');
  const runtimeStage = String(payload.runtime_stage ?? '');
  const runtimeErrors = JSON.stringify(payload.runtime_errors ?? []);
  const trace = JSON.stringify(payload.runtime_intermediate_trace ?? []);
  const finalEnv = JSON.stringify(payload.runtime_final_env ?? {});
  const suggested = String(payload.suggested_next_action ?? '');
  const minimalRepro = JSON.stringify(payload.minimal_repro_case ?? {});

  const objective =
    mode === 'fix'
      ? 'Please patch the TSL code to pass validation while preserving intent.'
      : mode === 'explain'
        ? 'Please explain root cause, failure layer, and smallest safe fix.'
        : 'Please continue from this report and propose next executable patch + validation order.';

  return [
    '# TSL Codex Handoff',
    '',
    `Objective: ${objective}`,
    `Validation mode: ${validationMode}`,
    `Failure kind: ${failureKind}`,
    `Diff summary: ${diffSummary}`,
    `Mismatch fields: ${mismatchFields}`,
    `Reference strategy: ${referenceStrategy}`,
    `Runtime adapter: ${runtimeAdapter}`,
    `Runtime stage: ${runtimeStage}`,
    `Runtime errors: ${runtimeErrors}`,
    `Suggested next action: ${suggested}`,
    '',
    '## Lint diagnostics',
    JSON.stringify(diagnostics, null, 2),
    '',
    '## Runtime intermediate trace',
    trace,
    '',
    '## Runtime final_env',
    finalEnv,
    '',
    '## Minimal repro case',
    minimalRepro,
    '',
    '## Current TSL source',
    '```tsl',
    source,
    '```',
  ].join('\n');
}

async function emitPrompt(prompt: string): Promise<void> {
  const outputMode = String(vscode.workspace.getConfiguration('tslWorkbench').get('codex.handoffOutput', 'both'));

  if (outputMode === 'clipboard' || outputMode === 'both') {
    await vscode.env.clipboard.writeText(prompt);
  }

  if (outputMode === 'newDocument' || outputMode === 'both') {
    const doc = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: prompt,
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  }
}
