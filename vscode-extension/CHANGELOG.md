# Changelog

## 0.5.2

- Changed `auto` connection mode to prefer `remote_api` first and only fall back to `local_client_bridge` when remote execution fails.
- Reduced Output-channel noise for normal validation runs:
  - backend command lines are no longer printed for every run
  - backend success summaries are suppressed
  - validation output is cleared and rewritten with a short status line plus the formatted TSL result table

## 0.5.1

- `auto` connection mode now prefers `remote_api` first for source files that use known board/industry runtime calls such as `GetBKByDate`, `GetBkByDate`, `StockSWIndustryNameLv1`, and `BackUpSystemParameters*`, avoiding noisy first-attempt failures from `local_client_bridge` on machines where those calls are not supported reliably.
- Local bridge execution failures caused by these runtime gaps are now classified as `local_bridge_capability_gap` instead of generic execute failures, so the extension can give clearer next-step guidance.
- Validation feedback now explicitly recommends `auto` or `remote_api` when the runtime hits one of these local bridge capability gaps.

## 0.5.0

- Added a local agent bridge inside TSL Workbench so other local tools or editor instances can call a safe, fixed set of workbench actions without reaching into arbitrary VS Code commands.
- The bridge now exposes a token-protected localhost endpoint for:
  - `validate_current_file`
  - `run_preflight`
  - `open_last_report`
  - `reveal_connection_summary`
- Added direct bridge-facing commands inside the extension for same-instance integrations:
  - `tslWorkbench.agentValidateCurrentFile`
  - `tslWorkbench.agentRunPreflight`
  - `tslWorkbench.agentOpenLastReport`
  - `tslWorkbench.agentRevealConnectionSummary`
- Added `TSL: Reveal Agent Bridge` plus sidebar status so users can inspect the generated bridge metadata file and confirm the current localhost binding.
- Added configuration for the agent bridge:
  - `tslWorkbench.agentBridge.enabled`
  - `tslWorkbench.agentBridge.host`
  - `tslWorkbench.agentBridge.port`

## 0.4.0

- Added minimal linter support for SQL-style TSL query blocks:
  - `select ... from ... where ... order by ... end` keywords are now treated as syntax keywords instead of undefined variables
  - SQL-style `select` blocks now balance correctly with their terminating `end`, avoiding false `TSL001` unmatched-end errors
  - `drange((0 to 2) of 10)` style syntax is no longer polluted by `of` false positives
- Added a backend migration guard in path resolution:
  - if `tslWorkbench.backend.root` still points at an older installed extension's bundled backend, the current extension now prefers its own bundled backend automatically
  - this reduces stale version mismatch caused by leftover workspace settings

## 0.3.8

- Fixed homework-style table output normalization for raw `Q*` fields:
  - singleton outer wrappers such as `[[row1, row2, ...]]` are now flattened to `[row1, row2, ...]`
  - this makes `Q1`/`Q7` style results display with their real row counts in the extension output
- Keeps the underlying table rows unchanged while improving output summaries such as `array[50]` and `array[200]`.

## 0.3.7

- Fixed `TSL010` false positives in real homework-style files:
  - single-quoted TSL string literals such as stock codes are now stripped before variable-usage analysis
  - `downto` is now treated as a language keyword instead of an identifier
- This removes noisy lint warnings for files such as `hw3test.tsl` while keeping real execution behavior unchanged.

## 0.3.6

- Fixed JSON serialization for validation outputs and reports:
  - non-finite floating-point values such as `NaN` and `Infinity` are now normalized to `null`
  - this prevents the VS Code extension from failing to parse backend JSON payloads

## 0.3.5

- Fixed configuration persistence for Setup Wizard and connection/runtime commands:
  - TSL Workbench now writes its machine-local settings to user/global settings instead of workspace settings
  - this avoids permission failures when the opened folder is a readonly installation directory such as `C:\Program Files\Tinysoft\AnalyseNG.NET`

## 0.3.4

- Changed the Setup Wizard TSLPy step to a clearer split flow:
  - `Auto detect TSLPy runtime`
  - `Choose Tinysoft folder manually`
  - optional `Skip` when local binding is not mandatory
- When auto-detect does not find a usable runtime, the wizard now routes the user back into that split flow instead of leaving them with a dead-end error path.

