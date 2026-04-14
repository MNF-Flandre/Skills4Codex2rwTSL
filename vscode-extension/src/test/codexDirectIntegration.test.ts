import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCodexIntegration } from '../commands/codexIntegrationSupport';

test('detectCodexIntegration prefers OpenAI Codex commands when available', () => {
  const result = detectCodexIntegration([
    'chatgpt.openSidebar',
    'chatgpt.newCodexPanel',
    'chatgpt.addFileToThread',
    'workbench.action.chat.open',
  ]);
  assert.equal(result.mode, 'openai-codex');
  assert.deepEqual(result.commands, [
    'chatgpt.openSidebar',
    'chatgpt.addFileToThread',
    'chatgpt.newCodexPanel',
  ]);
});

test('detectCodexIntegration falls back to VS Code chat command', () => {
  const result = detectCodexIntegration(['workbench.action.chat.open']);
  assert.equal(result.mode, 'vscode-chat');
});

test('detectCodexIntegration returns none when no supported commands are present', () => {
  const result = detectCodexIntegration(['editor.action.formatDocument']);
  assert.equal(result.mode, 'none');
});
