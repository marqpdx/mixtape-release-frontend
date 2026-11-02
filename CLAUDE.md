# CLAUDE.md — mixtape-release-frontend

Frontend application for the Mixtape platform.

---

## Meridian — Code Intelligence Layer (interim)

This repo is indexed by CodeGraph (`.codegraph/` at the repo root), Meridian's
Phase 1 structural index (ADR-0051). Use it before grep/find or reading files
to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` — one call returns the
  relevant symbols' source plus call paths between them, including
  dynamic-dispatch hops grep can't follow.
- **Shell** (always works): `codegraph explore "<symbol names or question>"`.

This is Meridian Phase 1 only — there is no shared Switchboard-routed index
yet (waits on SW-11) and no Meridian/Wiki narrative layer yet (Phase 1.5,
blocked on Inkwell). Don't expect `repo_overview`, `trace_model`,
`query_governing_docs`, or any other Phase 2 tool named in
`../puddlejump/decisions/meridian-adr/meridian-claude-block.md` — that block
documents a later phase and isn't live yet.

---

## ADR Status Protocol

When implementation work in this repo is governed by an ADR: read `{adr-name}-status.md` (in `../puddlejump/decisions/`) at the start of every session. Update the checkpoint table (row → ✅, commit hash) as phases complete. If no status file exists for the ADR, flag it — one should have been created at ratification.

---

## className Convention

Add `className` to weight-bearing Chakra layout components: page roots, section
containers, grids, nav bars, tab roots, tab content areas. Skip leaf nodes
(Text, Button, Icon) unless they are a specific targeting need.

**Naming:** short prefix scoped to the component file + semantic name.
Format: `prefix-semantic-name` (e.g. `glb-header`, `glbt-nav`, `glbo-root`).
Prefix: 3–4 chars derived from the component name (GroupLandingB → `glb-`).

**Add classNames when the component is first written**, not retrofitted later.

**Why:** lets CSS and layout instructions reference components by stable name
instead of describing nested structure. A instruction like "add padding to
`.glbt-nav`" is unambiguous; "the Box inside the Tabs.Root" is not.

---

## Commit Handoff

Every unit of work — including ad hoc changes — should produce a named git
commit in this repo. Then put its build-log entry (format below) in your
agent-inbox update: show the update to the CTO, ask "Send to Puddlejump?",
and on a yes write and commit that one file, `../puddlejump/agent-inbox/YYYY-MM-DD-<agent>-<topic>.md`
(`../CLAUDE.md`, *Shared Work Between Agents*; format in the agent-inbox README). Puddlejump files the entry in `build-log-inbox/` and
`build-log.md`; don't write to either yourself, and don't paste updates for
the CTO to carry. (One writer per shared log, CTO, 2026-10-23; this section
brought in line with `AGENTS.md`, 2026-11-02.)

File content (inside your agent-inbox update):

```
---
repo: mixtape-release-frontend
commit: "[short hash] — [one-line commit message]"
date: [YYYY-MM-DD]
work_effort: [ADR, build plan, or initiative name]
---

[2–4 sentences — what was implemented and why, written for someone reading
this log months from now. Name the models, endpoints, or surfaces involved.
Avoid vague summaries like "fixed some bugs."]
```
