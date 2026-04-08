import { HandoffMode, PromptStyle } from './codexPrompt';

export type HandoffOutputMode = 'clipboard' | 'newDocument' | 'both' | 'workspaceTempFile';

export function buildFallbackRepairPayloadFromSource(source: string, mode: HandoffMode): Record<string, unknown> {
  return {
    source,
    diagnostics: [],
    validation_mode: mode === 'continue' ? 'unknown' : mode,
    failure_kind: 'report_missing',
    diff_summary: 'No validation report found. Run smoke/spec/oracle first for richer context.',
    mismatch_fields: [],
    reference_strategy: 'unknown',
    runtime_adapter: 'unknown',
    runtime_stage: '',
    runtime_errors: [],
    runtime_intermediate_trace: [],
    runtime_final_env: {},
    suggested_next_action: 'Run smoke/spec/oracle on current file, then retry Codex handoff.',
    minimal_repro_case: {},
  };
}

export function summarizeHandoffReady(
  mode: HandoffMode,
  style: PromptStyle,
  outputMode: HandoffOutputMode,
  outputPath?: string
): string {
  if (outputMode === 'workspaceTempFile' && outputPath) {
    return `Codex handoff ready (${mode}/${style}) -> ${outputPath}`;
  }
  return `Codex handoff ready (${mode}/${style}/${outputMode})`;
}
