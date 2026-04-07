import { PreflightPayload, ValidationMode, ValidationPayload } from '../types';

export function summarizePreflightFailure(payload: PreflightPayload): string {
  const blocked = [
    payload.package_ready ? '' : 'python package',
    payload.config_ready ? '' : 'connection config',
    payload.case_ready ? '' : 'case file',
    payload.network_ready ? '' : 'network',
    payload.sdk_ready ? '' : 'sdk',
  ]
    .filter(Boolean)
    .join(', ');

  if (!blocked) {
    return 'preflight failed; check output for details';
  }
  return `preflight blocked by: ${blocked}`;
}

export function suggestPreflightNextAction(payload: PreflightPayload): string {
  if (!payload.config_ready) {
    return 'Run "TSL: Configure Connection" and verify host/port/password.';
  }
  if (!payload.case_ready) {
    return 'Check validation case path settings under tslWorkbench.validation.casePath*.';
  }
  if (!payload.package_ready || !payload.sdk_ready) {
    return 'Verify Python environment / SDK path and rerun preflight.';
  }
  if (!payload.network_ready) {
    return 'Verify runtime reachability (network/client bridge) and retry.';
  }
  return 'Open Output channel and inspect backend details.';
}

export function summarizeValidationFailure(mode: ValidationMode, payload: ValidationPayload): string {
  const failureKind = payload.failure_kind || 'unknown_failure';
  const stage = payload.runtime_stage ? `stage=${payload.runtime_stage}` : 'stage=unknown';
  const summary = payload.result?.diff_report?.summary ? ` | ${payload.result.diff_report.summary}` : '';
  return `TSL ${mode} failed (${failureKind}, ${stage})${summary}`;
}

export function suggestValidationNextAction(payload: ValidationPayload): string {
  const failureKind = payload.failure_kind || '';
  if (failureKind.includes('lint')) {
    return 'Fix diagnostics shown in Problems panel, then rerun validation.';
  }
  if (failureKind.includes('runtime') || failureKind.includes('execute')) {
    return 'Run preflight and verify runtime credentials/network.';
  }
  if (failureKind.includes('oracle') || failureKind.includes('spec')) {
    return 'Open last report, inspect diff summary, then run Codex fix/explain.';
  }
  if (failureKind.includes('config')) {
    return 'Review backend root / case / task / report path settings.';
  }
  return 'Open Output channel for backend trace and rerun step-by-step.';
}

