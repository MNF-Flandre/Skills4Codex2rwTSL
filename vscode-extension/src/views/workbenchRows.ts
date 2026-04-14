import { ExtensionRuntimeState } from '../types';

export interface WorkbenchRow {
  label: string;
  description: string;
  tooltip: string;
  command: string;
  title: string;
  icon?: string;
}

export function getWorkbenchRows(state: ExtensionRuntimeState): WorkbenchRow[] {
  const preflightIcon = state.preflightStatus === 'pass' ? 'check' : state.preflightStatus === 'fail' ? 'error' : 'circle-large-outline';
  const validationIcon = state.validationStatus === 'pass' ? 'check' : state.validationStatus === 'fail' ? 'error' : 'circle-large-outline';

  return [
    {
      label: 'Status',
      description: state.statusBarSummary,
      tooltip: `Runtime summary: ${state.statusBarSummary}`,
      command: 'tslWorkbench.refreshSidebar',
      title: 'Refresh Status',
      icon: state.statusBarSummary.includes('Failed') ? 'error' : state.statusBarSummary.includes('Ready') ? 'check' : 'circle-large-outline',
    },
    {
      label: 'Connection',
      description: state.connectionSummary,
      tooltip: `Connection: ${state.connectionSummary}`,
      command: 'tslWorkbench.configureConnection',
      title: 'Configure Connection',
      icon: 'plug',
    },
    {
      label: 'Backend',
      description: state.backendSummary,
      tooltip: `Backend: ${state.backendSummary}`,
      command: 'tslWorkbench.revealConnectionSummary',
      title: 'Reveal Summary',
      icon: 'repo',
    },
    {
      label: 'Agent Bridge',
      description: state.agentBridgeStatus,
      tooltip: `Agent bridge: ${state.agentBridgeStatus}`,
      command: 'tslWorkbench.revealAgentBridge',
      title: 'Reveal Agent Bridge',
      icon: 'broadcast',
    },
    {
      label: 'Preflight',
      description: state.preflightStatus,
      tooltip: `Preflight status: ${state.preflightStatus}`,
      command: 'tslWorkbench.runPreflight',
      title: 'Run Preflight',
      icon: preflightIcon,
    },
    {
      label: 'Last Validation',
      description: `${state.lastValidationMode} ${state.validationStatus} (${state.lastFailureKind})`.trim(),
      tooltip: `Last validation: ${state.lastValidationMode} / ${state.validationStatus} / ${state.lastFailureKind}`,
      command: 'tslWorkbench.runValidateCurrentFile',
      title: 'Validate Current File',
      icon: validationIcon,
    },
    {
      label: 'Reports',
      description: state.lastReportPath || 'No report yet',
      tooltip: `Last report: ${state.lastReportPath || 'No report yet'}`,
      command: 'tslWorkbench.openLastReport',
      title: 'Open Last Report',
      icon: 'file-text',
    },
    {
      label: 'Diagnostics',
      description: 'Run environment diagnostics',
      tooltip: 'Run Diagnostic Wizard and generate detailed environment checks',
      command: 'tslWorkbench.runDiagnosticWizard',
      title: 'Run Diagnostic Wizard',
      icon: 'tools',
    },
    {
      label: 'Codex Handoff',
      description: state.codexHandoffStatus,
      tooltip: `Codex handoff: ${state.codexHandoffStatus}`,
      command: 'tslWorkbench.openInCodex',
      title: 'Open in Codex',
      icon: 'comment-discussion',
    },
  ];
}
