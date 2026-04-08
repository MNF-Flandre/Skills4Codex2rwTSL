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

export function formatTslOutputTables(payload: ValidationPayload): string {
  const runtimePayload = isRecord(payload.result?.metadata?.runtime_payload) ? payload.result?.metadata?.runtime_payload : undefined;
  const output = payload.result?.tsl_output ?? (isRecord(runtimePayload?.outputs) ? runtimePayload.outputs : undefined);
  if (!isRecord(output)) {
    return 'TSL Output: <no output>';
  }

  const visibleEntries = sortedOutputEntries(output).filter(([key, value]) => shouldDisplayOutputField(key, value));
  if (!visibleEntries.length) {
    return 'TSL Output: <empty>';
  }

  const scalarRows: string[][] = [['field', 'type', 'value']];
  for (const [key, value] of visibleEntries) {
    if (isRecordList(value)) {
      scalarRows.push([key, `${value.length} rows`, previewRecordList(value)]);
    } else if (isRecord(value) && shallowPrimitiveRecord(value)) {
      scalarRows.push([key, 'dict', compactValue(value)]);
    } else {
      scalarRows.push([key, valueType(value), compactValue(value)]);
    }
  }

  return ['TSL Output', formatRows(scalarRows)].filter(Boolean).join('\n\n');
}

function sortedOutputEntries(output: Record<string, unknown>): Array<[string, unknown]> {
  return Object.entries(output).sort(([left], [right]) => {
    const lq = /^Q(\d+)$/i.exec(left);
    const rq = /^Q(\d+)$/i.exec(right);
    if (lq && rq) {
      return Number(lq[1]) - Number(rq[1]);
    }
    if (lq) {
      return -1;
    }
    if (rq) {
      return 1;
    }
    return left.localeCompare(right);
  });
}

function shouldDisplayOutputField(key: string, value: unknown): boolean {
  const nullableTemplateFields = new Set(['signal', 'value', 'window']);
  if (nullableTemplateFields.has(key) && (value === null || value === undefined)) {
    return false;
  }
  if (key === 'series_tail' && Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordList(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.length > 0 && value.every(isRecord);
}

function shallowPrimitiveRecord(value: Record<string, unknown>): boolean {
  return Object.values(value).every((item) => !isRecord(item) && !isRecordList(item));
}

function tableShape(records: Array<Record<string, unknown>>): string {
  const cols = new Set<string>();
  for (const row of records) {
    for (const key of Object.keys(row)) {
      cols.add(key);
    }
  }
  return `${records.length} rows x ${cols.size} cols`;
}

function previewRecordList(records: Array<Record<string, unknown>>): string {
  if (!records.length) {
    return '0 rows';
  }
  return `${tableShape(records)}; first=${compactValue(records[0])}`;
}

function valueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'list';
  }
  if (isRecord(value)) {
    return 'dict';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function compactValue(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return truncate(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }
  try {
    return truncate(JSON.stringify(value));
  } catch {
    return truncate(String(value));
  }
}

function truncate(value: string, maxLength = 96): string {
  const singleLine = value.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }
  return `${singleLine.slice(0, maxLength - 3)}...`;
}

function formatRows(rows: string[][]): string {
  const widths = rows[0].map((_, col) => Math.min(32, Math.max(...rows.map((row) => (row[col] ?? '').length))));
  return rows
    .map((row, rowIdx) => {
      const line = row.map((cell, col) => padCell(cell ?? '', widths[col])).join('  ');
      if (rowIdx === 0) {
        const separator = widths.map((width) => '-'.repeat(width)).join('  ');
        return `${line}\n${separator}`;
      }
      return line;
    })
    .join('\n');
}

function padCell(value: string, width: number): string {
  const text = value.length > width ? `${value.slice(0, Math.max(0, width - 3))}...` : value;
  return text.padEnd(width, ' ');
}
