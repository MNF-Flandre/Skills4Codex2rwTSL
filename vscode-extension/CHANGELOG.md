# Changelog

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
