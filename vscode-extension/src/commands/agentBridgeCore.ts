import * as path from 'node:path';

export type AgentBridgeAction =
  | 'ping'
  | 'validate_current_file'
  | 'run_preflight'
  | 'open_last_report'
  | 'reveal_connection_summary';

const BRIDGE_COMMANDS: AgentBridgeAction[] = [
  'ping',
  'validate_current_file',
  'run_preflight',
  'open_last_report',
  'reveal_connection_summary',
];

export function normalizeAgentBridgeAction(value: string): AgentBridgeAction | undefined {
  if (BRIDGE_COMMANDS.includes(value as AgentBridgeAction)) {
    return value as AgentBridgeAction;
  }
  return undefined;
}

export function getAgentBridgeStateFilePath(workspaceRoot: string | undefined, fallbackRoot: string): string {
  const base = workspaceRoot || fallbackRoot;
  return path.join(base, '.tsl-workbench', 'agent-bridge.json');
}

export function listAgentBridgeActions(): AgentBridgeAction[] {
  return [...BRIDGE_COMMANDS];
}
