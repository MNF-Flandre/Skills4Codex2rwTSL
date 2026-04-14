import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ExtensionRuntimeState } from '../types';
import { openCodexWithContext } from './codexDirectIntegration';
import { buildCodexPrompt, HandoffMode, PromptStyle } from './codexPrompt';
import { buildFallbackRepairPayloadFromSource, HandoffOutputMode, summarizeHandoffReady } from './handoffCore';
import { ensureCodexWorkspaceContextFile } from './codexWorkspaceContext';
import { ConfigurationService } from '../config/configurationService';
import { PathResolver } from '../services/pathResolver';

type OutputMode = HandoffOutputMode;

interface OptionalRuntimeContext {
  configuration?: ConfigurationService;
  resolver?: PathResolver;
}

export async function askCodexFixCurrentFile(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string,
  runtime?: OptionalRuntimeContext
): Promise<void> {
  await handoffFromFileOrSelection('fix', runner, state, output, false, targetUri, extensionPath, runtime);
}

export async function openInCodexCurrentFile(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string,
  runtime?: OptionalRuntimeContext
): Promise<void> {
  await handoffFromFileOrSelection('fix', runner, state, output, false, targetUri, extensionPath, runtime, 'open');
}

export async function askCodexExplainCurrentError(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string,
  runtime?: OptionalRuntimeContext
): Promise<void> {
  await handoffFromFileOrSelection('explain', runner, state, output, false, targetUri, extensionPath, runtime);
}

export async function askCodexContinueFromReport(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string,
  runtime?: OptionalRuntimeContext
): Promise<void> {
  await handoffFromFileOrSelection('continue', runner, state, output, false, targetUri, extensionPath, runtime);
}

export async function askCodexHandOffSelection(
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  targetUri?: vscode.Uri,
  extensionPath?: string,
  runtime?: OptionalRuntimeContext
): Promise<void> {
  await handoffFromFileOrSelection('fix', runner, state, output, true, targetUri, extensionPath, runtime);
}

async function handoffFromFileOrSelection(
  mode: HandoffMode,
  runner: PythonBackendRunner,
  state: ExtensionRuntimeState,
  output: vscode.OutputChannel,
  forceSelection = false,
  targetUri?: vscode.Uri,
  extensionPath?: string,
  runtime?: OptionalRuntimeContext,
  displayLabel: string = mode
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
  const direct = runtime?.configuration && runtime?.resolver
    ? await tryDirectCodexOpen({
        mode,
        prompt,
        runner,
        state,
        output,
        targetUri,
        extensionPath,
        runtime: {
          configuration: runtime.configuration,
          resolver: runtime.resolver,
        },
        filePath,
        reportPath,
        selectionText: forceSelection ? source : '',
      })
    : undefined;

  let outputPath: string | undefined;
  let outputMode = getOutputMode();
  if (!direct) {
    outputPath = await emitPrompt(prompt, outputMode);
  } else {
    outputMode = 'workspaceTempFile';
    outputPath = direct.handoffPath;
  }

  state.codexHandoffStatus = direct
    ? `${displayLabel} ready (${style}/${direct.mode})`
    : `${displayLabel} ready (${style}/${outputMode})`;
  state.lastFilePath = filePath;
  state.statusBarSummary = '$(comment-discussion) TSL Handoff Ready';
  const ready = direct
    ? `Codex ready (${displayLabel}/${style}/${direct.mode}) -> ${direct.handoffPath}`
    : summarizeHandoffReady(mode, style, outputMode, outputPath, displayLabel);
  output.appendLine(ready);
  vscode.window.showInformationMessage(ready);
}

async function tryDirectCodexOpen(args: {
  mode: HandoffMode;
  prompt: string;
  runner: PythonBackendRunner;
  state: ExtensionRuntimeState;
  output: vscode.OutputChannel;
  targetUri?: vscode.Uri;
  extensionPath?: string;
  runtime: { configuration: ConfigurationService; resolver: PathResolver };
  filePath: string;
  reportPath: string;
  selectionText: string;
}): Promise<{ mode: string; handoffPath: string } | undefined> {
  if (!args.extensionPath) {
    return undefined;
  }

  try {
    const context = await ensureCodexWorkspaceContextFile({
      runner: args.runner,
      configuration: args.runtime.configuration,
      resolver: args.runtime.resolver,
      state: args.state,
      output: args.output,
      extensionPath: args.extensionPath,
      targetUri: args.targetUri,
    });
    const handoffPath = await writeWorkspacePromptFile(args.prompt);
    const opened = await openCodexWithContext({
      contextPath: context.contextPath,
      handoffPath,
      targetFile: args.filePath,
      reportPath: fs.existsSync(args.reportPath) ? args.reportPath : undefined,
      selectionText: args.selectionText,
      output: args.output,
    });
    args.output.appendLine(`Codex direct integration: ${opened.mode} (${opened.attached.length} attached file(s))`);
    return { mode: opened.mode, handoffPath };
  } catch (error) {
    args.output.appendLine(`[codex] direct integration unavailable, falling back to prompt output: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
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

async function writeWorkspacePromptFile(prompt: string): Promise<string> {
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspace) {
    throw new Error('Open a workspace folder before sending a handoff to Codex.');
  }
  const dir = path.join(workspace, '.tsl-workbench');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `codex-handoff-${Date.now()}.md`);
  fs.writeFileSync(filePath, prompt, 'utf-8');
  return filePath;
}
