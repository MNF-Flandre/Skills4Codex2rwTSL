import * as fs from 'node:fs';
import { ConnectionProfile, ValidationAdapter, ValidationMode } from '../types';

export function parseJsonPayload<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Backend returned empty output.');
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error('Failed to parse backend JSON payload.');
  }
}

export function buildRunnerEnv(
  baseEnv: NodeJS.ProcessEnv,
  profile: ConnectionProfile,
  password: string,
  pythonModuleRoot: string
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...baseEnv,
    PYTHONPATH: pythonModuleRoot,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTSL_CONNECTION_MODE: profile.mode,
    PYTSL_HOST: profile.host,
    PYTSL_PORT: String(profile.port),
    PYTSL_USERNAME: profile.username,
    PYTSL_PASSWORD: password,
  };
  if (profile.sdkPath) {
    env.PYTSL_SDK_PATH = profile.sdkPath;
  }
  if (profile.localClientPath) {
    env.TSL_CLIENT_DIR = profile.localClientPath;
  }
  return env;
}

export function ensureFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

export function buildValidateArgs(
  filePath: string,
  mode: ValidationMode,
  adapter: ValidationAdapter,
  casePath: string,
  taskPath: string,
  reportPath: string
): string[] {
  return [
    '-m',
    'tsl_validation.cli',
    'validate',
    filePath,
    '--case',
    casePath,
    '--task',
    taskPath,
    '--adapter',
    adapter,
    '--mode',
    mode,
    '--lint-policy',
    'warn',
    '--report',
    reportPath,
  ];
}
