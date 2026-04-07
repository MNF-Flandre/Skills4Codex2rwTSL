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
    statusBarSummary: 'TSL: Validation failed',
  };
  const rows = getWorkbenchRows(state);
  assert.equal(rows.length, 6);
  assert.equal(rows[0].label, 'Connection');
  assert.match(rows[3].description, /oracle fail \(oracle_mismatch\)/);
});

