import * as vscode from 'vscode';
import { ExtensionRuntimeState } from '../types';

class WorkbenchItem extends vscode.TreeItem {
  public constructor(label: string, description: string, command?: vscode.Command) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.command = command;
  }
}

export class TslWorkbenchProvider implements vscode.TreeDataProvider<WorkbenchItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  public constructor(private readonly state: ExtensionRuntimeState) {}

  public refresh(): void {
    this.onDidChangeEmitter.fire();
  }

  public getTreeItem(element: WorkbenchItem): vscode.TreeItem {
    return element;
  }

  public getChildren(): WorkbenchItem[] {
    return [
      new WorkbenchItem('Connection', this.state.connectionSummary, {
        command: 'tslWorkbench.configureConnection',
        title: 'Configure Connection',
      }),
      new WorkbenchItem('Preflight', this.state.preflightStatus, {
        command: 'tslWorkbench.runPreflight',
        title: 'Run Preflight',
      }),
      new WorkbenchItem('Last Validation', `${this.state.lastValidationMode} ${this.state.validationStatus}`.trim(), {
        command: 'tslWorkbench.runOracleCurrentFile',
        title: 'Run Oracle',
      }),
      new WorkbenchItem('Reports', this.state.lastReportPath || 'No report yet', {
        command: 'tslWorkbench.openLastReport',
        title: 'Open Last Report',
      }),
      new WorkbenchItem('Codex Handoff', this.state.codexHandoffStatus, {
        command: 'tslWorkbench.askCodexFixCurrentFile',
        title: 'Ask Codex to Fix',
      }),
    ];
  }
}
