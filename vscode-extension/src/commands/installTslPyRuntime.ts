import * as vscode from 'vscode';
import { PythonBackendRunner } from '../backend/pythonRunner';
import { ConfigurationService } from '../config/configurationService';
import {
  buildTslPySearchRoots,
  pickTslPyFolderManually,
  runTslPyRuntimeProbe,
  TslPyRuntimeProbePayload,
} from './tslpyRuntimeSupport';

export async function installTslPyRuntime(
  runner: PythonBackendRunner,
  configuration: ConfigurationService,
  output: vscode.OutputChannel
): Promise<void> {
  const current = await configuration.getConnectionProfile();
  const backend = runner.getBackendSummary();

  const probe = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Scanning for a local TSLPy runtime...', cancellable: false },
    () =>
      runTslPyRuntimeProbe({
        pythonPath: configuration.getPythonPath(),
        backendRoot: backend.backendRoot,
        sdkPaths: [current.sdkPath, current.localClientPath],
        searchRoots: buildTslPySearchRoots(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath, [
          current.sdkPath,
          current.localClientPath,
        ]),
        maxDepth: 3,
      })
  );
  output.appendLine(`TSLPy runtime probe: ${JSON.stringify(summarizeProbe(probe), null, 2)}`);

  let sdkPath = String(probe.recommended_sdk_path || '').trim();
  if (!sdkPath) {
    sdkPath = (
      await pickTslPyFolderManually({
        title: `No importable ${probe.expected_module || 'TSLPy runtime'} was auto-detected. Choose the Tinysoft/AnalyseNG folder.`,
        current: current.sdkPath || current.localClientPath,
        required: true,
      })
    ) || '';
  }
  if (!sdkPath) {
    return;
  }

  const validationProbe =
    probe.status === 'pass' && sdkPath === String(probe.recommended_sdk_path || '').trim()
      ? probe
      : await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Validating selected TSLPy runtime...', cancellable: false },
          () =>
            runTslPyRuntimeProbe({
              pythonPath: configuration.getPythonPath(),
              backendRoot: backend.backendRoot,
              sdkPaths: [sdkPath],
              maxDepth: 0,
            })
        );
  output.appendLine(`TSLPy runtime validation: ${JSON.stringify(summarizeProbe(validationProbe), null, 2)}`);

  if (validationProbe.status !== 'pass') {
    const expected = String(validationProbe.expected_module || 'matching TSLPy*.pyd');
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
    const install = await runTslPyRuntimeProbe({
      pythonPath: configuration.getPythonPath(),
      backendRoot: backend.backendRoot,
      sdkPaths: [sdkPath],
      maxDepth: 0,
      writePth: true,
    });
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

function summarizeProbe(payload: TslPyRuntimeProbePayload): Record<string, unknown> {
  return {
    status: payload.status,
    expected_module: payload.expected_module,
    recommended_sdk_path: payload.recommended_sdk_path,
    install: payload.install,
    explanation: payload.explanation,
  };
}
