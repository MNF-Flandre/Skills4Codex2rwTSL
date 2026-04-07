import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkbenchRows } from '../views/workbenchRows';
import { ExtensionRuntimeState } from '../types';

test('getWorkbenchRows returns readable status rows', () => {
  const state: ExtensionRuntimeState = {
    connectionSummary: 'remote_api TODO_LOCAL_HOST:443 (user:set, password:saved)',
    backendSummary: 'repo_attached_mode @ /repo',
    preflightStatus: 'pass',
    validationStatus: 'fail',
    lastValidationMode: 'oracle',
    lastFailureKind: 'oracle_mismatch',
    lastReportPath: '/workspace/reports/vscode_last_report.md',
    lastFilePath: '/workspace/test.tsl',
    codexHandoffStatus: 'fix ready (full/both)',
    statusBarSummary: '$(error) TSL oracle Failed',
  };
  const rows = getWorkbenchRows(state);
  assert.equal(rows.length, 8);
  assert.equal(rows[0].label, 'Status');
  assert.equal(rows[1].label, 'Connection');
  assert.match(rows[4].description, /oracle fail \(oracle_mismatch\)/);
  assert.equal(rows[6].label, 'Diagnostics');
});
