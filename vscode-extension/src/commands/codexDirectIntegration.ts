import * as fs from 'node:fs';
import type * as vscode from 'vscode';
import { CodexIntegrationMode, CodexIntegrationSupport, detectCodexIntegration } from './codexIntegrationSupport';

export interface OpenCodexInput {
  contextPath: string;
  handoffPath?: string;
  targetFile?: string;
  reportPath?: string;
  selectionText?: string;
  output: vscode.OutputChannel;
}

export { detectCodexIntegration };

export async function openCodexWithContext(input: OpenCodexInput): Promise<{ mode: CodexIntegrationMode; attached: string[] }> {
  const vscodeApi = await getVSCode();
  const commands = await vscodeApi.commands.getCommands(true);
  const support = detectCodexIntegration(commands);
  if (support.mode === 'openai-codex') {
    const attached = await openOpenAICodexThread(vscodeApi, input, support);
    return { mode: 'openai-codex', attached };
  }
  if (support.mode === 'vscode-chat') {
    await openVsCodeChat(vscodeApi, input);
    return { mode: 'vscode-chat', attached: [] };
  }
  throw new Error('No directly invokable Codex/Chat extension command was detected. Use prompt fallback.');
}

async function openOpenAICodexThread(
  vscodeApi: typeof import('vscode'),
  input: OpenCodexInput,
  support: CodexIntegrationSupport
): Promise<string[]> {
  await vscodeApi.commands.executeCommand('chatgpt.openSidebar');
  if (support.commands.includes('chatgpt.newCodexPanel')) {
    await vscodeApi.commands.executeCommand('chatgpt.newCodexPanel', { source: 'tslWorkbench' });
  } else if (support.commands.includes('chatgpt.newChat')) {
    await vscodeApi.commands.executeCommand('chatgpt.newChat');
  }
  await delay(250);

  const attached: string[] = [];
  for (const filePath of uniqueFiles([input.contextPath, input.handoffPath, input.targetFile, input.reportPath])) {
    const ok = await attachFileToOpenAICodex(vscodeApi, filePath, input.output);
    if (ok) {
      attached.push(filePath);
    }
  }

  if (input.selectionText && support.commands.includes('chatgpt.addToThread')) {
    try {
      await vscodeApi.commands.executeCommand('chatgpt.addToThread');
    } catch (error) {
      input.output.appendLine(`[codex] selection attach skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return attached;
}

async function attachFileToOpenAICodex(
  vscodeApi: typeof import('vscode'),
  filePath: string,
  output: vscode.OutputChannel
): Promise<boolean> {
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }
  const uri = vscodeApi.Uri.file(filePath);
  try {
    await vscodeApi.commands.executeCommand('chatgpt.addFileToThread', uri);
    return true;
  } catch (error) {
    output.appendLine(`[codex] direct file attach failed for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const doc = await vscodeApi.workspace.openTextDocument(uri);
    await vscodeApi.window.showTextDocument(doc, { preview: true, preserveFocus: true });
    await vscodeApi.commands.executeCommand('chatgpt.addFileToThread');
    return true;
  } catch (error) {
    output.appendLine(`[codex] active-editor file attach failed for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function openVsCodeChat(vscodeApi: typeof import('vscode'), input: OpenCodexInput): Promise<void> {
  const query = [
    'Use the local TSL Workbench context for this task.',
    `Read: ${input.contextPath}`,
    input.handoffPath ? `Then read: ${input.handoffPath}` : '',
    input.targetFile ? `Target file: ${input.targetFile}` : '',
    input.reportPath ? `Validation report: ${input.reportPath}` : '',
    'Use local TSL Workbench validation instead of API-based validation.',
  ]
    .filter(Boolean)
    .join('\n');

  await vscodeApi.commands.executeCommand('workbench.action.chat.open', {
    query,
    isPartialQuery: false,
  });
}

async function getVSCode(): Promise<typeof import('vscode')> {
  return import('vscode');
}

function uniqueFiles(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
