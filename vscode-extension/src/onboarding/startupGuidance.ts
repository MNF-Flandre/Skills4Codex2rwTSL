export type StartupSeverity = 'info' | 'warning';

export interface StartupGuidanceInput {
  hasWorkspace: boolean;
  connectionHint: 'ready' | 'blocked' | 'not_configured';
  hasPassword: boolean;
  host: string;
  port: number;
}

export interface StartupGuidance {
  severity: StartupSeverity;
  statusBarSummary: string;
  message: string;
  actions: Array<'Configure Connection' | 'Run Preflight' | 'Open Settings'>;
}

export function buildStartupGuidance(input: StartupGuidanceInput): StartupGuidance {
  if (!input.hasWorkspace) {
    return {
      severity: 'warning',
      statusBarSummary: '$(circle-slash) TSL No Workspace',
      message: 'TSL Workbench: open a workspace folder to enable reports, temp handoff files, and stable path resolution.',
      actions: ['Open Settings'],
    };
  }

  if (!input.host || input.port <= 0) {
    return {
      severity: 'warning',
      statusBarSummary: '$(circle-slash) TSL Not configured',
      message:
        'TSL Workbench is not fully configured yet: host/port is missing. Run "TSL: Configure Connection" then run preflight.',
      actions: ['Configure Connection', 'Run Preflight'],
    };
  }

  if (input.connectionHint !== 'ready' || !input.hasPassword) {
    return {
      severity: 'warning',
      statusBarSummary: '$(warning) TSL Config incomplete',
      message:
        'TSL Workbench connection is incomplete (password or credentials missing). Run "TSL: Configure Connection" and then preflight.',
      actions: ['Configure Connection', 'Run Preflight'],
    };
  }

  return {
    severity: 'info',
    statusBarSummary: '$(check) TSL Ready',
    message: 'TSL Workbench is configured. Recommended next step: run preflight, then open a .tsl file and run smoke/spec/oracle.',
    actions: ['Run Preflight'],
  };
}

