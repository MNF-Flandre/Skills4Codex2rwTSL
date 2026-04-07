import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRunnerEnv, parseJsonPayload } from '../backend/runnerUtils';
import { ConnectionProfile } from '../types';

test('parseJsonPayload parses plain JSON and fallback JSON blocks', () => {
  const direct = parseJsonPayload<{ ok: boolean }>('{"ok":true}');
  assert.equal(direct.ok, true);

  const fallback = parseJsonPayload<{ status: string }>('noise...\n{"status":"pass"}\n...');
  assert.equal(fallback.status, 'pass');
});

test('buildRunnerEnv injects connection and optional paths', () => {
  const profile: ConnectionProfile = {
    host: 'TODO_LOCAL_HOST',
    port: 443,
    username: 'user',
    mode: 'remote_api',
    sdkPath: '/sdk',
    localClientPath: '/client',
    hasPassword: true,
  };
  const env = buildRunnerEnv({ LANG: 'C' }, profile, 'secret', '/repo/python');
  assert.equal(env.PYTHONPATH, '/repo/python');
  assert.equal(env.PYTSL_HOST, 'TODO_LOCAL_HOST');
  assert.equal(env.PYTSL_PORT, '443');
  assert.equal(env.PYTSL_PASSWORD, 'secret');
  assert.equal(env.PYTSL_SDK_PATH, '/sdk');
  assert.equal(env.TSL_CLIENT_DIR, '/client');
});

