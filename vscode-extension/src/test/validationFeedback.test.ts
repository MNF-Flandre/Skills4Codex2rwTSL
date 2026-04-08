import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTslOutputTables, suggestPreflightNextAction, suggestValidationNextAction, summarizePreflightFailure } from '../commands/validationFeedback';
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

test('formatTslOutputTables renders scalar and dataframe-like record outputs', () => {
  const payload: ValidationPayload = {
    command: 'validate',
    status: 'pass',
    failure_kind: '',
    mode: 'smoke',
    exit_code: 0,
    result: {
      tsl_output: {
        signal: null,
        value: null,
        Q2: 81,
        Q3: ['2023-10-01', 45200, 20231001],
        Q12: [
          { col1: 1, col2: 2, col3: 3 },
          { col1: 2, col2: 3, col4: 4 },
        ],
      },
    },
  };

  const text = formatTslOutputTables(payload);
  assert.match(text, /TSL Output/);
  assert.match(text, /field\s+type\s+value/);
  assert.match(text, /Q2\s+number\s+81/);
  assert.match(text, /Q12\s+2 rows\s+2 rows x 4 cols/);
  assert.doesNotMatch(text, /idx\s+col1\s+col2\s+col3\s+col4/);
  assert.doesNotMatch(text, /signal\s+null/);
});
