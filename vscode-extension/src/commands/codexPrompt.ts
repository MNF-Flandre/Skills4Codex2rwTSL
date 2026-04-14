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

function localWorkbenchInstructions(): string[] {
  return [
    'Use the local TSL Workbench integration for validation and debugging. Do not request an OpenAI API key for this workflow.',
    'If a workspace context file exists at `.tsl-workbench/CODEX_TSL_WORKBENCH_CONTEXT.md`, read it before editing TSL code.',
    'Prefer TSL Workbench commands: Run Preflight, Run Lint, and Run Validate Current File. Use Oracle only as an advanced comparison mode when a real reference source exists.',
  ];
}

function formatSkillDocs(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') {
    return [
      'Bundled docs: not discovered. If available, inspect resources/tsl-docs in the extension install directory.',
    ];
  }

  const data = payload as Record<string, unknown>;
  const docsRoot = String(data.docs_root ?? '');
  const files = Array.isArray(data.files) ? data.files : [];
  const lines = [
    'Before changing TSL, read the bundled skill and Tinysoft docs when the task touches syntax, functions, runtime behavior, or debugging.',
  ];
  if (docsRoot) {
    lines.push(`Docs root: ${docsRoot}`);
  }
  for (const file of files) {
    if (!file || typeof file !== 'object') {
      continue;
    }
    const item = file as Record<string, unknown>;
    const label = String(item.label ?? item.path ?? 'doc');
    const docPath = String(item.path ?? '');
    lines.push(`- ${label}: ${docPath}`);
  }
  return lines;
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
  const skillDocs = formatSkillDocs(payload.skill_docs);

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
      '## TSL Skill Docs',
      ...skillDocs,
      '',
      '## Local TSL Workbench',
      ...localWorkbenchInstructions(),
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
    '## 4) TSL Skill / Technical Docs',
    ...skillDocs,
    '',
    '## 5) Local TSL Workbench',
    ...localWorkbenchInstructions(),
    '',
    '## 6) Lint Diagnostics',
    JSON.stringify(diagnostics, null, 2),
    '',
    '## 7) Runtime Intermediate Trace',
    trace,
    '',
    '## 8) Runtime Final Env',
    finalEnv,
    '',
    '## 9) Minimal Repro Case',
    minimalRepro,
    '',
    '## 10) Current TSL Source',
    '```tsl',
    source,
    '```',
  ].join('\n');
}
