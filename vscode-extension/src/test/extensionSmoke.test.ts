import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStartupGuidance } from '../onboarding/startupGuidance';
import { summarizePreflightFailure, summarizeValidationFailure } from '../commands/validationFeedback';

test('extension smoke: startup guidance and validation feedback core modules are loadable', () => {
  const startup = buildStartupGuidance({
    hasWorkspace: true,
    connectionHint: 'blocked',
    hasPassword: false,
    host: 'TODO_LOCAL_HOST',
    port: 443,
  });
  assert.match(startup.statusBarSummary, /Config incomplete/);
  assert.equal(startup.actions.includes('Configure Connection'), true);

  const preflightReason = summarizePreflightFailure({
    command: 'preflight',
    status: 'fail',
    connection_mode: 'local_client_bridge',
    package_ready: true,
    config_ready: false,
    case_ready: true,
    network_ready: true,
    sdk_ready: true,
    overall_ready: false,
    preflight: {},
  });
  assert.match(preflightReason, /connection config/);

  const validationReason = summarizeValidationFailure('oracle', {
    command: 'validate',
    status: 'fail',
    failure_kind: 'oracle_mismatch',
    mode: 'oracle',
    exit_code: 2,
    runtime_stage: 'compare',
    result: {
      diff_report: { summary: 'signal mismatch' },
    },
  });
  assert.match(validationReason, /oracle_mismatch/);
  assert.match(validationReason, /signal mismatch/);
});
