import { HandoffMode, PromptStyle } from './codexPrompt';

export type HandoffOutputMode = 'clipboard' | 'newDocument' | 'both' | 'workspaceTempFile';

export function buildFallbackRepairPayloadFromSource(source: string, mode: HandoffMode): Record<string, unknown> {
  return {
    source,
    diagnostics: [],
    validation_mode: mode === 'continue' ? 'unknown' : mode,
    failure_kind: 'report_missing',
    diff_summary: 'No validation report found. Run Validate Current File first for richer context.',
    mismatch_fields: [],
    reference_strategy: 'unknown',
    runtime_adapter: 'unknown',
    runtime_stage: '',
    runtime_errors: [],
    runtime_intermediate_trace: [],
    runtime_final_env: {},
    suggested_next_action: 'Run Validate Current File on the current file, then retry Codex handoff.',
    minimal_repro_case: {},
  };
}

export function summarizeHandoffReady(
  mode: HandoffMode,
  style: PromptStyle,
  outputMode: HandoffOutputMode,
  outputPath?: string,
  displayLabel: string = mode
): string {
  if (outputMode === 'workspaceTempFile' && outputPath) {
    return `Codex ready (${displayLabel}/${style}) -> ${outputPath}`;
  }
  return `Codex ready (${displayLabel}/${style}/${outputMode})`;
}
