import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkbenchRows } from '../views/workbenchRows';
import { ExtensionRuntimeState } from '../types';

test('getWorkbenchRows returns readable status rows', () => {
  const state: ExtensionRuntimeState = {
    connectionSummary: 'remote_api TODO_LOCAL_HOST:443 (user:set, password:saved)',
    backendSummary: 'repo_attached_mode @ /repo',
    agentBridgeStatus: 'listening on 127.0.0.1:31739',
    preflightStatus: 'pass',
    validationStatus: 'fail',
    lastValidationMode: 'validate',
    lastFailureKind: 'execute_failure',
    lastReportPath: '/workspace/reports/vscode_last_report.md',
    lastFilePath: '/workspace/test.tsl',
    codexHandoffStatus: 'open ready (full/openai-codex)',
    statusBarSummary: '$(error) TSL validate Failed',
  };
  const rows = getWorkbenchRows(state);
  assert.equal(rows.length, 9);
  assert.equal(rows[0].label, 'Status');
  assert.equal(rows[1].label, 'Connection');
  assert.equal(rows[3].label, 'Agent Bridge');
  assert.match(rows[5].description, /validate fail \(execute_failure\)/);
  assert.equal(rows[7].label, 'Diagnostics');
  assert.equal(rows[8].command, 'tslWorkbench.openInCodex');
});
