# Mixtape Release Frontend

Production frontend monorepo for Mixtape, Crossroads, Catalyst, mobile surfaces, and shared UI packages.

This repository is private technical proof for a live production system. Mixtape has been live since April 2026 with over 99.99% uptime. This frontend repository has over 800 commits and is part of a larger Mixtape release constellation that includes Django core, realtime services, ingestion/classification, semantic memory, research, and Puddlejump governance.

## What This System Does

Mixtape Release Frontend contains the primary user-facing surfaces for an AI-native collaboration and knowledge-stewardship platform. It includes authenticated Mixtape application views, Crossroads public and product pages, Catalyst ingestion interfaces, writing and publishing workflows, group/member surfaces, and React Native mobile work.

The frontend is built for a product where people, groups, and AI agents collaborate around knowledge over time. The experience work is therefore not just CRUD UI: it includes orientation, curation, review, publishing, semantic-memory surfaces, and operator-heavy ingestion workflows.

## Production Status

- Live production frontend since April 2026.
- Over 99.99% uptime since launch.
- Over 800 commits in this frontend repository.
- Serves real Mixtape/Crossroads users and groups.
- Built and maintained by Mark A. Lilly as founder, principal architect, and primary frontend/backend developer.

## Technical Scope

Core technologies and patterns represented here include:

- Next.js App Router applications.
- React and TypeScript application surfaces.
- Chakra UI layout and design-system work.
- TanStack Query API coordination.
- TipTap/ProseMirror writing and editing surfaces.
- Yjs-informed collaboration patterns.
- Socket.IO-backed realtime messaging surfaces.
- React Native / Expo mobile architecture.
- Authenticated API clients and shared package boundaries.
- Playwright-oriented frontend verification.

## Primary Applications

### Mixtape

Authenticated collaboration, writing, group, Catalyst, Atrium, chat, publishing, curation, and help-system surfaces.

Representative areas:

- `apps/mixtape/src/app/(authenticated)/groups/[slug]/`
- `apps/mixtape/src/components/writing/`
- `apps/mixtape/src/components/editor/`
- `apps/mixtape/src/components/projects/`
- `apps/mixtape/public/help-manifest.json`

### Crossroads

Public-facing orientation and product surfaces for Crossroads, Catalyst, Mixtape, and Tapestry.

Representative areas:

- `apps/crossroads/src/app/`
- `apps/crossroads/src/components/home/`

### Mobile

React Native / Expo architecture for capture, notifications, authenticated navigation, offline-aware boundaries, and shared API/auth packages.

Representative area:

- `apps/mobile/`

## Catalyst Frontend Work

Catalyst is the knowledge-ingestion and Codex-generation experience. Recent work refactored document ingestion toward a resourceful, operator-assisted pipeline.

The frontend now supports a more deliberate flow: source upload, first-pass inventory, duplicate awareness, section review, operator notes, domain-specific shortcuts, progress visibility, and register/entry browsing. This change supports a 91% token savings in Catalyst document parsing and ingest from the strategy shift alone, while making the human review layer explicit in the product.

Representative area:

- `apps/mixtape/src/app/(authenticated)/groups/[slug]/catalyst/page.tsx`

## What To Look At First

For product and UX review:

- Catalyst ingestion page for human/AI workflow design.
- Writing and Dispatch surfaces for editorial workflows.
- Group pages for authenticated community/product structure.
- Crossroads pages for public positioning and product storytelling.

For frontend architecture review:

- Shared API client patterns.
- Chakra layout conventions and stable class names on major layout components.
- TanStack Query usage around authenticated data flows.
- App Router organization across authenticated and public surfaces.

## Related Repositories

This frontend works with:

- `mixtape-release-core` - Django/DRF backend, Celery tasks, Catalyst ingest, service auth.
- Realtime and semantic-memory services for messaging, retrieval, research, and ingestion.
- Puddlejump - governing memory, ADRs, build plans, status notes, and agent handoff discipline.

Across the larger Mixtape release constellation:

- `mixtape-release-core` has over 500 commits.
- Puddlejump has over 700 commits.
- Remaining Mixtape release repositories have over 120 combined commits.

## Privacy And Access

This repository is private because it contains production product implementation and client-facing application code. Access is granted selectively for technical review, hiring evaluation, or trusted collaboration. Sensitive secrets are not committed to the repository.
