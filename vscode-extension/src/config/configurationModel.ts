import { BackendMode, ConnectionMode, ValidationAdapter } from '../types';

export function normalizeBackendMode(mode: string): BackendMode {
  if (mode === 'repo_attached_mode' || mode === 'external_workspace_mode') {
    return mode;
  }
  return 'auto';
}

export function normalizeValidationAdapter(adapter: string): ValidationAdapter {
  if (adapter === 'mock' || adapter === 'pytsl') {
    return adapter;
  }
  return 'auto';
}

export function normalizeConnectionMode(mode: string): ConnectionMode {
  return mode === 'remote_api' ? 'remote_api' : 'local_client_bridge';
}

