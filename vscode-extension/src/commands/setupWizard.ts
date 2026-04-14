import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { ConfigurationService } from '../config/configurationService';
import { ConnectionMode, ConnectionProfile } from '../types';
import { candidatePythonPaths } from './pythonDiscovery';
import {
  buildTslPySearchRoots,
  pickTslPyFolderManually,
  runTslPyRuntimeProbe,
  summarizeTslPyProbe,
} from './tslpyRuntimeSupport';

const BACKEND_MARKERS = ['python/ide_bridge.py', 'python/tsl_validation/cli.py'];

interface SetupWizardOptions {
  workspaceRoot?: string;
  extensionPath: string;
  output?: vscode.OutputChannel;
}

export async function runSetupWizard(configuration: ConfigurationService, options: SetupWizardOptions): Promise<boolean> {
  const backendRoot = await chooseBackendRoot(configuration, options);
  if (!backendRoot) {
    return false;
  }
  await configuration.updateBackendRoot(backendRoot);
  await configuration.updateBackendMode('external_workspace_mode');
  await configuration.updateBackendPythonModulePath('python');

  const mode = await chooseConnectionMode(configuration);
  if (!mode) {
    return false;
  }

  const pythonPath = await chooseAndValidatePythonPath(configuration, backendRoot, options.output);
  if (!pythonPath) {
    return false;
  }
  await configuration.updatePythonPath(pythonPath);

  const runtimePaths = await detectOrChooseTslPyRuntime(configuration, backendRoot, pythonPath, mode, options);
  if (!runtimePaths) {
    return false;
  }

  const profile = await chooseConnectionProfile(configuration, mode, runtimePaths);
  if (!profile) {
    return false;
  }
  await configuration.updateConnectionProfile(profile.profile);
  if (profile.password !== undefined) {
    await configuration.setPassword(profile.password);
  }

  vscode.window.showInformationMessage('TSL Workbench setup saved. You can now run TSL: Run Preflight.');
  return true;
}

function isBackendRoot(candidate: string): boolean {
  if (!candidate || !fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
    return false;
  }
  return BACKEND_MARKERS.every((marker) => fs.existsSync(path.join(candidate, marker)));
}

async function chooseBackendRoot(configuration: ConfigurationService, options: SetupWizardOptions): Promise<string | undefined> {
  const bundledBackend = path.join(options.extensionPath, 'resources', 'tsl-backend');
  const candidates = [configuration.getBackendRoot(), bundledBackend, options.workspaceRoot, path.resolve(options.extensionPath, '..')]
    .filter((candidate): candidate is string => Boolean(candidate))
    .map((candidate) => path.normalize(candidate));
  const existing = candidates.find(isBackendRoot);
  const bundled = path.normalize(bundledBackend);

  if (isBackendRoot(bundled)) {
    options.output?.appendLine(`Setup wizard: using bundled backend at ${bundled}`);
    return bundled;
  }

  if (existing) {
    options.output?.appendLine(`Setup wizard: using detected backend at ${existing}`);
    return existing;
  }

  while (true) {
    const selected = await vscode.window.showOpenDialog({
      title: 'Select TSL backend repository root',
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Use Backend Root',
      defaultUri: existing ? vscode.Uri.file(existing) : options.workspaceRoot ? vscode.Uri.file(options.workspaceRoot) : undefined,
    });
    const folder = selected?.[0]?.fsPath;
    if (!folder) {
      return undefined;
    }
    if (isBackendRoot(folder)) {
      return path.normalize(folder);
    }
    const action = await vscode.window.showErrorMessage(
      `Invalid backend root. Required files: ${BACKEND_MARKERS.join(', ')}`,
      'Choose Again',
      'Cancel'
    );
    if (action !== 'Choose Again') {
      return undefined;
    }
  }
}

