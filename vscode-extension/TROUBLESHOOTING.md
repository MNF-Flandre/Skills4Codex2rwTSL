# TSL Workbench Troubleshooting (Live + Local)

This guide is for runtime and integration failures in VS Code extension workflows.

## 1) `failure_kind` / `runtime_stage` quick map

- `lint_error`: static diagnostics block/impact validation
- `config_error`: backend/config/path settings invalid
- `runtime_failure` / `execute_error`: runtime call failed
- `spec_failure`: schema/type/required field mismatch
- `oracle_mismatch`: runtime output mismatches reference output

Typical `runtime_stage` values:
- `preflight`
- `connect`
- `execute`
- `normalize`
- `compare`

Use `TSL: Run Diagnostic Wizard` + Output channel first.

## 2) Backend discovery failed

Symptoms:
- activation warning about backend discovery
- commands fail before runtime starts

Fix:
1. Set `tslWorkbench.backend.mode` to `external_workspace_mode` for non-repo workspaces.
2. Set `tslWorkbench.backend.root` to repo root containing:
   - `python/ide_bridge.py`
   - `python/tsl_validation/cli.py`
3. Reload window and rerun Diagnostic Wizard.

## 3) Python / PYTHONPATH issues

Symptoms:
- preflight fails with Python execution errors
- command output mentions module import failures

Fix:
1. Set `tslWorkbench.pythonPath` to valid executable (`python`, `python3`, full path).
2. Confirm `tslWorkbench.backend.pythonModulePath` exists under backend root (default `python`).
3. Run `TSL: Run Diagnostic Wizard` to verify python runtime + module path checks.

## 4) Connection incomplete

Symptoms:
- status shows `Not configured` or `Config incomplete`
- preflight reports config/network failures

Fix:
1. Run `TSL: Configure Connection`.
2. Fill host + port + mode.
3. Store password in SecretStorage (input during configure flow).
4. Run `TSL: Run Preflight`.

## 5) Password missing or cleared

Symptoms:
- connection summary indicates `password:no`
- preflight blocked by config

Fix:
1. Run `TSL: Configure Connection` and enter password.
2. If needed, run `TSL: Clear Stored Password` then reconfigure.

## 6) case/task/report path issues

Symptoms:
- validation command fails early with file not found
- open report command fails

Fix:
1. Check:
   - `tslWorkbench.validation.casePathSmoke`
   - `tslWorkbench.validation.casePathSpec`
   - `tslWorkbench.validation.casePathOracle`
   - `tslWorkbench.validation.taskPath`
   - `tslWorkbench.validation.reportPath`
2. Use absolute paths if workspace-relative paths are ambiguous.
3. Ensure report directory exists.

## 7) local_client_bridge SDK / client path issues

Symptoms:
- runtime preflight or execute indicates SDK/client missing

Fix:
1. Set `tslWorkbench.connection.sdkPath` when SDK discovery fails.
2. Set `tslWorkbench.connection.localClientPath` when local bridge client is non-default.
3. Re-run preflight and inspect Output.

## 8) Live oracle current limitations

- Live mode still depends on local runtime/account/network.
- `auto` adapter may fallback to `mock` when live requirements are not satisfied.
- For strict live verification, use live-ready config and confirm preflight before oracle.

## 9) Fast recovery order

1. `TSL: Run Diagnostic Wizard`
2. `TSL: Configure Connection`
3. `TSL: Run Preflight`
4. Open `.tsl` file, run lint/smoke
5. Run oracle
6. If mismatch, open report and use Codex handoff

