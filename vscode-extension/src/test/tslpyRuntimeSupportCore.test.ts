import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldTreatProbeResultAsProcessFailure } from '../commands/tslpyRuntimeSupportCore';

test('probe result with json stdout is not treated as process failure even when process exits non-zero', () => {
  const failedButStructured = {
    stdout: '{\"command\":\"tslpy-runtime\",\"status\":\"fail\",\"expected_module\":\"TSLPy311\"}',
    stderr: '',
    errorMessage: 'Command failed: python -m tsl_validation.cli tslpy-runtime',
  };
  assert.equal(shouldTreatProbeResultAsProcessFailure(failedButStructured), false);
});

test('probe result without stdout is treated as process failure', () => {
  const hardFailure = {
    stdout: '',
    stderr: 'Traceback: module not found',
    errorMessage: 'Command failed: python -m tsl_validation.cli tslpy-runtime',
  };
  assert.equal(shouldTreatProbeResultAsProcessFailure(hardFailure), true);
});