async function chooseConnectionMode(configuration: ConfigurationService): Promise<ConnectionMode | undefined> {
  const current = (await configuration.getConnectionProfile()).mode;
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: 'auto',
        detail: 'Recommended. Try remote API first, then fallback to local client bridge when needed.',
        picked: current === 'auto',
      },
      {
        label: 'local_client_bridge',
        detail: 'Use the installed Tinysoft/AnalyseNG client bridge on this machine.',
        picked: current === 'local_client_bridge',
      },
      {
        label: 'remote_api',
        detail: 'Use only the direct host/port API connection and do not try the local client bridge.',
        picked: current === 'remote_api',
      },
    ],
    {
      title: 'Step 1/3: Choose TSL connection mode',
      placeHolder: 'Use auto unless you need to force a specific execution path.',
      ignoreFocusOut: true,
    }
  );
  return picked?.label as ConnectionMode | undefined;
}

async function chooseAndValidatePythonPath(
  configuration: ConfigurationService,
  backendRoot: string,
  output?: vscode.OutputChannel
): Promise<string | undefined> {
  let defaultValue = configuration.getPythonPath() || 'python';
  const candidates = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Discovering Python interpreters...', cancellable: false },
    () => discoverPythonCandidates(defaultValue)
  );
  while (true) {
    const picked = await vscode.window.showQuickPick(
      [
        ...candidates.map((candidate) => ({
          label: candidate.label,
          description: candidate.path,
          detail: candidate.detail,
          pythonPath: candidate.path,
        })),
        {
          label: 'Enter Python path manually',
          description: '',
          detail: 'Paste or type python.exe / python path.',
          pythonPath: '',
        },
      ],
      {
        title: 'Step 2/3: Python executable',
        placeHolder: 'Default: use the first validated Python candidate, or enter a path manually.',
        ignoreFocusOut: true,
      }
    );
    if (!picked) {
      return undefined;
    }

    let pythonPath = picked.pythonPath;
    if (!pythonPath) {
      const input = await vscode.window.showInputBox({
        title: 'Step 2/3: Python executable',
        prompt: 'Paste or type the Python executable used to run the TSL backend.',
        value: defaultValue,
        validateInput: (value) => (value.trim() ? undefined : 'Python path is required.'),
        ignoreFocusOut: true,
      });
      if (input === undefined) {
        return undefined;
      }
      pythonPath = input.trim();
    }
    defaultValue = pythonPath.trim();
    const validation = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Validating Python + TSL backend...', cancellable: false },
      () => validatePythonBackend(defaultValue, backendRoot)
    );
    if (validation.ok) {
      output?.appendLine(`Setup wizard: Python backend validation passed (${validation.detail}).`);
      return defaultValue;
    }
    output?.appendLine(`Setup wizard: Python backend validation failed: ${validation.detail}`);
    const action = await vscode.window.showErrorMessage(
      `Python/backend validation failed: ${validation.detail}`,
      'Try Another Python',
      'Cancel'
    );
    if (action !== 'Try Another Python') {
      return undefined;
    }
  }
}

