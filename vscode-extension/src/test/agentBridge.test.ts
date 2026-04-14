import test from 'node:test';
import assert from 'node:assert/strict';
import { getAgentBridgeStateFilePath, normalizeAgentBridgeAction } from '../commands/agentBridgeCore';

test('normalizeAgentBridgeAction only accepts whitelisted actions', () => {
  assert.equal(normalizeAgentBridgeAction('validate_current_file'), 'validate_current_file');
  assert.equal(normalizeAgentBridgeAction('run_preflight'), 'run_preflight');
  assert.equal(normalizeAgentBridgeAction('open_last_report'), 'open_last_report');
  assert.equal(normalizeAgentBridgeAction('reveal_connection_summary'), 'reveal_connection_summary');
  assert.equal(normalizeAgentBridgeAction('workbench.runAnything'), undefined);
});

test('getAgentBridgeStateFilePath prefers workspace root and falls back to provided root', () => {
  assert.match(getAgentBridgeStateFilePath('/workspace', '/fallback'), /\.tsl-workbench[\\/]agent-bridge\.json$/);
  assert.match(getAgentBridgeStateFilePath('', '/fallback'), /fallback[\\/]\.tsl-workbench[\\/]agent-bridge\.json$/);
});
