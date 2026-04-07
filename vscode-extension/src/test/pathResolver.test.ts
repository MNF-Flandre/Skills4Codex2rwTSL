import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathResolver } from '../services/pathResolver';

function makeBackendRoot(root: string): void {
  fs.mkdirSync(path.join(root, 'python', 'tsl_validation'), { recursive: true });
  fs.writeFileSync(path.join(root, 'python', 'ide_bridge.py'), '# test', 'utf-8');
  fs.writeFileSync(path.join(root, 'python', 'tsl_validation', 'cli.py'), '# test', 'utf-8');
}

test('PathResolver prefers configured backend root in external mode', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tsl-ext-'));
  makeBackendRoot(tmp);
  const resolver = new PathResolver({
    workspaceRoot: '/workspace',
    extensionPath: '/extension',
    backendMode: 'external_workspace_mode',
    configuredBackendRoot: tmp,
    pythonModulePath: 'python',
  });
  const summary = resolver.getBackendSummary();
  assert.equal(summary.backendRoot, tmp);
  assert.equal(summary.effectiveMode, 'external_workspace_mode');
});

test('PathResolver resolves relative report path against workspace', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tsl-ext-'));
  makeBackendRoot(tmp);
  const resolver = new PathResolver({
    workspaceRoot: '/workspace',
    extensionPath: '/extension',
    backendMode: 'external_workspace_mode',
    configuredBackendRoot: tmp,
    pythonModulePath: 'python',
  });
  assert.equal(resolver.resolveValidationReportPath('reports/latest.md'), path.normalize('/workspace/reports/latest.md'));
});

test('PathResolver throws clear error when backend not found', () => {
  assert.throws(
    () =>
      new PathResolver({
        workspaceRoot: '/workspace',
        extensionPath: '/extension',
        backendMode: 'external_workspace_mode',
        configuredBackendRoot: '',
        pythonModulePath: 'python',
      }),
    /backend\.root is empty/
  );
});

