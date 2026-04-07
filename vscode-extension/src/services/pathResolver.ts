import * as fs from 'node:fs';
import * as path from 'node:path';
import { BackendMode, BackendSummary, ValidationMode } from '../types';

interface ResolverInput {
  workspaceRoot?: string;
  extensionPath: string;
  backendMode: BackendMode;
  configuredBackendRoot: string;
  pythonModulePath: string;
}

const REQUIRED_MARKERS = ['python/ide_bridge.py', 'python/tsl_validation/cli.py'];

export class PathResolver {
  private readonly backendSummary: BackendSummary;

  public constructor(private readonly input: ResolverInput) {
    this.backendSummary = this.discoverBackendSummary();
  }

  public getBackendSummary(): BackendSummary {
    return this.backendSummary;
  }

  public getBackendRoot(): string {
    return this.backendSummary.backendRoot;
  }

  public getPythonModuleRoot(): string {
    return this.resolveAgainst(this.backendSummary.backendRoot, this.backendSummary.pythonModulePath);
  }

  public getIdeBridgePath(): string {
    return path.join(this.backendSummary.backendRoot, 'python', 'ide_bridge.py');
  }

  public resolveValidationCasePath(mode: ValidationMode, configuredPath: string): string {
    if (configuredPath) {
      return this.resolvePath(configuredPath, 'backend');
    }
    const fallback = mode === 'oracle' ? 'examples/live_cases/live_oracle_case.json' : 'examples/live_cases/live_smoke_case.json';
    return path.join(this.backendSummary.backendRoot, fallback);
  }

  public resolveValidationTaskPath(configuredPath: string): string {
    if (configuredPath) {
      return this.resolvePath(configuredPath, 'backend');
    }
    return path.join(this.backendSummary.backendRoot, 'examples/golden_cases/task_spec.json');
  }

  public resolveValidationReportPath(configuredPath: string): string {
    if (configuredPath) {
      return this.resolvePath(configuredPath, 'workspace');
    }
    const base = this.input.workspaceRoot || this.backendSummary.backendRoot;
    return path.join(base, 'reports', 'vscode_last_report.md');
  }

  public resolvePath(configuredPath: string, preferredBase: 'backend' | 'workspace'): string {
    if (!configuredPath) {
      return preferredBase === 'workspace'
        ? this.input.workspaceRoot || this.backendSummary.backendRoot
        : this.backendSummary.backendRoot;
    }
    if (path.isAbsolute(configuredPath)) {
      return configuredPath;
    }
    const workspaceRoot = this.input.workspaceRoot || this.backendSummary.backendRoot;
    const base = preferredBase === 'workspace' ? workspaceRoot : this.backendSummary.backendRoot;
    return this.resolveAgainst(base, configuredPath);
  }

  private discoverBackendSummary(): BackendSummary {
    const mode = this.input.backendMode;
    const configured = this.input.configuredBackendRoot ? this.resolveConfiguredRoot(this.input.configuredBackendRoot) : '';
    const workspace = this.input.workspaceRoot || '';
    const extensionParent = path.resolve(this.input.extensionPath, '..');

    if (mode === 'external_workspace_mode') {
      if (!configured) {
        throw new Error(
          'Backend mode is external_workspace_mode but tslWorkbench.backend.root is empty. Set backend root to a repository that contains python/ide_bridge.py.'
        );
      }
      return this.ensureBackend(configured, mode, 'configured');
    }

    if (mode === 'repo_attached_mode') {
      const candidates = [configured, workspace, extensionParent].filter(Boolean);
      for (const candidate of candidates) {
        if (this.isBackendRoot(candidate)) {
          return this.ensureBackend(candidate, mode, candidate === configured ? 'configured' : candidate === workspace ? 'workspace' : 'extension_parent');
        }
      }
      throw new Error('repo_attached_mode requires a backend root with python/ide_bridge.py and python/tsl_validation/cli.py.');
    }

    const autoCandidates = [configured, workspace, extensionParent].filter(Boolean);
    for (const candidate of autoCandidates) {
      if (this.isBackendRoot(candidate)) {
        const source = candidate === configured ? 'configured' : candidate === workspace ? 'workspace' : 'extension_parent';
        const effectiveMode = source === 'workspace' || source === 'extension_parent' ? 'repo_attached_mode' : 'external_workspace_mode';
        return this.ensureBackend(candidate, mode, source, effectiveMode);
      }
    }
    throw new Error(
      'Cannot discover backend root. Configure tslWorkbench.backend.root to a repository root containing python/ide_bridge.py and python/tsl_validation/cli.py.'
    );
  }

  private ensureBackend(
    backendRoot: string,
    requestedMode: BackendMode,
    source: 'configured' | 'workspace' | 'extension_parent',
    effectiveMode?: 'repo_attached_mode' | 'external_workspace_mode'
  ): BackendSummary {
    if (!this.isBackendRoot(backendRoot)) {
      throw new Error(`Backend root is invalid: ${backendRoot}. Required files: ${REQUIRED_MARKERS.join(', ')}`);
    }
    return {
      mode: requestedMode,
      effectiveMode: effectiveMode || (source === 'configured' ? 'external_workspace_mode' : 'repo_attached_mode'),
      backendRoot,
      pythonModulePath: this.input.pythonModulePath || 'python',
      discoverySource: source,
    };
  }

  private resolveConfiguredRoot(configuredRoot: string): string {
    if (path.isAbsolute(configuredRoot)) {
      return configuredRoot;
    }
    const base = this.input.workspaceRoot || path.resolve(this.input.extensionPath, '..');
    return this.resolveAgainst(base, configuredRoot);
  }

  private resolveAgainst(base: string, target: string): string {
    return path.normalize(path.resolve(base, target));
  }

  private isBackendRoot(candidate: string): boolean {
    if (!candidate || !fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
      return false;
    }
    return REQUIRED_MARKERS.every((marker) => fs.existsSync(path.join(candidate, marker)));
  }
}

