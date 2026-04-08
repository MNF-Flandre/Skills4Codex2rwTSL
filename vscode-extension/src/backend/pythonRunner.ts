import { execFile } from 'node:child_process';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { ConfigurationService } from '../config/configurationService';
import { PathResolver } from '../services/pathResolver';
import { AskFixPayload, BackendSummary, ConnectionProfile, LintPayload, PreflightPayload, ValidationMode, ValidationPayload } from '../types';
import {
  buildRunnerEnv,
  buildRunnerExecOptions,
  buildValidateArgs,
  ensureFileExists,
  formatRunnerExecError,
  parseJsonPayload,
} from './runnerUtils';

export class PythonBackendRunner {
  public constructor(
    private readonly output: vscode.OutputChannel,
    private readonly configuration: ConfigurationService,
    private readonly pathResolver: PathResolver
  ) {}

  public async lint(filePath: string): Promise<LintPayload> {
    return this.runCli<LintPayload>(['-m', 'tsl_validation.cli', 'lint', filePath]);
  }

  public async preflight(casePath?: string): Promise<PreflightPayload> {
    const smokeCase = casePath || this.pathResolver.resolveValidationCasePath('smoke', this.configuration.getValidationCasePath('smoke'));
    return this.runCli<PreflightPayload>(['-m', 'tsl_validation.cli', 'preflight', '--case', smokeCase]);
  }

  public async probeTslPyRuntime(sdkPath?: string, writePth = false): Promise<Record<string, unknown>> {
    const args = ['-m', 'tsl_validation.cli', 'tslpy-runtime'];
    if (sdkPath) {
      args.push('--sdk-path', sdkPath);
    }
    if (writePth) {
      args.push('--write-pth');
    }
    return this.runCli<Record<string, unknown>>(args);
  }

  public getPreflightCasePath(): string {
    return this.pathResolver.resolveValidationCasePath('smoke', this.configuration.getValidationCasePath('smoke'));
  }

  public async validate(filePath: string, mode: ValidationMode): Promise<ValidationPayload> {
    const casePath = this.pathResolver.resolveValidationCasePath(mode, this.configuration.getValidationCasePath(mode));
    const taskPath = this.pathResolver.resolveValidationTaskPath(this.configuration.getValidationTaskPath());
    const reportPath = this.pathResolver.resolveValidationReportPath(this.configuration.getValidationReportPath());
    const adapter = this.configuration.getValidationAdapter();

    return this.runCli<ValidationPayload>(buildValidateArgs(filePath, mode, adapter, casePath, taskPath, reportPath));
  }

  public async askFix(filePath: string, reportPath: string): Promise<AskFixPayload> {
    const ideBridge = this.pathResolver.getIdeBridgePath();
    return this.runCli<AskFixPayload>([ideBridge, 'ask-fix', '--file', filePath, '--report', reportPath]);
  }

  public async showDiff(reportPath: string): Promise<Record<string, unknown>> {
    const ideBridge = this.pathResolver.getIdeBridgePath();
    return this.runCli<Record<string, unknown>>([ideBridge, 'show-diff', '--report', reportPath]);
  }

  public getLastReportPath(): string {
    return this.pathResolver.resolveValidationReportPath(this.configuration.getValidationReportPath());
  }

  public getBackendSummary(): BackendSummary {
    return this.pathResolver.getBackendSummary();
  }

  public async getConnectionProfile(): Promise<ConnectionProfile> {
    return this.configuration.getConnectionProfile();
  }

  public async clearStoredPassword(): Promise<void> {
    await this.configuration.clearPassword();
  }

  public async resetConnectionConfiguration(): Promise<void> {
    await this.configuration.resetConnectionSettings();
  }

  public async configureConnectionInteractive(): Promise<void> {
    const current = await this.configuration.getConnectionProfile();
    const backend = this.pathResolver.getBackendSummary();

    const host = await vscode.window.showInputBox({
      title: 'TSL Host',
      prompt: 'Runtime host (required)',
      value: current.host,
      validateInput: (value) => (value.trim() ? undefined : 'Host is required.'),
      ignoreFocusOut: true,
    });
    if (host === undefined) {
      return;
    }

    const portInput = await vscode.window.showInputBox({
      title: 'TSL Port',
      prompt: 'Runtime port (1-65535)',
      value: current.port > 0 ? String(current.port) : '',
      validateInput: (value) => {
        if (!/^\d+$/.test(value.trim())) {
          return 'Port must be an integer between 1 and 65535.';
        }
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
          return 'Port must be an integer between 1 and 65535.';
        }
        return undefined;
      },
      ignoreFocusOut: true,
    });
    if (portInput === undefined) {
      return;
    }

    const username = await vscode.window.showInputBox({
      title: 'TSL Username',
      prompt: 'Runtime username (optional)',
      value: current.username,
      ignoreFocusOut: true,
    });
    if (username === undefined) {
      return;
    }

    const mode = await vscode.window.showQuickPick(
      [
        { label: 'auto', detail: 'Try local bridge first and fallback to remote API when needed.' },
        { label: 'local_client_bridge', detail: 'Use local Tinysoft client bridge installed on this machine.' },
        { label: 'remote_api', detail: 'Connect to remote API endpoint with credentials.' },
      ],
      { title: 'Connection Mode', ignoreFocusOut: true, canPickMany: false }
    );
    if (!mode) {
      return;
    }

