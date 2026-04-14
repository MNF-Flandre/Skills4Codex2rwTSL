import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { shouldTreatProbeResultAsProcessFailure } from './tslpyRuntimeSupportCore';

export interface TslPyRuntimeProbePayload {
  status?: string;
  expected_module?: string;
  recommended_sdk_path?: string;
  probes?: Array<Record<string, unknown>>;
  discovered?: Array<Record<string, unknown>>;
  install?: Record<string, unknown>;
  explanation?: string;
}

interface ProbeInput {
  pythonPath: string;
  backendRoot: string;
  sdkPaths?: string[];
  searchRoots?: string[];
  maxDepth?: number;
  writePth?: boolean;
}

export async function runTslPyRuntimeProbe(input: ProbeInput): Promise<TslPyRuntimeProbePayload> {
  const args = ['-m', 'tsl_validation.cli', 'tslpy-runtime'];
  for (const sdkPath of uniqueExistingDirs(input.sdkPaths ?? [])) {
    args.push('--sdk-path', sdkPath);
  }
  for (const searchRoot of uniqueExistingDirs(input.searchRoots ?? [])) {
    args.push('--search-root', searchRoot);
  }
  args.push('--max-depth', String(Math.max(0, input.maxDepth ?? 2)));
  if (input.writePth) {
    args.push('--write-pth');
  }

  const env = {
    ...process.env,
    PYTHONPATH: path.join(input.backendRoot, 'python'),
    PYTHONIOENCODING: 'utf-8',
  };

  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      input.pythonPath,
      args,
      {
        cwd: input.backendRoot,
        env,
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 4,
      },
      (error, out, stderr) => {
        const result = {
          stdout: String(out ?? ''),
          stderr: String(stderr ?? ''),
          errorMessage: error?.message ?? '',
        };
        if (shouldTreatProbeResultAsProcessFailure(result)) {
          reject(new Error(`${result.errorMessage}${result.stderr.trim() ? `\n${result.stderr.trim()}` : ''}`));
          return;
        }
        resolve(result.stdout.trim());
      }
    );
  });

  return JSON.parse(stdout) as TslPyRuntimeProbePayload;
}

export function buildTslPySearchRoots(workspaceRoot?: string, configuredPaths: string[] = []): string[] {
  const candidates = [
    ...configuredPaths,
    workspaceRoot || '',
    workspaceRoot ? path.dirname(workspaceRoot) : '',
    os.homedir(),
    process.env.LOCALAPPDATA || '',
    process.env.ProgramFiles || '',
    process.env['ProgramFiles(x86)'] || '',
    'C:\\',
    'D:\\',
  ];

  return uniqueExistingDirs(candidates);
}

export function summarizeTslPyProbe(payload: TslPyRuntimeProbePayload): string {
  const moduleName = payload.expected_module || 'TSLPy runtime';
  if (payload.status === 'pass' && payload.recommended_sdk_path) {
    return `${moduleName} detected at ${payload.recommended_sdk_path}`;
  }
  return `${moduleName} was not auto-detected`;
}

export async function pickTslPyFolderManually(args: {
  title: string;
  current: string;
  required: boolean;
}): Promise<string | undefined> {
  const choices = args.required
    ? ['Choose Folder', 'Enter Path Manually', 'Cancel']
    : ['Skip', 'Choose Folder', 'Enter Path Manually', 'Cancel'];
  const picked = await vscode.window.showQuickPick(choices, {
    title: args.title,
    placeHolder: args.current || (args.required ? 'Choose the folder containing TSLPy*.pyd.' : 'Optional.'),
    ignoreFocusOut: true,
  });
  if (!picked || picked === 'Cancel') {
    return undefined;
  }
  if (picked === 'Skip') {
    return '';
  }
  if (picked === 'Enter Path Manually') {
    const value = await vscode.window.showInputBox({
      title: args.title,
      value: args.current,
      validateInput: (input) => (args.required && !input.trim() ? 'Path is required.' : undefined),
      ignoreFocusOut: true,
    });
    return value?.trim();
  }
  const selected = await vscode.window.showOpenDialog({
    title: args.title,
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    defaultUri: args.current && fs.existsSync(args.current) ? vscode.Uri.file(args.current) : undefined,
    openLabel: 'Use Folder',
  });
  return selected?.[0]?.fsPath;
}

function uniqueExistingDirs(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => {
          try {
            return fs.existsSync(value) && fs.statSync(value).isDirectory();
          } catch {
            return false;
          }
        })
        .map((value) => path.normalize(value))
    )
  );
}
