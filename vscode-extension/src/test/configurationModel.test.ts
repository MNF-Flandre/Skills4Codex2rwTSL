import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBackendMode, normalizeConnectionMode, normalizeValidationAdapter } from '../config/configurationModel';

test('normalizeBackendMode handles allowed and fallback values', () => {
  assert.equal(normalizeBackendMode('repo_attached_mode'), 'repo_attached_mode');
  assert.equal(normalizeBackendMode('external_workspace_mode'), 'external_workspace_mode');
  assert.equal(normalizeBackendMode('unexpected'), 'auto');
});

test('normalizeValidationAdapter handles allowed and fallback values', () => {
  assert.equal(normalizeValidationAdapter('mock'), 'mock');
  assert.equal(normalizeValidationAdapter('pytsl'), 'pytsl');
  assert.equal(normalizeValidationAdapter('unknown'), 'auto');
});

test('normalizeConnectionMode handles allowed and fallback values', () => {
  assert.equal(normalizeConnectionMode('remote_api'), 'remote_api');
  assert.equal(normalizeConnectionMode('anything_else'), 'local_client_bridge');
});

