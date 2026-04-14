import * as fs from 'node:fs';
import * as path from 'node:path';

export function candidatePythonPaths(
  configuredPython: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform
): string[] {
  const candidates = [configuredPython || 'python', 'python'];
  const envPrefixes = [env.CONDA_PREFIX, env.VIRTUAL_ENV].filter((value): value is string => Boolean(value));
  for (const prefix of envPrefixes) {
    candidates.push(path.join(prefix, platform === 'win32' ? 'python.exe' : 'bin/python'));
  }

  if (platform === 'win32') {
    for (const candidate of discoverWindowsPythonPaths(env)) {
      candidates.push(candidate);
    }
    candidates.push('py');
  } else {
    candidates.push('python3', '/usr/bin/python3', '/usr/local/bin/python3');
  }

  return Array.from(new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))).filter(
    (candidate) => !path.isAbsolute(candidate) || fs.existsSync(candidate)
  );
}

function discoverWindowsPythonPaths(env: NodeJS.ProcessEnv): string[] {
  const localAppData = env.LOCALAPPDATA || '';
  const userProfile = env.USERPROFILE || env.HOME || '';
  const candidates = [
    path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe'),
  ];

  const condaRoots = [
    path.join(localAppData, 'conda', 'conda'),
    path.join(localAppData, 'miniconda3'),
    path.join(localAppData, 'anaconda3'),
    path.join(localAppData, 'miniforge3'),
    path.join(localAppData, 'mambaforge'),
    path.join(userProfile, 'miniconda3'),
    path.join(userProfile, 'anaconda3'),
    path.join(userProfile, 'miniforge3'),
    path.join(userProfile, 'mambaforge'),
  ];

  for (const root of condaRoots) {
    candidates.push(path.join(root, 'python.exe'));
    const envsRoot = path.join(root, 'envs');
    if (!fs.existsSync(envsRoot) || !safeIsDirectory(envsRoot)) {
      continue;
    }
    for (const envName of safeReadDir(envsRoot)) {
      candidates.push(path.join(envsRoot, envName, 'python.exe'));
    }
  }

  return candidates;
}

function safeReadDir(target: string): string[] {
  try {
    return fs.readdirSync(target);
  } catch {
    return [];
  }
}

function safeIsDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}
