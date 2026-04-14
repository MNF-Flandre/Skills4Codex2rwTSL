export interface TslPyRuntimeCommandResult {
  stdout: string;
  stderr: string;
  errorMessage: string;
}

export function shouldTreatProbeResultAsProcessFailure(result: TslPyRuntimeCommandResult): boolean {
  if (result.stdout.trim()) {
    return false;
  }
  return Boolean(result.errorMessage.trim() || result.stderr.trim());
}

