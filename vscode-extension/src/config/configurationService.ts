import * as vscode from 'vscode';
import { BackendMode, ConnectionMode, ConnectionProfile, ValidationAdapter, ValidationMode } from '../types';
import { normalizeBackendMode, normalizeConnectionMode, normalizeValidationAdapter } from './configurationModel';

const PASSWORD_SECRET_KEY = 'tslWorkbench.connection.password';

export class ConfigurationService {
  public constructor(private readonly secretStorage: vscode.SecretStorage) {}

  public getPythonPath(): string {
    return this.getString('pythonPath', 'python');
  }

  public getBackendMode(): BackendMode {
    return normalizeBackendMode(this.getString('backend.mode', 'auto'));
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

  public getValidationAdapter(): ValidationAdapter {
    return normalizeValidationAdapter(this.getString('validation.adapter', 'auto'));
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
      port: this.getNumber('connection.port', 443),
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
    const target = this.getConfigurationTarget();
    await Promise.all([
      cfg.update('connection.host', profile.host, target),
      cfg.update('connection.port', profile.port, target),
      cfg.update('connection.username', profile.username, target),
      cfg.update('connection.mode', profile.mode, target),
      cfg.update('connection.sdkPath', profile.sdkPath, target),
      cfg.update('connection.localClientPath', profile.localClientPath, target),
    ]);
  }

  public async resetConnectionSettings(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');
    const target = this.getConfigurationTarget();
    await Promise.all([
      cfg.update('connection.host', '', target),
      cfg.update('connection.port', 0, target),
      cfg.update('connection.username', '', target),
      cfg.update('connection.mode', 'auto', target),
      cfg.update('connection.sdkPath', '', target),
      cfg.update('connection.localClientPath', '', target),
    ]);
    await this.clearPassword();
  }

  public async updateBackendRoot(backendRoot: string): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');
    await cfg.update('backend.root', backendRoot.trim(), this.getConfigurationTarget());
  }

  public async updateBackendMode(mode: BackendMode): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');
    await cfg.update('backend.mode', mode, this.getConfigurationTarget());
  }

  public async updateBackendPythonModulePath(modulePath: string): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');
    await cfg.update('backend.pythonModulePath', modulePath.trim() || 'python', this.getConfigurationTarget());
  }

  public async updatePythonPath(pythonPath: string): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tslWorkbench');
    await cfg.update('pythonPath', pythonPath.trim() || 'python', this.getConfigurationTarget());
  }

  private getConnectionMode(): ConnectionMode {
    return normalizeConnectionMode(this.getString('connection.mode', 'auto'));
  }

  private getString(key: string, defaultValue: string): string {
    return String(vscode.workspace.getConfiguration('tslWorkbench').get(key, defaultValue)).trim();
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = Number(vscode.workspace.getConfiguration('tslWorkbench').get(key, defaultValue));
    return Number.isFinite(value) ? value : defaultValue;
  }

  private getConfigurationTarget(): vscode.ConfigurationTarget {
    return vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
  }
}
