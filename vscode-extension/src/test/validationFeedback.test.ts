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

test('suggestValidationNextAction maps local bridge capability gap to remote guidance', () => {
  const payload: ValidationPayload = {
    command: 'validate',
    status: 'fail',
    failure_kind: 'local_bridge_capability_gap',
    mode: 'smoke',
    exit_code: 1,
    result: {},
  };
  const next = suggestValidationNextAction(payload);
  assert.match(next, /auto or remote_api/);
  assert.match(next, /local_client_bridge/);
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
        Q2: [{ a: 1, b: 2 }],
        Q3: [['2023-10-01', 45200, 20231001]],
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
  assert.match(text, /Q2\s+array\[1\]\s+1 rows x 2 cols; first=/);
  assert.match(text, /Q3\s+array\[1\]\s+1 rows x 3 cols; first=/);
  assert.match(text, /Q12\s+array\[2\]\s+2 rows x 4 cols; first=/);
  assert.doesNotMatch(text, /signal\s+null/);
});
