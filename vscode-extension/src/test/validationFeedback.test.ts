import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestPreflightNextAction, suggestValidationNextAction, summarizePreflightFailure } from '../commands/validationFeedback';
import { ValidationPayload } from '../types';

test('summarizePreflightFailure lists blocked layers', () => {
  const text = summarizePreflightFailure({
    command: 'preflight',
    status: 'fail',
    connection_mode: 'local_client_bridge',
    package_ready: false,
    config_ready: false,
    case_ready: true,
    network_ready: false,
    sdk_ready: true,
    overall_ready: false,
    preflight: {},
  });
  assert.match(text, /python package/);
  assert.match(text, /connection config/);
  assert.match(text, /network/);
});

test('suggestPreflightNextAction prioritizes config guidance', () => {
  const text = suggestPreflightNextAction({
    command: 'preflight',
    status: 'fail',
    connection_mode: 'local_client_bridge',
    package_ready: true,
    config_ready: false,
    case_ready: false,
    network_ready: true,
    sdk_ready: true,
    overall_ready: false,
    preflight: {},
  });
  assert.match(text, /Configure Connection/);
});

test('suggestValidationNextAction maps oracle mismatch to report/codex guidance', () => {
  const payload: ValidationPayload = {
    command: 'validate',
    status: 'fail',
    failure_kind: 'oracle_mismatch',
    mode: 'oracle',
    exit_code: 2,
    result: {},
  };
  const next = suggestValidationNextAction(payload);
  assert.match(next, /Open last report/);
  assert.match(next, /Codex/);
});