async function detectOrChooseTslPyRuntime(
  configuration: ConfigurationService,
  backendRoot: string,
  pythonPath: string,
  mode: ConnectionMode,
  options: SetupWizardOptions
): Promise<{ sdkPath: string; localClientPath: string } | undefined> {
  const current = await configuration.getConnectionProfile();
  if (mode === 'remote_api') {
    return {
      sdkPath: current.sdkPath,
      localClientPath: current.localClientPath,
    };
  }

  const required = mode === 'local_client_bridge';
  let flow: 'auto' | 'manual' | 'skip' | undefined = await chooseTslPySetupFlow(required);

  while (flow) {
    if (flow === 'skip') {
      return {
        sdkPath: '',
        localClientPath: '',
      };
    }

    if (flow === 'manual') {
      const selectedPath = await pickTslPyFolderManually({
        title: required
          ? 'Choose the Tinysoft/AnalyseNG folder that contains TSLPy*.pyd.'
          : 'Choose the Tinysoft/AnalyseNG folder, or cancel to return.',
        current: current.sdkPath || current.localClientPath,
        required,
      });
      if (selectedPath === undefined) {
        return undefined;
      }
      if (!selectedPath) {
        return {
          sdkPath: '',
          localClientPath: '',
        };
      }

      const manualProbe = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Validating selected TSLPy runtime...', cancellable: false },
        () =>
          runTslPyRuntimeProbe({
            pythonPath,
            backendRoot,
            sdkPaths: [selectedPath],
            maxDepth: 0,
          })
      );
      options.output?.appendLine(`Setup wizard: manual runtime check -> ${summarizeTslPyProbe(manualProbe)}`);
      if (manualProbe.status === 'pass') {
        return {
          sdkPath: selectedPath,
          localClientPath: selectedPath,
        };
      }

      flow = await chooseTslPyRetryFlow(
        `The selected folder does not expose an importable ${manualProbe.expected_module || 'TSLPy runtime'} for this Python.`,
        required
      );
      continue;
    }

    const searchRoots = buildTslPySearchRoots(options.workspaceRoot, [
      current.sdkPath,
      current.localClientPath,
    ]);
    const probe = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Detecting local TSLPy runtime...', cancellable: false },
      () =>
        runTslPyRuntimeProbe({
          pythonPath,
          backendRoot,
          sdkPaths: [current.sdkPath, current.localClientPath],
          searchRoots,
          maxDepth: 3,
        })
    );
    options.output?.appendLine(`Setup wizard: ${summarizeTslPyProbe(probe)}`);

    const detectedPath = String(probe.recommended_sdk_path || '').trim();
    if (detectedPath) {
      vscode.window.showInformationMessage(`TSLPy runtime detected automatically: ${detectedPath}`);
      return {
        sdkPath: detectedPath,
        localClientPath: detectedPath,
      };
    }

    const expected = probe.expected_module || 'TSLPy runtime';
    flow = await chooseTslPyRetryFlow(
      `No importable ${expected} was auto-detected for the selected Python. You can choose the Tinysoft/AnalyseNG folder manually instead.`,
      required
    );
  }

  return undefined;
}

async function chooseTslPySetupFlow(required: boolean): Promise<'auto' | 'manual' | 'skip' | undefined> {
  const choices: Array<{ label: string; value: 'auto' | 'manual' | 'skip'; detail: string }> = [
    {
      label: 'Auto detect TSLPy runtime (Recommended)',
      value: 'auto' as const,
      detail: 'Scan common Tinysoft/AnalyseNG folders and validate importability for the selected Python.',
    },
    {
      label: 'Choose Tinysoft folder manually',
      value: 'manual' as const,
      detail: 'Select the folder that contains TSLPy*.pyd, such as AnalyseNG.NET.',
    },
  ];
  if (!required) {
    choices.push({
      label: 'Skip local TSLPy setup',
      value: 'skip' as const,
      detail: 'Continue without local binding. auto mode can still fall back to remote_api later.',
    });
  }
  const picked = await vscode.window.showQuickPick(choices, {
    title: 'TSLPy runtime setup',
    placeHolder: 'Choose how TSL Workbench should locate the local Tinysoft runtime.',
    ignoreFocusOut: true,
  });
  return picked?.value;
}

async function chooseTslPyRetryFlow(
  message: string,
  required: boolean
): Promise<'auto' | 'manual' | 'skip' | undefined> {
  const actions = ['Choose Folder Manually', 'Try Auto Detect Again'];
  if (!required) {
    actions.push('Skip');
  }
  actions.push('Cancel');
  const picked = await vscode.window.showErrorMessage(message, ...actions);
  if (picked === 'Choose Folder Manually') {
    return 'manual';
  }
  if (picked === 'Try Auto Detect Again') {
    return 'auto';
  }
  if (picked === 'Skip') {
    return 'skip';
  }
  return undefined;
}

interface PythonCandidate {
  label: string;
  path: string;
  detail: string;
}

async function discoverPythonCandidates(configuredPython: string): Promise<PythonCandidate[]> {
  const paths = Array.from(new Set(candidatePythonPaths(configuredPython))).filter(Boolean);
  const candidates: PythonCandidate[] = [];
  for (const pythonPath of paths) {
    const probe = await runProcess(pythonPath, ['--version'], process.cwd(), process.env);
    if (!probe.ok) {
      continue;
    }
    candidates.push({
      label: candidates.length === 0 ? `Use ${path.basename(pythonPath)} (Recommended)` : `Use ${path.basename(pythonPath)}`,
      path: pythonPath,
      detail: probe.detail.trim() || 'Python detected',
    });
  }
  if (!candidates.length) {
    candidates.push({
      label: 'Use python from PATH (Recommended)',
      path: 'python',
      detail: 'No absolute Python executable was auto-detected; try PATH lookup.',
    });
  }
  return candidates;
}

