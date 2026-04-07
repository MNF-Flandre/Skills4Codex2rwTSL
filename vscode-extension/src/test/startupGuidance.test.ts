import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStartupGuidance } from '../onboarding/startupGuidance';

test('buildStartupGuidance warns when workspace is missing', () => {
  const guidance = buildStartupGuidance({
    hasWorkspace: false,
    connectionHint: 'not_configured',
    hasPassword: false,
    host: '',
    port: 0,
  });
  assert.match(guidance.statusBarSummary, /No Workspace/);
  assert.equal(guidance.actions[0], 'Open Settings');
});

test('buildStartupGuidance suggests configure connection when host/port are missing', () => {
  const guidance = buildStartupGuidance({
    hasWorkspace: true,
    connectionHint: 'not_configured',
    hasPassword: false,
    host: '',
    port: 0,
  });
  assert.match(guidance.message, /host\/port is missing/);
  assert.equal(guidance.actions.includes('Configure Connection'), true);
});

test('buildStartupGuidance marks ready when credentials are complete', () => {
  const guidance = buildStartupGuidance({
    hasWorkspace: true,
    connectionHint: 'ready',
    hasPassword: true,
    host: 'TODO_LOCAL_HOST',
    port: 443,
  });
  assert.match(guidance.statusBarSummary, /TSL Ready/);
  assert.equal(guidance.severity, 'info');
});

