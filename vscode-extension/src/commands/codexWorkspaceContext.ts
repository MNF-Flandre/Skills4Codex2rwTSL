import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ConfigurationService } from '../config/configurationService';
import { PathResolver } from '../services/pathResolver';
import { ExtensionRuntimeState, ValidationMode } from '../types';

interface PrepareCodexContextInput {
  runner: PythonBackendRunner;
  configuration: ConfigurationService;
  resolver: PathResolver;
  state: ExtensionRuntimeState;
  output: vscode.OutputChannel;
  extensionPath: string;
  targetUri?: vscode.Uri;
}

export async function prepareCodexWorkspaceContext(input: PrepareCodexContextInput): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || input.resolver.getBackendRoot();
  const targetFile = getCurrentTslFilePath(input.targetUri) || input.state.lastFilePath;
  const contextDir = path.join(workspaceRoot, '.tsl-workbench');
  const contextPath = path.join(contextDir, 'CODEX_TSL_WORKBENCH_CONTEXT.md');
  fs.mkdirSync(contextDir, { recursive: true });

  const codexCommands = await detectCodexCommands();
  const content = await buildCodexWorkspaceContext({
    ...input,
    workspaceRoot,
    targetFile,
    codexCommands,
  });
  fs.writeFileSync(contextPath, content, 'utf-8');

  const opener = [
    'Use the local TSL Workbench context for this workspace.',
    `Read this file before editing TSL: ${contextPath}`,
    'Do not use an OpenAI API path for TSL validation; rely on the already configured local VS Code/Codex session and the local TSL Workbench backend.',
  ].join('\n');
  await vscode.env.clipboard.writeText(opener);

  const doc = await vscode.workspace.openTextDocument(contextPath);
  await vscode.window.showTextDocument(doc, { preview: false });

  input.state.codexHandoffStatus = `workspace context ready -> ${contextPath}`;
  input.output.appendLine(`Codex workspace context ready -> ${contextPath}`);
  if (codexCommands.length) {
    input.output.appendLine(`Detected Codex-related VS Code commands: ${codexCommands.join(', ')}`);
  }
  vscode.window.showInformationMessage('TSL Codex context file created and opener prompt copied to clipboard.');
}

