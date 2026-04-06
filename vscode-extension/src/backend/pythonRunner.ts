import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { AskFixPayload, LintPayload, PreflightPayload, ValidationMode, ValidationPayload } from '../types';

const PASSWORD_SECRET_KEY = 'tslWorkbench.connection.password';

export class PythonBackendRunner {
  public constructor(
    private readonly workspaceRoot: string,
    private readonly output: vscode.OutputChannel,
    private readonly secretStorage: vscode.SecretStorage
  ) {}

  public async lint(filePath: string): Promise<LintPayload> {
    return this.runCli<LintPayload>(['-m', 'tsl_validation.cli', 'lint', filePath]);
  }

  public async preflight(casePath: string): Promise<PreflightPayload> {
    return this.runCli<PreflightPayload>(['-m', 'tsl_validation.cli', 'preflight', '--case', casePath]);
  }

  public async validate(filePath: string, mode: ValidationMode): Promise<ValidationPayload> {
    const casePath = this.resolvePath(this.getConfig(`validation.casePath${capitalize(mode)}`));
    const taskPath = this.resolvePath(this.getConfig('validation.taskPath'));
    const reportPath = this.resolvePath(this.getConfig('validation.reportPath'));

    return this.runCli<ValidationPayload>([
      '-m',
      'tsl_validation.cli',
      'validate',
      filePath,
      '--case',
      casePath,
      '--task',
      taskPath,
      '--adapter',
      'pytsl',
      '--mode',
      mode,
      '--lint-policy',
      'warn',
      '--report',
      reportPath,
    ]);
  }

  public async askFix(filePath: string, reportPath: string): Promise<AskFixPayload> {
    return this.runCli<AskFixPayload>(['python/ide_bridge.py', 'ask-fix', '--file', filePath, '--report', reportPath]);
  }

  public async showDiff(reportPath: string): Promise<Record<string, unknown>> {
    return this.runCli<Record<string, unknown>>(['python/ide_bridge.py', 'show-diff', '--report', reportPath]);
  }

  public getLastReportPath(): string {
    return this.resolvePath(this.getConfig('validation.reportPath'));
  }

  public async configureConnectionInteractive(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');

    const host = await vscode.window.showInputBox({
      title: 'TSL Host',
      prompt: 'Enter runtime host',
      value: this.getConfig('connection.host'),
      ignoreFocusOut: true,
    });
    if (host === undefined) {
      return;
    }

    const portInput = await vscode.window.showInputBox({
      title: 'TSL Port',
      prompt: 'Enter runtime port',
      value: String(this.getConfig('connection.port')),
      ignoreFocusOut: true,
    });
    if (portInput === undefined) {
      return;
    }

    const username = await vscode.window.showInputBox({
      title: 'TSL Username',
      prompt: 'Enter runtime username',
      value: this.getConfig('connection.username'),
      ignoreFocusOut: true,
    });
    if (username === undefined) {
      return;
    }

    const mode = await vscode.window.showQuickPick(['local_client_bridge', 'remote_api'], {
      title: 'Connection Mode',
      ignoreFocusOut: true,
      canPickMany: false,
    });
    if (!mode) {
      return;
    }

    const sdkPath = await vscode.window.showInputBox({
      title: 'Local SDK Path (Optional)',
      prompt: 'Path for PYTSL_SDK_PATH',
      value: this.getConfig('connection.sdkPath'),
      ignoreFocusOut: true,
    });
    if (sdkPath === undefined) {
      return;
    }

    const localClientPath = await vscode.window.showInputBox({
      title: 'Local Client Path (Optional)',
      prompt: 'Path for local client bridge',
      value: this.getConfig('connection.localClientPath'),
      ignoreFocusOut: true,
    });
    if (localClientPath === undefined) {
      return;
    }

    const password = await vscode.window.showInputBox({
      title: 'TSL Password',
      prompt: 'Enter runtime password (stored in SecretStorage)',
      password: true,
      ignoreFocusOut: true,
    });
    if (password === undefined) {
      return;
    }

    await Promise.all([
      cfg.update('connection.host', host, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.port', Number.parseInt(portInput, 10) || 0, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.username', username, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.mode', mode, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.sdkPath', sdkPath, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.localClientPath', localClientPath, vscode.ConfigurationTarget.Workspace),
      this.secretStorage.store(PASSWORD_SECRET_KEY, password),
    ]);

    const runNow = await vscode.window.showQuickPick(['Yes', 'No'], {
      title: 'Run preflight now?',
      ignoreFocusOut: true,
    });
    if (runNow === 'Yes') {
      const casePath = this.resolvePath(this.getConfig('validation.casePathSmoke'));
      await this.preflight(casePath);
    }
  }

  public async getConnectionSummary(): Promise<string> {
    const host = this.getConfig('connection.host');
    const port = this.getConfig('connection.port');
    const mode = this.getConfig('connection.mode');
    const user = this.getConfig('connection.username');
    const hasPassword = Boolean(await this.secretStorage.get(PASSWORD_SECRET_KEY));
    const auth = user && hasPassword ? `${user}/secret` : 'incomplete';
    return `${mode} ${host}:${port} (${auth})`;
  }

  private getConfig(key: string): string {
    return String(vscode.workspace.getConfiguration('tslWorkbench').get(key, ''));
  }

  private resolvePath(configPath: string): string {
    if (!configPath) {
      return this.workspaceRoot;
    }
    return path.isAbsolute(configPath) ? configPath : path.join(this.workspaceRoot, configPath);
  }

  private async buildEnv(): Promise<NodeJS.ProcessEnv> {
    const password = (await this.secretStorage.get(PASSWORD_SECRET_KEY)) ?? '';
    const host = this.getConfig('connection.host');
    const port = this.getConfig('connection.port');
    const username = this.getConfig('connection.username');
    const mode = this.getConfig('connection.mode');
    const sdkPath = this.getConfig('connection.sdkPath');
    const localClientPath = this.getConfig('connection.localClientPath');

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PYTHONPATH: path.join(this.workspaceRoot, 'python'),
      PYTHONUTF8: '1',
      PYTHONIOENCODING: 'utf-8',
      PYTSL_CONNECTION_MODE: mode,
      PYTSL_HOST: host,
      PYTSL_PORT: String(port),
      PYTSL_USERNAME: username,
      PYTSL_PASSWORD: password,
    };

    if (sdkPath) {
      env.PYTSL_SDK_PATH = sdkPath;
    }
    if (localClientPath) {
      env.TSL_CLIENT_DIR = localClientPath;
    }
    return env;
  }

  private async runCli<T>(args: string[]): Promise<T> {
    const pythonPath = this.getConfig('pythonPath') || 'python';
    const env = await this.buildEnv();

    this.output.appendLine(`$ ${pythonPath} ${args.join(' ')}`);

    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      execFile(
        pythonPath,
        args,
        {
          cwd: this.workspaceRoot,
          env,
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`${error.message}\n${stderr || stdout}`));
            return;
          }
          resolve({ stdout: stdout ?? '', stderr: stderr ?? '' });
        }
      );
    });

    if (result.stderr.trim()) {
      this.output.appendLine(result.stderr.trim());
    }
    this.output.appendLine(result.stdout.trim());

    const payload = parseJsonPayload<T>(result.stdout);
    return payload;
  }
}

function parseJsonPayload<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Backend returned empty output.');
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error('Failed to parse backend JSON payload.');
  }
}

function capitalize(text: string): string {
  if (!text) {
    return text;
  }
  return text[0].toUpperCase() + text.slice(1);
}

export function ensureFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}
