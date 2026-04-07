import * as vscode from 'vscode';
import { BackendMode, ConnectionMode, ConnectionProfile, ValidationMode } from '../types';

const PASSWORD_SECRET_KEY = 'tslWorkbench.connection.password';

export class ConfigurationService {
  public constructor(private readonly secretStorage: vscode.SecretStorage) {}

  public getPythonPath(): string {
    return this.getString('pythonPath', 'python');
  }

  public getBackendMode(): BackendMode {
    const mode = this.getString('backend.mode', 'auto');
    if (mode === 'repo_attached_mode' || mode === 'external_workspace_mode') {
      return mode;
    }
    return 'auto';
  }

  public getBackendRoot(): string {
    return this.getString('backend.root', '');
  }

  public getBackendPythonModulePath(): string {
    return this.getString('backend.pythonModulePath', 'python');
  }

  public getValidationCasePath(mode: ValidationMode): string {
    const key = `validation.casePath${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
    return this.getString(key, '');
  }

  public getValidationTaskPath(): string {
    return this.getString('validation.taskPath', '');
  }

  public getValidationReportPath(): string {
    return this.getString('validation.reportPath', '');
  }

  public getCodexOutputMode(): 'clipboard' | 'newDocument' | 'both' | 'workspaceTempFile' {
    const value = this.getString('codex.handoffOutput', 'both');
    if (value === 'clipboard' || value === 'newDocument' || value === 'workspaceTempFile') {
      return value;
    }
    return 'both';
  }

  public getCodexPromptStyle(): 'full' | 'concise' {
    return this.getString('codex.promptStyle', 'full') === 'concise' ? 'concise' : 'full';
  }

  public async getConnectionProfile(): Promise<ConnectionProfile> {
    const hasPassword = Boolean(await this.secretStorage.get(PASSWORD_SECRET_KEY));
    return {
      host: this.getString('connection.host', ''),
      port: this.getNumber('connection.port', 0),
      username: this.getString('connection.username', ''),
      mode: this.getConnectionMode(),
      sdkPath: this.getString('connection.sdkPath', ''),
      localClientPath: this.getString('connection.localClientPath', ''),
      hasPassword,
    };
  }

  public async getPassword(): Promise<string> {
    return (await this.secretStorage.get(PASSWORD_SECRET_KEY)) ?? '';
  }

  public async setPassword(password: string): Promise<void> {
    await this.secretStorage.store(PASSWORD_SECRET_KEY, password);
  }

  public async clearPassword(): Promise<void> {
    await this.secretStorage.delete(PASSWORD_SECRET_KEY);
  }

  public async updateConnectionProfile(profile: Omit<ConnectionProfile, 'hasPassword'>): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');
    await Promise.all([
      cfg.update('connection.host', profile.host, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.port', profile.port, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.username', profile.username, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.mode', profile.mode, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.sdkPath', profile.sdkPath, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.localClientPath', profile.localClientPath, vscode.ConfigurationTarget.Workspace),
    ]);
  }

  public async resetConnectionSettings(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');
    await Promise.all([
      cfg.update('connection.host', '', vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.port', 0, vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.username', '', vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.mode', 'local_client_bridge', vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.sdkPath', '', vscode.ConfigurationTarget.Workspace),
      cfg.update('connection.localClientPath', '', vscode.ConfigurationTarget.Workspace),
    ]);
    await this.clearPassword();
  }

  private getConnectionMode(): ConnectionMode {
    return this.getString('connection.mode', 'local_client_bridge') === 'remote_api'
      ? 'remote_api'
      : 'local_client_bridge';
  }

  private getString(key: string, defaultValue: string): string {
    return String(vscode.workspace.getConfiguration('tslWorkbench').get(key, defaultValue)).trim();
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = Number(vscode.workspace.getConfiguration('tslWorkbench').get(key, defaultValue));
    return Number.isFinite(value) ? value : defaultValue;
  }
}

