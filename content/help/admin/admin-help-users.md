---
title: Admin
subsystem: admin
area: overview
excerpt: Admin surfaces are where stewards and operators manage system settings, review queues, and privileged workflows that are not available in normal member navigation.
routes:
  - /admin
  - /admin/*
workAreas: []
tags:
  - admin
  - operations
  - governance
---

# Admin

Admin surfaces expose privileged tools for running Mixtape. These pages are for operators, stewards, and system managers who need to review internal state, manage settings, or advance workflows that affect other users.

## What you can do here

- Open admin-only dashboards and operational views
- Review restricted workflows such as writing-flow and sysadmin tools
- Inspect and manage data that is not available from member-facing pages

## Key concepts

**Admin access** — These pages are permission-gated. If you can open them, your account has elevated access for at least one operational area.

**Operational workflow** — A flow that changes system behavior for other people, not just your own account.

**Restricted action** — An action with broader impact than a normal member edit, such as approving, routing, or reconfiguring shared resources.

## Working safely in admin pages

1. Confirm which environment and surface you are on before making a change.
2. Read the page labels and notes carefully; many actions here have wider effects than member-facing actions.
3. If a page exposes review or approval actions, verify the target record before confirming.

## Current limitations

- Admin surfaces are still unevenly documented; some pages remain closer to internal tooling than polished product surfaces.
- Permission requirements differ by area, so access on one admin page does not imply access everywhere else.

## Related features

- **Groups** — Many admin actions ultimately affect group-level permissions, content, or routing.
- **Writing** — Writing-flow and editorial operations connect directly to the writing subsystem.
