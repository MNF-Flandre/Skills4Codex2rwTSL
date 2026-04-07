import * as vscode from 'vscode';
import { ExtensionRuntimeState } from '../types';
import { getWorkbenchRows } from './workbenchRows';

class WorkbenchItem extends vscode.TreeItem {
  public constructor(label: string, description: string, tooltip: string, command?: vscode.Command, icon?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.tooltip = tooltip;
    this.command = command;
    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon);
    }
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
    return getWorkbenchRows(this.state).map(
      (row) =>
        new WorkbenchItem(
          row.label,
          row.description,
          row.tooltip,
          {
            command: row.command,
            title: row.title,
          },
          row.icon
        )
    );
  }
}