async function validatePythonBackend(pythonPath: string, backendRoot: string): Promise<{ ok: boolean; detail: string }> {
  const version = await runProcess(pythonPath, ['--version'], backendRoot, process.env);
  if (!version.ok) {
    return { ok: false, detail: version.detail };
  }
  const env = {
    ...process.env,
    PYTHONPATH: path.join(backendRoot, 'python'),
    PYTHONIOENCODING: 'utf-8',
  };
  const cli = await runProcess(pythonPath, ['-m', 'tsl_validation.cli', '--help'], backendRoot, env);
  if (!cli.ok) {
    return { ok: false, detail: cli.detail };
  }
  return { ok: true, detail: version.detail.trim() || 'python ok' };
}

function runProcess(
  executable: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv
): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    execFile(
      executable,
      args,
      {
        cwd,
        env,
        timeout: 12000,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const text = `${stdout ?? ''}${stderr ? `\n${stderr}` : ''}`.trim();
        if (error) {
          resolve({ ok: false, detail: `${error.message}${text ? `\n${text}` : ''}` });
          return;
        }
        resolve({ ok: true, detail: text || 'ok' });
      }
    );
  });
}

async function chooseConnectionProfile(
  configuration: ConfigurationService,
  mode: ConnectionMode,
  runtimePaths: { sdkPath: string; localClientPath: string }
): Promise<{ profile: Omit<ConnectionProfile, 'hasPassword'>; password?: string } | undefined> {
  const current = await configuration.getConnectionProfile();
  const host = await vscode.window.showInputBox({
    title: 'Step 3/3: Host',
    prompt: 'Runtime host or IP address.',
    value: current.host,
    validateInput: (value) => (value.trim() ? undefined : 'Host is required.'),
    ignoreFocusOut: true,
  });
  if (host === undefined) {
    return undefined;
  }

  const portInput = await vscode.window.showInputBox({
    title: 'Step 3/3: Port',
    prompt: 'Runtime port.',
    value: current.port > 0 ? String(current.port) : '443',
    validateInput: (value) => {
      if (!/^\d+$/.test(value.trim())) {
        return 'Port must be an integer between 1 and 65535.';
      }
      const port = Number.parseInt(value, 10);
      return port >= 1 && port <= 65535 ? undefined : 'Port must be an integer between 1 and 65535.';
    },
    ignoreFocusOut: true,
  });
  if (portInput === undefined) {
    return undefined;
  }

  const username = await vscode.window.showInputBox({
    title: 'Step 3/3: Username',
    prompt: 'Runtime username.',
    value: current.username,
    validateInput: (value) => (value.trim() ? undefined : 'Username is required.'),
    ignoreFocusOut: true,
  });
  if (username === undefined) {
    return undefined;
  }

  const password = await vscode.window.showInputBox({
    title: 'Step 3/3: Password',
    prompt: current.hasPassword ? 'Leave empty to keep the existing stored password.' : 'Stored in VS Code SecretStorage.',
    password: true,
    validateInput: (value) => (!current.hasPassword && !value.trim() ? 'Password is required.' : undefined),
    ignoreFocusOut: true,
  });
  if (password === undefined) {
    return undefined;
  }

  return {
    profile: {
      host: host.trim(),
      port: Number.parseInt(portInput, 10),
      username: username.trim(),
      mode,
      sdkPath: runtimePaths.sdkPath.trim(),
      localClientPath:
        mode === 'remote_api'
          ? current.localClientPath || runtimePaths.localClientPath.trim()
          : runtimePaths.localClientPath.trim() || runtimePaths.sdkPath.trim(),
    },
    password: password.trim() ? password.trim() : undefined,
  };
}
