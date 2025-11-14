# Design Decisions

## Overview
This document tracks key technical decisions, their rationale, and alternatives considered.

---

## DD-001: Next.js 15 with App Router
**Date**: 2025-11-10
**Status**: Adopted
**Decision Makers**: Team

### Context
Needed to choose between Next.js Pages Router vs App Router for new project.

### Decision
Use Next.js 15 with App Router (`src/app/` directory).

### Rationale
- App Router is the recommended approach for new Next.js projects
- Better support for React Server Components
- Improved routing and layouts
- Future-proof as Pages Router is legacy

### Alternatives Considered
- Pages Router: More mature but being phased out
- Other frameworks (Remix, Vite): Less integrated full-stack solution

### Consequences
- Need to learn App Router patterns
- Some third-party libraries may not fully support RSC yet
- Better performance and DX long-term

---

## DD-002: Chakra UI v3
**Date**: 2025-11-10
**Status**: Adopted
**Decision Makers**: Team

### Context
Needed component library for UI development.

### Decision
Use Chakra UI v3 (latest version).

### Rationale
- Team has prior experience with Chakra
- Excellent TypeScript support
- Good accessibility defaults
- Customizable design system

### Alternatives Considered
- Material UI: More opinionated
- Tailwind + headless UI: More manual
- shadcn/ui: Newer, less proven

### Consequences
- Locked into Chakra's API and patterns
- Need to ensure v3 compatibility with React 19
- Consistent design system out of the box

---

## DD-003: Yarn Package Manager
**Date**: 2025-11-10
**Status**: Adopted
**Decision Makers**: Team

### Context
Need to standardize package manager across project.

### Decision
Use Yarn for package management.

### Rationale
- Team preference and familiarity
- Fast and reliable
- Good workspace support for potential monorepo

### Alternatives Considered
- npm: Slower, less features
- pnpm: More efficient but less familiar

### Consequences
- All contributors must use Yarn
- Consistent lock file (`yarn.lock`)

---

## DD-004: Port 3010 for Development
**Date**: 2025-11-10
**Status**: Adopted

### Context
Port 3000 already in use by another project.

### Decision
Run frontend dev server on port 3010.

### Rationale
- Avoids conflict with existing project on 3000
- Easy to remember (3010 = "30" for Mixtape + "10" for frontend)

### Consequences
- Need to document port in README
- Update any hardcoded URLs to use 3010

---

## DD-005: TypeScript Strict Mode
**Date**: 2025-11-10
**Status**: Adopted

### Context
Need to decide on TypeScript strictness level.

### Decision
Enable strict mode in `tsconfig.json`.

### Rationale
- Catch more errors at compile time
- Better IDE support and autocomplete
- Enforces best practices
- Easier to maintain as project grows

### Consequences
- More verbose type definitions needed
- Learning curve for team members less familiar with strict TS

---

## DD-006: Code Organization Pattern
**Date**: 2025-11-10
**Status**: Adopted

### Context
Need consistent pattern for organizing API calls, business logic, and UI.

### Decision
Use three-layer architecture:
1. **API Layer** (`src/lib/api/`): Axios-based HTTP clients
2. **Hook Layer** (`src/hooks/`): React hooks wrapping API calls
3. **Component Layer**: UI components consuming hooks

### Rationale
- Clear separation of concerns
- API logic is reusable across hooks
- Hooks can add additional state management
- Components stay clean and focused on UI
- Easy to test each layer independently

### Example
```typescript
// 1. API Layer (src/lib/api/users.ts)
export const getUser = (id: number) => axios.get(`/users/${id}`);

// 2. Hook Layer (src/hooks/useUser.ts)
export const useUser = (id: number) => {
  return useQuery(['user', id], () => getUser(id));
};

// 3. Component Layer
const UserProfile = () => {
  const { data: user } = useUser(1);
  return <div>{user.name}</div>;
};
```

### Alternatives Considered
- All-in-one: API calls directly in components (less maintainable)
- Redux-style actions: Too much boilerplate for this project

### Consequences
- Need to create files in 3 places for new API features
- Clear structure makes onboarding easier
- Easier to refactor API without touching components

---

## DD-007: Documentation Structure
**Date**: 2025-11-10
**Status**: Adopted

### Context
Need to maintain living documentation that evolves with the codebase.

### Decision
Maintain 4 core documentation files:
1. `01-business-and-use-cases.md`: User stories and business rules
2. `02-architecture.md`: System design and module breakdown
3. `03-data-models.md`: API contracts and JSON schemas
4. `04-design-decisions.md`: This file - ADR-style decisions

### Rationale
- Each doc has a clear purpose
- Numbered for suggested reading order
- Living docs that update with code
- Covers business, technical, and historical context

### Consequences
- Must update docs when making significant changes
- Helps onboard new developers
- Creates historical record of "why"

---

## Pending Decisions

### PD-001: State Management Solution
**Status**: Under consideration
**Options**:
- Zustand: Lightweight, simple API
- React Context: Built-in, good for simple cases
- Redux Toolkit: More boilerplate, better DevTools

**Next Step**: Decide when implementing authentication (need to store user state)

---

### PD-002: Data Fetching Library
**Status**: Leaning toward TanStack Query
**Options**:
- TanStack Query: Industry standard, great DX
- SWR: Simpler, smaller
- Plain axios: More manual

**Next Step**: Will adopt TanStack Query unless issues arise

---

### PD-003: Schema Validation with Zod
**Status**: Under consideration
**Options**:
- Zod: TypeScript-first, great DX
- Yup: More mature, less TypeScript-focused
- None: Manual validation

**Rationale for Zod**:
- Runtime validation of API responses
- Auto-generate TypeScript types
- Self-documenting schemas
- Catches API contract changes

**Next Step**: Evaluate during API integration phase

---

*Last updated: 2025-11-10*
*Status: Living document - updated as decisions are made*
