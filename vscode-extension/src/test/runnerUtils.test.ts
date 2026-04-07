import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRunnerEnv,
  buildRunnerExecOptions,
  buildValidateArgs,
  formatRunnerExecError,
  parseJsonPayload,
} from '../backend/runnerUtils';
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

test('buildValidateArgs assembles mode/adapter/case/task/report correctly', () => {
  const args = buildValidateArgs('/w/file.tsl', 'oracle', 'auto', '/b/case.json', '/b/task.json', '/w/report.md');
  assert.deepEqual(args, [
    '-m',
    'tsl_validation.cli',
    'validate',
    '/w/file.tsl',
    '--case',
    '/b/case.json',
    '--task',
    '/b/task.json',
    '--adapter',
    'auto',
    '--mode',
    'oracle',
    '--lint-policy',
    'warn',
    '--report',
    '/w/report.md',
  ]);
});

test('buildRunnerExecOptions sets cwd timeout and maxBuffer', () => {
  const options = buildRunnerExecOptions('/repo');
  assert.equal(options.cwd, '/repo');
  assert.equal(options.timeout, 120000);
  assert.equal(options.maxBuffer, 10 * 1024 * 1024);
});

test('formatRunnerExecError appends stderr/stdout detail when available', () => {
  const withDetail = formatRunnerExecError('spawn failed', 'traceback...', '');
  assert.match(withDetail, /spawn failed/);
  assert.match(withDetail, /traceback/);

  const noDetail = formatRunnerExecError('spawn failed', '', '');
  assert.equal(noDetail, 'spawn failed');
});
