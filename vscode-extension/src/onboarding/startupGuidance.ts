export type StartupSeverity = 'info' | 'warning';
export const STARTUP_ACTION_CONFIGURE_CONNECTION = 'Configure Connection' as const;
export const STARTUP_ACTION_RUN_PREFLIGHT = 'Run Preflight' as const;
export const STARTUP_ACTION_OPEN_SETTINGS = 'Open Settings' as const;
export type StartupAction =
  | typeof STARTUP_ACTION_CONFIGURE_CONNECTION
  | typeof STARTUP_ACTION_RUN_PREFLIGHT
  | typeof STARTUP_ACTION_OPEN_SETTINGS;

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
  actions: StartupAction[];
}

export function buildStartupGuidance(input: StartupGuidanceInput): StartupGuidance {
  if (!input.hasWorkspace) {
    return {
      severity: 'warning',
      statusBarSummary: '$(circle-slash) TSL No Workspace',
      message: 'TSL Workbench: open a workspace folder to enable reports, temp handoff files, and stable path resolution.',
      actions: [STARTUP_ACTION_OPEN_SETTINGS],
    };
  }

  if (!input.host || input.port <= 0) {
    return {
      severity: 'warning',
      statusBarSummary: '$(circle-slash) TSL Not configured',
      message:
        'TSL Workbench is not fully configured yet: host/port is missing. Run "TSL: Configure Connection" then run preflight.',
      actions: [STARTUP_ACTION_CONFIGURE_CONNECTION, STARTUP_ACTION_RUN_PREFLIGHT],
    };
  }

  if (input.connectionHint !== 'ready' || !input.hasPassword) {
    return {
      severity: 'warning',
      statusBarSummary: '$(warning) TSL Config incomplete',
      message:
        'TSL Workbench connection is incomplete (password or credentials missing). Run "TSL: Configure Connection" and then preflight.',
      actions: [STARTUP_ACTION_CONFIGURE_CONNECTION, STARTUP_ACTION_RUN_PREFLIGHT],
    };
  }

  return {
    severity: 'info',
    statusBarSummary: '$(check) TSL Ready',
    message: 'TSL Workbench is configured. Recommended next step: run preflight, then open a .tsl file and run Validate Current File.',
    actions: [STARTUP_ACTION_RUN_PREFLIGHT],
  };
}
