import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackRepairPayloadFromSource, summarizeHandoffReady } from '../commands/handoffCore';

test('buildFallbackRepairPayloadFromSource includes actionable fallback context', () => {
  const payload = buildFallbackRepairPayloadFromSource('x := 1;', 'fix');
  assert.equal(payload.failure_kind, 'report_missing');
  assert.match(String(payload.diff_summary), /No validation report/);
  assert.match(String(payload.suggested_next_action), /Run smoke\/spec\/oracle/);
});

test('summarizeHandoffReady includes temp file path for workspaceTempFile mode', () => {
  const text = summarizeHandoffReady('continue', 'full', 'workspaceTempFile', '/workspace/.tsl-workbench/handoff.md');
  assert.match(text, /handoff\.md/);
});