async function buildCodexWorkspaceContext(input: PrepareCodexContextInput & {
  workspaceRoot: string;
  targetFile?: string;
  codexCommands: string[];
}): Promise<string> {
  const backend = input.resolver.getBackendSummary();
  const profile = await input.runner.getConnectionProfile();
  const reportPath = input.runner.getLastReportPath();
  const docs = getBundledDocs(input.extensionPath);
  const activeFile = input.targetFile || '(open a .tsl file before asking Codex to edit code)';
  const preflightCase = input.runner.getPreflightCasePath();
  const smokeCase = input.resolver.resolveValidationCasePath('smoke', input.configuration.getValidationCasePath('smoke'));
  const oracleCase = input.resolver.resolveValidationCasePath('oracle', input.configuration.getValidationCasePath('oracle'));
  const taskPath = input.resolver.resolveValidationTaskPath(input.configuration.getValidationTaskPath());
  const reportForShell = reportPath;
  const python = input.configuration.getPythonPath() || 'python';
  const pythonPath = input.resolver.getPythonModuleRoot();
  const smokeCommand = buildValidateCommand(python, pythonPath, activeFile, 'smoke', smokeCase, taskPath, reportForShell);
  const oracleCommand = buildValidateCommand(python, pythonPath, activeFile, 'oracle', oracleCase, taskPath, reportForShell);
  const preflightCommand = buildPreflightCommand(python, pythonPath, preflightCase);

  return [
    '# TSL Workbench Context For Codex',
    '',
    'This workspace has a local TSL Workbench integration. Use it when editing or debugging `.tsl` files.',
    '',
    'Do not ask the user for an OpenAI API key and do not route TSL validation through an API. The intended flow is the already logged-in Codex experience plus the local TSL Workbench backend.',
    '',
    '## Active Target',
    `- TSL file: ${activeFile}`,
    `- Last report: ${reportPath}`,
    `- Last validation mode: ${input.state.lastValidationMode || '(none yet)'}`,
    `- Last failure kind: ${input.state.lastFailureKind || '(none)'}`,
    '',
    '## Local Workbench',
    `- Workspace root: ${input.workspaceRoot}`,
    `- Backend root: ${backend.backendRoot}`,
    `- Backend mode: ${backend.effectiveMode}`,
    `- Python module path: ${backend.pythonModulePath}`,
    `- Python executable: ${python}`,
    `- Connection mode: ${profile.mode}`,
    `- Connection configured: ${profile.host && profile.port > 0 ? 'yes' : 'no'}`,
    `- Username/password: ${profile.username ? 'set' : 'missing'}/${profile.hasPassword ? 'set' : 'missing'}`,
    '',
    '## Validation Commands',
    'Run these from a terminal only if the environment has the same local secrets/configuration as VS Code. Otherwise prefer the TSL Workbench commands from VS Code.',
    '',
    'Preflight:',
    '```powershell',
    preflightCommand,
    '```',
    '',
    'Smoke validation:',
    '```powershell',
    smokeCommand,
    '```',
    '',
    'Oracle validation:',
    '```powershell',
    oracleCommand,
    '```',
    '',
    '## VS Code Commands',
    '- TSL: Run Preflight',
    '- TSL: Run Lint on Current File',
    '- TSL: Run Smoke on Current File',
    '- TSL: Run Oracle on Current File',
    '- TSL: Open Last Report',
    '- TSL: Ask Codex to Fix Current File',
    '- TSL: Prepare Codex Takeover Context',
    '',
    '## Codex Extension Detection',
    input.codexCommands.length
      ? input.codexCommands.map((command) => `- ${command}`).join('\n')
      : '- No Codex-specific VS Code command names were visible from this extension host. Use the installed Codex panel/chat manually and tell it to read this file.',
    '',
    '## TSL Docs To Read First',
    docs.length ? docs.map((doc) => `- ${doc}`).join('\n') : '- Bundled docs manifest was not found. Check resources/tsl-docs in the TSL Workbench extension directory.',
    '',
    '## Operating Rules For Codex',
    '- Prefer small patches and rerun Smoke after edits.',
    '- Use Oracle only when a stable reference source exists.',
    '- Do not commit or print credentials.',
    '- Treat `local_client_bridge` and `remote_api` as fallback-capable; do not ask the user to manually switch modes unless both fail.',
    '- If validation fails, report the failure layer: config, network, SDK import, connect/auth, execute, or normalization.',
    '',
  ].join('\n');
}

async function detectCodexCommands(): Promise<string[]> {
  const commands = await vscode.commands.getCommands(true);
  return commands
    .filter((command) => /codex/i.test(command))
    .filter((command) => !command.startsWith('tslWorkbench.'))
    .sort()
    .slice(0, 20);
}

function getBundledDocs(extensionPath: string): string[] {
  const docsRoot = path.join(extensionPath, 'resources', 'tsl-docs');
  const manifestPath = path.join(docsRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { files?: Array<Record<string, unknown>> };
    return (manifest.files || [])
      .map((item) => {
        const label = String(item.label ?? item.path ?? '').trim();
        const relativePath = String(item.path ?? '').trim();
        const docPath = relativePath ? path.join(docsRoot, relativePath) : '';
        return label && docPath ? `${label}: ${docPath}` : docPath;
      })
      .filter(Boolean);
  } catch {
    return [];
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

function buildPreflightCommand(python: string, pythonPath: string, casePath: string): string {
  return `$env:PYTHONPATH=${quotePowerShell(pythonPath)}; & ${quotePowerShell(python)} -m tsl_validation.cli preflight --case ${quotePowerShell(casePath)}`;
}

function buildValidateCommand(
  python: string,
  pythonPath: string,
  filePath: string,
  mode: ValidationMode,
  casePath: string,
  taskPath: string,
  reportPath: string
): string {
  return [
    `$env:PYTHONPATH=${quotePowerShell(pythonPath)};`,
    '&',
    quotePowerShell(python),
    '-m tsl_validation.cli validate',
    quotePowerShell(filePath),
    '--case',
    quotePowerShell(casePath),
    '--task',
    quotePowerShell(taskPath),
    '--adapter auto',
    '--mode',
    mode,
    '--lint-policy warn',
    '--report',
    quotePowerShell(reportPath),
  ].join(' ');
}

function quotePowerShell(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
