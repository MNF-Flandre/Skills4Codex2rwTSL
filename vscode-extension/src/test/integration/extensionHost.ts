import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

export async function run(): Promise<void> {
  const extension = vscode.extensions.all.find((item) => item.packageJSON?.name === 'tsl-workbench');
  assert.ok(extension, 'tsl-workbench extension should be discoverable in extension host');

  await extension.activate();
  assert.equal(extension.isActive, true, 'extension should activate');

  const commands = await vscode.commands.getCommands(true);
  for (const command of [
    'tslWorkbench.configureConnection',
    'tslWorkbench.runPreflight',
    'tslWorkbench.runLintCurrentFile',
    'tslWorkbench.runValidateCurrentFile',
    'tslWorkbench.openInCodex',
    'tslWorkbench.runDiagnosticWizard',
    'tslWorkbench.refreshSidebar',
  ]) {
    assert.equal(commands.includes(command), true, `expected command to be registered: ${command}`);
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  assert.ok(workspaceFolder, 'workspace folder should be opened for extension host tests');

  await configureWorkspace(workspaceFolder as string);
  await vscode.commands.executeCommand('workbench.view.extension.tslWorkbench');
  await vscode.commands.executeCommand('tslWorkbench.refreshSidebar');

  const samplePath = path.join(workspaceFolder as string, 'sample.tsl');
  if (!fs.existsSync(samplePath)) {
    fs.writeFileSync(samplePath, 'A:=MA(CLOSE,5);', 'utf-8');
  }
  const doc = await vscode.workspace.openTextDocument(samplePath);
  await vscode.window.showTextDocument(doc, { preview: false });

  await vscode.commands.executeCommand('tslWorkbench.runLintCurrentFile', vscode.Uri.file(samplePath));
  await vscode.commands.executeCommand('tslWorkbench.runValidateCurrentFile', vscode.Uri.file(samplePath));
  await vscode.commands.executeCommand('tslWorkbench.runPreflight');
  await vscode.commands.executeCommand('tslWorkbench.openInCodex', vscode.Uri.file(samplePath));
  await vscode.commands.executeCommand('tslWorkbench.runDiagnosticWizard');
}

async function configureWorkspace(workspaceFolder: string): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('tslWorkbench');
  const backendRoot = process.env.TSL_TEST_BACKEND_ROOT;
  assert.ok(
    backendRoot,
    'TSL_TEST_BACKEND_ROOT environment variable must be set to backend repository root for extension host integration tests.'
  );
  await Promise.all([
    cfg.update('backend.mode', 'external_workspace_mode', vscode.ConfigurationTarget.Workspace),
    cfg.update('backend.root', backendRoot as string, vscode.ConfigurationTarget.Workspace),
    cfg.update('validation.adapter', 'mock', vscode.ConfigurationTarget.Workspace),
    cfg.update('connection.host', 'TODO_LOCAL_HOST', vscode.ConfigurationTarget.Workspace),
    cfg.update('connection.port', 443, vscode.ConfigurationTarget.Workspace),
    cfg.update('connection.username', 'test-user', vscode.ConfigurationTarget.Workspace),
    cfg.update('codex.handoffOutput', 'workspaceTempFile', vscode.ConfigurationTarget.Workspace),
  ]);
}
