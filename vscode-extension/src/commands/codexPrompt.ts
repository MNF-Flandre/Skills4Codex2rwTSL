export type HandoffMode = 'fix' | 'explain' | 'continue';
export type PromptStyle = 'full' | 'concise';

export function modeObjective(mode: HandoffMode): string {
  if (mode === 'fix') {
    return 'Patch the TSL code to pass validation while preserving intent.';
  }
  if (mode === 'explain') {
    return 'Explain root cause and smallest safe fix.';
  }
  return 'Continue from current report and propose next executable patch + validation order.';
}

function modeActionRequest(mode: HandoffMode): string {
  if (mode === 'fix') {
    return 'Produce a concrete patch and list the exact validation order to re-run.';
  }
  if (mode === 'explain') {
    return 'Explain failure layer, root cause, and smallest safe change with rationale.';
  }
  return 'Continue from existing report, propose next patch, and prioritize highest-signal checks.';
}

export function buildCodexPrompt(mode: HandoffMode, payload: Record<string, unknown>, style: PromptStyle): string {
  const source = String(payload.source ?? '');
  const diagnostics = payload.diagnostics ?? [];
  const validationMode = String(payload.validation_mode ?? 'unknown');
  const failureKind = String(payload.failure_kind ?? 'unknown');
  const diffSummary = String(payload.diff_summary ?? '');
  const mismatchFields = JSON.stringify(payload.mismatch_fields ?? []);
  const referenceStrategy = String(payload.reference_strategy ?? 'unknown');
  const runtimeAdapter = String(payload.runtime_adapter ?? 'unknown');
  const runtimeStage = String(payload.runtime_stage ?? '');
  const runtimeErrors = JSON.stringify(payload.runtime_errors ?? []);
  const trace = JSON.stringify(payload.runtime_intermediate_trace ?? []);
  const finalEnv = JSON.stringify(payload.runtime_final_env ?? {});
  const suggested = String(payload.suggested_next_action ?? '');
  const minimalRepro = JSON.stringify(payload.minimal_repro_case ?? {});
  const objective = modeObjective(mode);
  const actionRequest = modeActionRequest(mode);

  if (style === 'concise') {
    return [
      '# TSL Codex Handoff (Concise)',
      `Mode: ${mode}`,
      `Objective: ${objective}`,
      `Action request: ${actionRequest}`,
      `Validation: ${validationMode}`,
      `Failure: ${failureKind}`,
      `Mismatch: ${mismatchFields}`,
      `Summary: ${diffSummary}`,
      `Next: ${suggested}`,
      '',
      '## Selected/Current TSL Source',
      '```tsl',
      source,
      '```',
    ].join('\n');
  }

  return [
    '# TSL Codex Handoff',
    '',
    `Mode: ${mode}`,
    '## 1) Task Goal',
    `Objective: ${objective}`,
    `Action request: ${actionRequest}`,
    '',
    '## 2) Failure Snapshot',
    `Validation mode: ${validationMode}`,
    `Failure kind: ${failureKind}`,
    `Diff summary: ${diffSummary}`,
    `Mismatch fields: ${mismatchFields}`,
    '',
    '## 3) Runtime / Reference Context',
    `Reference strategy: ${referenceStrategy}`,
    `Runtime adapter: ${runtimeAdapter}`,
    `Runtime stage: ${runtimeStage}`,
    `Runtime errors: ${runtimeErrors}`,
    `Suggested next action: ${suggested}`,
    '',
    '## 4) Lint Diagnostics',
    JSON.stringify(diagnostics, null, 2),
    '',
    '## 5) Runtime Intermediate Trace',
    trace,
    '',
    '## 6) Runtime Final Env',
    finalEnv,
    '',
    '## 7) Minimal Repro Case',
    minimalRepro,
    '',
    '## 8) Current TSL Source',
    '```tsl',
    source,
    '```',
  ].join('\n');
}