## 0.3.3

- Fixed Setup Wizard handling for `tslpy-runtime` auto-detection:
  - when the runtime probe returns a structured `fail` result, the wizard no longer surfaces it as a generic command crash
  - users now fall through to manual Tinysoft/AnalyseNG folder selection instead of seeing only `Command failed`
- This makes Python-version mismatch cases clearer, such as choosing Python 3.11 on a machine that does not expose an importable `TSLPy311`.

## 0.3.2

- Updated the extension marketplace icon to the new TSL artwork.
- Refreshed the repository and extension README files to emphasize:
  - first-run setup through `Ctrl+Shift+P` -> `TSL: Setup Wizard`
  - the normal validate workflow after setup
  - the preferred `TSL: Open in Codex` integration path

## 0.3.1

- Reduced false-positive `TSL010` lint warnings for real Tinysoft runtime code:
  - nested builtin/runtime calls are now recognized instead of being flagged as undefined variables
  - system parameter tokens such as `PN_*`, `CT_*`, and `Cy_*` no longer trigger undefined-variable warnings
  - loop control keywords such as `continue` and `break` are treated as language keywords
- Added regression tests for `hw4`-style runtime expressions and loop control handling.

## 0.2.5

- Simplified the default extension surface:
  - added `TSL: Validate Current File` as the main validation entry
  - added `TSL: Open in Codex` as the main Codex entry
  - removed `spec` / `oracle` / multi-step Codex commands from the default command palette and menus
- Updated CodeLens, sidebar rows, onboarding text, and handoff messaging to use the simplified names.
- Kept advanced validation modes in the backend for future/advanced use, while reducing day-to-day UI noise.

## 0.2.4

- Rewrote the root README and extension README to match the current product behavior.
- Setup Wizard now auto-selects the bundled backend when available instead of asking for a backend root on first use.
- Setup Wizard now auto-scans for a compatible local `TSLPy*.pyd` runtime after Python validation, with manual folder fallback only when needed.
- `TSL: Install/Bind TSLPy Runtime` now scans common locations automatically before asking the user for a folder.
- Added direct Codex integration:
  - create or refresh workspace context files
  - open the installed Codex extension when supported
  - attach the context file, current `.tsl` file, and report when the Codex extension exposes file-attach commands
  - fall back to prompt output only when direct integration is unavailable
- Clarified bundled-backend discovery as a dedicated backend source instead of treating it like a repo-attached checkout.

## 0.2.3

- Set extension publisher to `mnf-flandre` (requires Marketplace ownership verification at release time).
- Added formal release readiness gate script: `npm run release:check`.
- Added release packaging pipeline command: `npm run release:package`.
- Added explicit final-release checklist in extension README (publisher/icon/check/package).

## 0.2.2

- Added real Extension Host integration test lane using `@vscode/test-electron` and wired it into `npm test`.
- Added `TSL: Run Diagnostic Wizard` command with layered checks:
  - backend discovery
  - python runtime/module path
  - connection readiness (including password)
  - validation case/task/report paths
  - sdk/local client hints
  - last-known runtime state
- Added clean-workspace fixture and acceptance-oriented docs for external backend onboarding.
- Added troubleshooting handbook for live/local failure diagnosis.
- Added marketplace metadata hardening (`preview`, gallery banner, icon asset) while keeping publisher as explicit placeholder.

## 0.2.1-hardening

- Replaced extension smoke TODO with real smoke coverage for startup/onboarding + validation feedback core modules.
- Added onboarding guidance model used by activation flow for clearer first-run next-step prompts.
- Improved backend discovery failure handling with direct settings guidance.
- Improved preflight/validation failure messaging with clearer layer hints and suggested next actions.
- Improved Codex handoff feedback, including workspace temp-file traceability.
- Expanded runner utility tests (exec options + error formatting) and added command/onboarding/handoff feedback tests.

## 0.2.0-beta

- Added backend root discovery with `auto` / `repo_attached_mode` / `external_workspace_mode`.
- Added centralized configuration and path resolution services.
- Improved connection workflow (validation, summary, clear/reset commands).
- Added richer sidebar + status bar runtime state.
- Improved Codex handoff with selection support and concise/full prompt styles.
- Added extension-layer unit tests and packaging readiness updates.
