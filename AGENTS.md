# AGENTS.md - Repository Root

Purpose: conservative operating guide for agents working in this monorepo.

## Priority and Scope
- This file applies repository-wide unless a deeper `AGENTS.md` exists in a subdirectory.
- More specific `AGENTS.md` files take precedence for files in their subtree.
- Keep changes scoped to the user request; avoid unrelated cleanup.

## Conservative Defaults
- Ask for confirmation before editing files.
- Ask for confirmation before running state-changing commands (tests, builds, installs, formatters, generators, migrations).
- Prefer read-only investigation first (list files, inspect configs, review existing patterns).
- Do not use network access unless explicitly approved for that command.
- Do not run destructive commands (`rm -rf`, `git reset --hard`, `git clean -fd`, force pushes) unless explicitly requested.
- Do not create commits, tags, or branches unless explicitly requested.

## Testing Work (Playwright / Frontend)
- Reuse existing Playwright setup and conventions before introducing new harnesses.
- Prefer incremental additions with clear naming and stable selectors.
- For new frontend tests requested by the user, stage work under `pre-tests/` first unless told otherwise.
- Document assumptions and required env/services before attempting to run tests.

## Change Hygiene
- Before editing: summarize intended edits and target files.
- After editing: summarize exactly what changed and any follow-up verification steps.
- If instructions conflict or are ambiguous, stop and ask for clarification.

