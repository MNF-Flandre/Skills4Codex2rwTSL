import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ConfigurationService } from '../config/configurationService';

export async function installTslPyRuntime(
  runner: PythonBackendRunner,
  configuration: ConfigurationService,
  output: vscode.OutputChannel
): Promise<void> {
  const current = await configuration.getConnectionProfile();
  const picked = await vscode.window.showQuickPick(['Use Current SDK Path', 'Choose Tinysoft/AnalyseNG Folder', 'Cancel'], {
    title: 'Bind local TSLPy runtime',
    placeHolder: current.sdkPath || current.localClientPath || 'Choose the folder containing TSLPy*.pyd',
    ignoreFocusOut: true,
  });
  if (!picked || picked === 'Cancel') {
    return;
  }

  let sdkPath = current.sdkPath || current.localClientPath;
  if (picked === 'Choose Tinysoft/AnalyseNG Folder' || !sdkPath) {
    const selected = await vscode.window.showOpenDialog({
      title: 'Select Tinysoft/AnalyseNG folder containing TSLPy*.pyd',
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: sdkPath && fs.existsSync(sdkPath) ? vscode.Uri.file(sdkPath) : undefined,
      openLabel: 'Use Folder',
    });
    sdkPath = selected?.[0]?.fsPath || '';
  }
  if (!sdkPath) {
    return;
  }

  const probe = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Checking TSLPy runtime...', cancellable: false },
    () => runner.probeTslPyRuntime(sdkPath, false)
  );
  output.appendLine(`TSLPy runtime probe: ${JSON.stringify(summarizeProbe(probe), null, 2)}`);

  if (probe.status !== 'pass') {
    const expected = String(probe.expected_module || 'matching TSLPy*.pyd');
    vscode.window.showErrorMessage(`TSLPy runtime check failed. Expected ${expected}. See TSL Workbench output for details.`);
    return;
  }

  const profile = await configuration.getConnectionProfile();
  await configuration.updateConnectionProfile({
    host: profile.host,
    port: profile.port,
    username: profile.username,
    mode: profile.mode,
    sdkPath,
    localClientPath: profile.mode === 'remote_api' ? profile.localClientPath : sdkPath,
  });

  const action = await vscode.window.showInformationMessage(
    `TSLPy runtime is importable from ${sdkPath}. Save a .pth link into this Python environment too?`,
    'Write .pth Link',
    'Skip'
  );
  if (action === 'Write .pth Link') {
    const install = await runner.probeTslPyRuntime(sdkPath, true);
    output.appendLine(`TSLPy .pth link result: ${JSON.stringify(summarizeProbe(install), null, 2)}`);
    if (install.status === 'pass') {
      vscode.window.showInformationMessage('TSLPy runtime linked into the selected Python user site-packages.');
      return;
    }
    vscode.window.showWarningMessage('TSLPy runtime is usable through TSL Workbench settings, but writing the .pth link failed.');
    return;
  }

  vscode.window.showInformationMessage('TSLPy runtime path saved in TSL Workbench settings.');
}

function summarizeProbe(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    status: payload.status,
    expected_module: payload.expected_module,
    recommended_sdk_path: payload.recommended_sdk_path,
    install: payload.install,
    explanation: payload.explanation,
  };
}
