type CheckStatus = 'pass' | 'warn' | 'fail';

export interface DiagnosticCheck {
  name: string;
  status: CheckStatus;
  detail: string;
  nextAction: string;
}

export interface DiagnosticReport {
  generatedAt: string;
  backendRoot: string;
  checks: DiagnosticCheck[];
  lastKnownState: {
    preflightStatus: string;
    validationStatus: string;
    lastValidationMode: string;
    lastFailureKind: string;
    lastReportPath: string;
  };
}

export function summarizeDiagnosticReport(report: DiagnosticReport): string {
  const failCount = report.checks.filter((c) => c.status === 'fail').length;
  const warnCount = report.checks.filter((c) => c.status === 'warn').length;
  if (failCount > 0) {
    return `${failCount} fail, ${warnCount} warn. Fix failed checks first.`;
  }
  if (warnCount > 0) {
    return `All critical checks passed, ${warnCount} warning(s) remain.`;
  }
  return 'All diagnostic checks passed.';
}

