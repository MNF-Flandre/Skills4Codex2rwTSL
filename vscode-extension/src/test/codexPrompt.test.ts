import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCodexPrompt } from '../commands/codexPrompt';

test('buildCodexPrompt full mode contains key fields', () => {
  const prompt = buildCodexPrompt(
    'fix',
    {
      source: 'begin\nend;',
      validation_mode: 'oracle',
      failure_kind: 'oracle_mismatch',
      mismatch_fields: ['signal'],
      runtime_errors: ['none'],
    },
    'full'
  );
  assert.match(prompt, /Validation mode: oracle/);
  assert.match(prompt, /Failure kind: oracle_mismatch/);
  assert.match(prompt, /Task Goal/);
  assert.match(prompt, /Action request/);
  assert.match(prompt, /Local TSL Workbench/);
  assert.match(prompt, /Do not request an OpenAI API key/);
  assert.match(prompt, /Current TSL Source/);
});

test('buildCodexPrompt concise mode is shorter and keeps objective', () => {
  const prompt = buildCodexPrompt('explain', { source: 'x := 1;' }, 'concise');
  assert.match(prompt, /Concise/);
  assert.match(prompt, /Objective/);
  assert.match(prompt, /x := 1;/);
});
