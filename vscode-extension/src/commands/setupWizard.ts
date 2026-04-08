import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { ConfigurationService } from '../config/configurationService';
import { ConnectionMode, ConnectionProfile } from '../types';

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

  const profile = await chooseConnectionProfile(configuration, mode);
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
  const candidates = [configuration.getBackendRoot(), options.workspaceRoot, bundledBackend, path.resolve(options.extensionPath, '..')]
    .filter((candidate): candidate is string => Boolean(candidate))
    .map((candidate) => path.normalize(candidate));
  const existing = candidates.find(isBackendRoot);

  if (existing) {
    const action = await vscode.window.showInformationMessage(
      `Use TSL backend root?\n${existing}`,
      { modal: true },
      'Use This Backend',
      'Choose Folder'
    );
    if (action === 'Use This Backend') {
      return existing;
    }
    if (!action) {
      return undefined;
    }
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
        detail: 'Try local client bridge first, then fallback to remote API when needed.',
        picked: current === 'auto',
      },
      {
        label: 'local_client_bridge',
        detail: 'Use the installed Tinysoft/AnalyseNG client bridge on this machine.',
        picked: current === 'local_client_bridge',
      },
      {
        label: 'remote_api',
        detail: 'Use a direct host/port API connection when your SDK exposes it.',
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

function candidatePythonPaths(configuredPython: string): string[] {
  const candidates = [configuredPython || 'python', 'python'];
  const envPrefixes = [
    process.env.CONDA_PREFIX,
    process.env.VIRTUAL_ENV,
  ].filter((value): value is string => Boolean(value));
  for (const prefix of envPrefixes) {
    candidates.push(path.join(prefix, process.platform === 'win32' ? 'python.exe' : 'bin/python'));
  }
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    candidates.push(
      path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
      'py'
    );
  } else {
    candidates.push('python3', '/usr/bin/python3', '/usr/local/bin/python3');
  }
  return candidates
    .map((candidate) => candidate.trim())
    .filter((candidate, index, array) => candidate && array.indexOf(candidate) === index)
    .filter((candidate) => !path.isAbsolute(candidate) || fs.existsSync(candidate));
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
  mode: ConnectionMode
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

  const sdkPath = await chooseOptionalFolder({
    title: mode === 'remote_api' ? 'Select optional SDK folder' : 'Select Tinysoft SDK / client folder',
    current: current.sdkPath || current.localClientPath,
    required: mode !== 'remote_api',
  });
  if (sdkPath === undefined) {
    return undefined;
  }

  return {
    profile: {
      host: host.trim(),
      port: Number.parseInt(portInput, 10),
      username: username.trim(),
      mode,
      sdkPath: sdkPath.trim(),
      localClientPath: mode === 'remote_api' ? current.localClientPath : sdkPath.trim(),
    },
    password: password.trim() ? password.trim() : undefined,
  };
}

async function chooseOptionalFolder(args: { title: string; current: string; required: boolean }): Promise<string | undefined> {
  const choices = args.required
    ? ['Choose Folder', 'Enter Path Manually', 'Cancel']
    : ['Skip', 'Choose Folder', 'Enter Path Manually', 'Cancel'];
  const picked = await vscode.window.showQuickPick(choices, {
    title: args.title,
    placeHolder: args.current || (args.required ? 'Choose the local Tinysoft/AnalyseNG installation folder.' : 'Optional.'),
    ignoreFocusOut: true,
  });
  if (!picked || picked === 'Cancel') {
    return undefined;
  }
  if (picked === 'Skip') {
    return '';
  }
  if (picked === 'Enter Path Manually') {
    const value = await vscode.window.showInputBox({
      title: args.title,
      value: args.current,
      validateInput: (input) => (args.required && !input.trim() ? 'Path is required.' : undefined),
      ignoreFocusOut: true,
    });
    return value?.trim();
  }
  const selected = await vscode.window.showOpenDialog({
    title: args.title,
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    defaultUri: args.current && fs.existsSync(args.current) ? vscode.Uri.file(args.current) : undefined,
    openLabel: 'Use Folder',
  });
  return selected?.[0]?.fsPath;
}
