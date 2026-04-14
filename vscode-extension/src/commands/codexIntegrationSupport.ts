export type CodexIntegrationMode = 'openai-codex' | 'vscode-chat' | 'none';

export interface CodexIntegrationSupport {
  mode: CodexIntegrationMode;
  commands: string[];
}

export function detectCodexIntegration(commands: string[]): CodexIntegrationSupport {
  const normalized = new Set(commands);
  if (normalized.has('chatgpt.openSidebar') && normalized.has('chatgpt.addFileToThread')) {
    const supported = ['chatgpt.openSidebar', 'chatgpt.addFileToThread'];
    if (normalized.has('chatgpt.newCodexPanel')) {
      supported.push('chatgpt.newCodexPanel');
    }
    if (normalized.has('chatgpt.newChat')) {
      supported.push('chatgpt.newChat');
    }
    if (normalized.has('chatgpt.addToThread')) {
      supported.push('chatgpt.addToThread');
    }
    return { mode: 'openai-codex', commands: supported };
  }
  if (normalized.has('workbench.action.chat.open')) {
    return { mode: 'vscode-chat', commands: ['workbench.action.chat.open'] };
  }
  return { mode: 'none', commands: [] };
}
