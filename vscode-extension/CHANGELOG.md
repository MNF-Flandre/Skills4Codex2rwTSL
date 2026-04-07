# Changelog

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
