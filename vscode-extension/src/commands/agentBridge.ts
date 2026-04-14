import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { ConfigurationService } from '../config/configurationService';
import { AgentBridgeAction, getAgentBridgeStateFilePath, listAgentBridgeActions, normalizeAgentBridgeAction } from './agentBridgeCore';
import { AgentBridgeStateSnapshot, ExtensionRuntimeState } from '../types';

interface AgentBridgeInfo {
  version: 1;
  extensionId: string;
  extensionVersion: string;
  bridgeType: 'http';
  host: string;
  port: number;
  token: string;
  url: string;
  stateFilePath: string;
  workspaceRoot: string;
  commands: AgentBridgeAction[];
  startedAt: string;
  pid: number;
}

interface AgentBridgeOptions {
  extensionContext: vscode.ExtensionContext;
  configuration: ConfigurationService;
  output: vscode.OutputChannel;
  workspaceRoot?: string;
  state: ExtensionRuntimeState;
  getSnapshot: () => AgentBridgeStateSnapshot;
}

interface InvokeHandlers {
  validateCurrentFile: (filePath?: string) => Promise<Record<string, unknown>>;
  runPreflight: () => Promise<Record<string, unknown>>;
  openLastReport: () => Promise<Record<string, unknown>>;
  revealConnectionSummary: () => Promise<Record<string, unknown>>;
}

export class AgentBridgeServer implements vscode.Disposable {
  private server?: http.Server;
  private info?: AgentBridgeInfo;

  public constructor(private readonly options: AgentBridgeOptions, private readonly handlers: InvokeHandlers) {}

  public async start(): Promise<void> {
    if (!this.options.configuration.isAgentBridgeEnabled()) {
      this.options.state.agentBridgeStatus = 'disabled';
      this.deleteStateFile();
      return;
    }
    if (this.server) {
      return;
    }

    const host = this.options.configuration.getAgentBridgeHost() || '127.0.0.1';
    const requestedPort = this.options.configuration.getAgentBridgePort();
    const token = crypto.randomBytes(24).toString('hex');
    const stateFilePath = getAgentBridgeStateFilePath(this.options.workspaceRoot, this.options.extensionContext.globalStorageUri.fsPath);
    const extensionVersion = this.options.extensionContext.extension.packageJSON.version as string;

    this.server = http.createServer(async (req, res) => {
      try {
        await this.handleRequest(req, res);
      } catch (error) {
        this.options.output.appendLine(`[agent-bridge] request failed: ${error instanceof Error ? error.message : String(error)}`);
        writeJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    });

    const address = await new Promise<AddressInfo>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(requestedPort, host, () => {
        const value = this.server!.address();
        if (!value || typeof value === 'string') {
          reject(new Error('TSL agent bridge did not resolve to a TCP address.'));
          return;
        }
        resolve(value);
      });
    });

    this.info = {
      version: 1,
      extensionId: 'mnf-flandre.tsl-workbench',
      extensionVersion,
      bridgeType: 'http',
      host,
      port: address.port,
      token,
      url: `http://${host}:${address.port}/invoke`,
      stateFilePath,
      workspaceRoot: this.options.workspaceRoot || '',
      commands: listAgentBridgeActions(),
      startedAt: new Date().toISOString(),
      pid: process.pid,
    };

    this.writeStateFile();
    this.options.state.agentBridgeStatus = `listening ${host}:${address.port}`;
    this.options.output.appendLine(`[agent-bridge] listening on ${host}:${address.port}`);
  }

  public async reveal(): Promise<void> {
    if (!this.info) {
      await this.start();
    }
    if (!this.info) {
      throw new Error('TSL agent bridge is disabled.');
    }
    this.writeStateFile();
    const doc = await vscode.workspace.openTextDocument(this.info.stateFilePath);
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  public dispose(): void {
    try {
      this.server?.close();
    } catch {
      // ignore shutdown failures
    }
    this.server = undefined;
    this.deleteStateFile();
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (req.method === 'GET' && req.url === '/health') {
      writeJson(res, 200, { ok: true, bridge: this.info, state: this.options.getSnapshot() });
      return;
    }

    if (req.method !== 'POST' || req.url !== '/invoke') {
      writeJson(res, 404, { ok: false, error: 'unsupported_route' });
      return;
    }

    const body = await readJsonBody(req);
    const token = readToken(req, body);
    if (!token || token !== this.info?.token) {
      writeJson(res, 403, { ok: false, error: 'invalid_token' });
      return;
    }

    const action = normalizeAgentBridgeAction(String(body.action || body.tool || ''));
    if (!action) {
      writeJson(res, 400, { ok: false, error: 'unsupported_action' });
      return;
    }

    if (action === 'ping') {
      writeJson(res, 200, { ok: true, action, bridge: this.info, state: this.options.getSnapshot() });
      return;
    }

    const result = await this.invokeAction(action, body);
    writeJson(res, 200, { ok: true, action, result, state: this.options.getSnapshot() });
  }

  private async invokeAction(action: AgentBridgeAction, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    switch (action) {
      case 'validate_current_file':
        return this.handlers.validateCurrentFile(typeof body.filePath === 'string' ? body.filePath : undefined);
      case 'run_preflight':
        return this.handlers.runPreflight();
      case 'open_last_report':
        return this.handlers.openLastReport();
      case 'reveal_connection_summary':
        return this.handlers.revealConnectionSummary();
      default:
        throw new Error(`Unsupported agent bridge action: ${action}`);
    }
  }

  private writeStateFile(): void {
    if (!this.info) {
      return;
    }
    const payload = {
      ...this.info,
      state: this.options.getSnapshot(),
      updatedAt: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(this.info.stateFilePath), { recursive: true });
    fs.writeFileSync(this.info.stateFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  }

  private deleteStateFile(): void {
    if (!this.info?.stateFilePath) {
      return;
    }
    try {
      fs.rmSync(this.info.stateFilePath, { force: true });
    } catch {
      // ignore cleanup failures
    }
  }
}

function writeJson(res: http.ServerResponse, statusCode: number, payload: Record<string, unknown>): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(`${JSON.stringify(payload)}\n`);
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    if (chunks.reduce((sum, item) => sum + item.length, 0) > 1024 * 1024) {
      throw new Error('request body too large');
    }
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) {
    return {};
  }
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('request body must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

function readToken(req: http.IncomingMessage, body: Record<string, unknown>): string {
  const header = req.headers['x-tsl-workbench-token'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  if (typeof body.token === 'string') {
    return body.token;
  }
  return '';
}
