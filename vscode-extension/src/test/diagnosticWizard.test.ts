import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeDiagnosticReport } from '../commands/diagnosticModel';

test('summarizeDiagnosticReport prioritizes fail count', () => {
  const summary = summarizeDiagnosticReport({
    generatedAt: new Date().toISOString(),
    backendRoot: '/repo',
    checks: [
      { name: 'backend', status: 'fail', detail: '', nextAction: '' },
      { name: 'python', status: 'warn', detail: '', nextAction: '' },
    ],
    lastKnownState: {
      preflightStatus: 'fail',
      validationStatus: 'unknown',
      lastValidationMode: '',
      lastFailureKind: 'config',
      lastReportPath: '',
    },
  });
  assert.match(summary, /1 fail, 1 warn/);
});

test('summarizeDiagnosticReport reports warnings when no fail', () => {
  const summary = summarizeDiagnosticReport({
    generatedAt: new Date().toISOString(),
    backendRoot: '/repo',
    checks: [{ name: 'connection', status: 'warn', detail: '', nextAction: '' }],
    lastKnownState: {
      preflightStatus: 'unknown',
      validationStatus: 'unknown',
      lastValidationMode: '',
      lastFailureKind: 'none',
      lastReportPath: '',
    },
  });
  assert.match(summary, /warning/);
});