    const sdkPath = await vscode.window.showInputBox({
      title: 'Local SDK Path (optional)',
      prompt: 'Used as PYTSL_SDK_PATH to help Python discover SDK modules',
      value: current.sdkPath,
      ignoreFocusOut: true,
    });
    if (sdkPath === undefined) {
      return;
    }

    const localClientPath = await vscode.window.showInputBox({
      title: 'Local Client Path (optional)',
      prompt: 'Used as TSL_CLIENT_DIR for local_client_bridge mode',
      value: current.localClientPath,
      ignoreFocusOut: true,
    });
    if (localClientPath === undefined) {
      return;
    }

    const password = await vscode.window.showInputBox({
      title: 'TSL Password',
      prompt: 'Stored in VS Code SecretStorage. Leave empty to keep current password.',
      password: true,
      ignoreFocusOut: true,
    });
    if (password === undefined) {
      return;
    }

    await this.configuration.updateConnectionProfile({
      host: host.trim(),
      port: Number.parseInt(portInput, 10),
      username: username.trim(),
      mode: mode.label as ConnectionProfile['mode'],
      sdkPath: sdkPath.trim(),
      localClientPath: localClientPath.trim(),
    });
    if (password.trim()) {
      await this.configuration.setPassword(password.trim());
    }

    const backendRoot = await vscode.window.showInputBox({
      title: 'Backend Root (optional)',
      prompt: `Current backend root: ${backend.backendRoot}. Leave empty to keep current value.`,
      value: this.configuration.getBackendRoot(),
      ignoreFocusOut: true,
    });
    if (backendRoot === undefined) {
      return;
    }
    if (backendRoot.trim() !== this.configuration.getBackendRoot()) {
      await this.configuration.updateBackendRoot(backendRoot.trim());
      vscode.window.showInformationMessage(
        'Backend root setting updated. Reload window or run "Developer: Reload Window" if backend path changed significantly.'
      );
    }

    const runNow = await vscode.window.showQuickPick(['Run Preflight', 'Skip'], {
      title: 'Connection saved. Run preflight now?',
      ignoreFocusOut: true,
    });
    if (runNow === 'Run Preflight') {
      await this.preflight();
    }
  }

  public async getConnectionSummary(): Promise<string> {
    const profile = await this.configuration.getConnectionProfile();
    const hostPort = profile.host && profile.port > 0 ? `${profile.host}:${profile.port}` : 'not configured';
    const userState = profile.username ? 'user:set' : 'user:missing';
    const pwdState = profile.hasPassword ? 'password:yes' : 'password:no';
    return `${profile.mode} ${hostPort} (${userState}, ${pwdState})`;
  }

  public async getConnectionHint(): Promise<string> {
    const profile = await this.configuration.getConnectionProfile();
    if (!profile.host || profile.port <= 0) {
      return 'not_configured';
    }
    if (!profile.hasPassword) {
      return 'blocked';
    }
    return 'ready';
  }

  private async buildEnv(): Promise<NodeJS.ProcessEnv> {
    const profile = await this.configuration.getConnectionProfile();
    const password = await this.configuration.getPassword();
    return buildRunnerEnv(process.env, profile, password, this.pathResolver.getPythonModuleRoot());
  }

  private async runCli<T>(args: string[]): Promise<T> {
    const pythonPath = this.configuration.getPythonPath() || 'python';
    const env = await this.buildEnv();
    const backendRoot = this.pathResolver.getBackendRoot();
    ensureFileExists(path.join(backendRoot, 'python', 'ide_bridge.py'));

    this.output.appendLine(`$ ${pythonPath} ${args.join(' ')}`);

    const result = await new Promise<{ stdout: string; stderr: string; errorMessage: string }>((resolve) => {
      const execOptions = buildRunnerExecOptions(backendRoot);
      execFile(
        pythonPath,
        args,
        {
          cwd: execOptions.cwd,
          env,
          timeout: execOptions.timeout,
          maxBuffer: execOptions.maxBuffer,
        },
        (error, stdout, stderr) => {
          resolve({ stdout: stdout ?? '', stderr: stderr ?? '', errorMessage: error?.message ?? '' });
        }
      );
    });

    if (result.stderr.trim()) {
      this.output.appendLine(result.stderr.trim());
    }
    if (!result.stdout.trim()) {
      if (result.errorMessage) {
        throw new Error(formatRunnerExecError(result.errorMessage, result.stderr ?? '', result.stdout ?? ''));
      }
      throw new Error('Backend returned empty output.');
    }

    let payload: T;
    try {
      payload = parseJsonPayload<T>(result.stdout);
    } catch (error) {
      if (result.stdout.trim()) {
        this.output.appendLine(result.stdout.trim());
      }
      if (result.errorMessage) {
        throw new Error(formatRunnerExecError(result.errorMessage, result.stderr ?? '', result.stdout ?? ''));
      }
      throw error;
    }

    const status = (payload as any)?.status ?? 'ok';
    const command = (payload as any)?.command ?? 'backend';
    const failureKind = (payload as any)?.failure_kind ? ` failure=${(payload as any).failure_kind}` : '';
    const mode = (payload as any)?.mode ? ` mode=${(payload as any).mode}` : '';
    this.output.appendLine(`[backend] ${command} status=${status}${mode}${failureKind}`);

    if (status === 'error') {
      throw new Error(String((payload as any)?.error || result.errorMessage || 'Backend returned error status.'));
    }
    return payload;
  }
}
