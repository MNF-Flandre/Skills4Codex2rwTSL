import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { candidatePythonPaths } from '../commands/pythonDiscovery';

test('candidatePythonPaths discovers common Windows conda env interpreters', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsl-python-discovery-'));
  try {
    const localAppData = path.join(root, 'LocalAppData');
    const envPython = path.join(localAppData, 'conda', 'conda', 'envs', 'anaconda-finance', 'python.exe');
    fs.mkdirSync(path.dirname(envPython), { recursive: true });
    fs.writeFileSync(envPython, '', 'utf-8');

    const candidates = candidatePythonPaths(
      'python',
      {
        LOCALAPPDATA: localAppData,
        USERPROFILE: path.join(root, 'UserProfile'),
      },
      'win32'
    );

    assert.equal(candidates.includes(envPython), true);
    assert.equal(candidates.includes('python'), true);
    assert.equal(candidates.includes('py'), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('candidatePythonPaths preserves current env python prefixes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsl-python-prefix-'));
  try {
    const condaPrefix = path.join(root, 'conda-env');
    const pythonExe = path.join(condaPrefix, 'python.exe');
    fs.mkdirSync(condaPrefix, { recursive: true });
    fs.writeFileSync(pythonExe, '', 'utf-8');

    const candidates = candidatePythonPaths(
      '',
      {
        CONDA_PREFIX: condaPrefix,
      },
      'win32'
    );

    assert.equal(candidates.includes(pythonExe), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
