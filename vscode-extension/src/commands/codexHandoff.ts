import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ExtensionRuntimeState } from '../types';
import { buildCodexPrompt, HandoffMode, PromptStyle } from './codexPrompt';
import { buildFallbackRepairPayloadFromSource, HandoffOutputMode, summarizeHandoffReady } from './handoffCore';

type OutputMode = HandoffOutputMode;

export async function askCodexFixCurrentFile(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string
): Promise<void> {
  await handoffFromFileOrSelection('fix', runner, state, output, false, targetUri, extensionPath);
}

export async function askCodexExplainCurrentError(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string
): Promise<void> {
  await handoffFromFileOrSelection('explain', runner, state, output, false, targetUri, extensionPath);
}

export async function askCodexContinueFromReport(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string
): Promise<void> {
  await handoffFromFileOrSelection('continue', runner, state, output, false, targetUri, extensionPath);
}

export async function askCodexHandOffSelection(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string
): Promise<void> {
  await handoffFromFileOrSelection('fix', runner, state, output, true, targetUri, extensionPath);
}

async function handoffFromFileOrSelection(
  mode: HandoffMode,
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  forceSelection = false,
  targetUri?: vscode.Uri,
  extensionPath?: string
): Promise<void> {
  const filePath = getCurrentTslFilePath(targetUri) ?? state.lastFilePath;
  if (!filePath) {
    throw new Error('No TSL file selected for Codex handoff.');
  }
  const reportPath = state.lastReportPath || runner.getLastReportPath();
  if (mode === 'continue' && !fs.existsSync(reportPath)) {
    throw new Error(`Report not found: ${reportPath}`);
  }

  const hasReport = fs.existsSync(reportPath);
  const repair =
    hasReport
      ? (await runner.askFix(filePath, reportPath)).repair_payload ?? {}
      : buildFallbackRepairPayloadFromSource(fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '', mode);
  const selectedSource = getCurrentSelectionSource();
  const source = forceSelection && !selectedSource ? '' : selectedSource || String(repair.source ?? '');
  if (forceSelection && !source) {
    throw new Error('No TSL selection found. Select TSL text and run handoff again.');
  }

  const style = getPromptStyle();
  const prompt = buildCodexPrompt(mode, { ...repair, source, skill_docs: getBundledSkillDocs(extensionPath) }, style);
  const outputMode = getOutputMode();
  const outputPath = await emitPrompt(prompt, outputMode);

  state.codexHandoffStatus = `${mode} ready (${style}/${outputMode})`;
  state.lastFilePath = filePath;
  state.statusBarSummary = '$(comment-discussion) TSL Handoff Ready';
  const ready = summarizeHandoffReady(mode, style, outputMode, outputPath);
  output.appendLine(ready);
  vscode.window.showInformationMessage(ready);
}

function getBundledSkillDocs(extensionPath?: string): Record<string, unknown> {
  if (!extensionPath) {
    return {};
  }
  const docsRoot = path.join(extensionPath, 'resources', 'tsl-docs');
  const manifestPath = path.join(docsRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { docs_root: docsRoot, files: [], missing_manifest: true };
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
    const files = Array.isArray(manifest.files)
      ? manifest.files.map((file) => {
          if (!file || typeof file !== 'object') {
            return file;
          }
          const item = file as Record<string, unknown>;
          const relativePath = String(item.path ?? '');
          return {
            ...item,
            path: relativePath ? path.join(docsRoot, relativePath) : '',
          };
        })
      : [];
    return { ...manifest, docs_root: docsRoot, files };
  } catch (error) {
    return {
      docs_root: docsRoot,
      files: [],
      manifest_error: error instanceof Error ? error.message : String(error),
    };
  }
}

function getCurrentTslFilePath(targetUri?: vscode.Uri): string | undefined {
  if (targetUri?.scheme === 'file' && targetUri.fsPath.toLowerCase().endsWith('.tsl')) {
    return targetUri.fsPath;
  }
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'tsl') {
    return undefined;
  }
  return editor.document.uri.fsPath;
}

function getCurrentSelectionSource(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'tsl' || editor.selection.isEmpty) {
    return '';
  }
  return editor.document.getText(editor.selection).trim();
}

function getPromptStyle(): PromptStyle {
  return String(vscode.workspace.getConfiguration('tslWorkbench').get('codex.promptStyle', 'full')) === 'concise' ? 'concise' : 'full';
}

function getOutputMode(): OutputMode {
  const mode = String(vscode.workspace.getConfiguration('tslWorkbench').get('codex.handoffOutput', 'both'));
  if (mode === 'clipboard' || mode === 'newDocument' || mode === 'workspaceTempFile') {
    return mode;
  }
  return 'both';
}

export async function emitPrompt(prompt: string, outputMode: OutputMode): Promise<string | undefined> {
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

  if (outputMode === 'workspaceTempFile') {
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspace) {
      throw new Error('Open a workspace folder before using workspaceTempFile handoff mode.');
    }
    const dir = path.join(workspace, '.tsl-workbench');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `codex-handoff-${Date.now()}.md`);
    fs.writeFileSync(filePath, prompt, 'utf-8');
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc, { preview: false });
    return filePath;
  }
  return undefined;
}
