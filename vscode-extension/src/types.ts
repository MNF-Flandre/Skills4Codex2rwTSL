export type ValidationMode = 'smoke' | 'spec' | 'oracle';
export type ValidationAdapter = 'auto' | 'mock' | 'pytsl';
export type BackendMode = 'auto' | 'repo_attached_mode' | 'external_workspace_mode';
export type ConnectionMode = 'remote_api' | 'local_client_bridge';
export type RuntimeStatus = 'unknown' | 'ready' | 'pass' | 'fail' | 'blocked' | 'not_configured';

export interface LintDiagnostic {
  severity: 'error' | 'warning' | 'info' | string;
  code: string;
  message: string;
  range: [number, number];
  suggestion: string;
}

export interface LintPayload {
  command: 'lint';
  file: string;
  status: 'pass' | 'fail';
  diagnostic_count: number;
  diagnostics: LintDiagnostic[];
}

export interface PreflightPayload {
  command: 'preflight';
  status: 'pass' | 'fail';
  connection_mode: string;
  package_ready: boolean;
  config_ready: boolean;
  case_ready: boolean;
  network_ready: boolean;
  sdk_ready: boolean;
  overall_ready: boolean;
  preflight: Record<string, unknown>;
}

export interface ValidationPayload {
  command: 'validate';
  status: 'pass' | 'fail';
  failure_kind: string;
  mode: ValidationMode;
  exit_code: number;
  runtime_stage?: string;
  result: {
    diagnostics?: LintDiagnostic[];
    metadata?: Record<string, unknown>;
    diff_report?: {
      summary?: string;
      items?: Array<Record<string, unknown>>;
    };
  };
}

export interface AskFixPayload {
  command: 'Ask AI/Copilot to Fix';
  repair_payload: Record<string, unknown>;
}

export interface ConnectionProfile {
  host: string;
  port: number;
  username: string;
  mode: ConnectionMode;
  sdkPath: string;
  localClientPath: string;
  hasPassword: boolean;
}

export interface BackendSummary {
  mode: BackendMode;
  effectiveMode: 'repo_attached_mode' | 'external_workspace_mode';
  backendRoot: string;
  pythonModulePath: string;
  discoverySource: 'configured' | 'workspace' | 'extension_parent';
}

export interface ExtensionRuntimeState {
  connectionSummary: string;
  backendSummary: string;
  preflightStatus: string;
  validationStatus: string;
  lastValidationMode: string;
  lastFailureKind: string;
  lastReportPath: string;
  lastFilePath: string;
  codexHandoffStatus: string;
  statusBarSummary: string;
}
