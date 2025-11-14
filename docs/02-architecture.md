# Architecture

## System Overview
Mixtape Release is a full-stack web application with a React/Next.js frontend and Django backend.

## High-Level Architecture

```
┌─────────────────────────────────────┐
│   Frontend (Next.js 15 / React 19)  │
│   Port: 3010                         │
│   - App Router                       │
│   - Chakra UI v3                     │
│   - TypeScript                       │
└────────────┬────────────────────────┘
             │
             │ HTTP/HTTPS (JWT Auth)
             │
┌────────────▼────────────────────────┐
│   Backend (Django)                   │
│   [Port TBD]                         │
│   - REST API                         │
│   - JWT Authentication               │
│   - PostgreSQL                       │
└─────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **UI Library**: Chakra UI v3
- **Language**: TypeScript
- **State Management**: [TBD - Zustand or React Context]
- **Data Fetching**: [TBD - TanStack Query]
- **HTTP Client**: Axios
- **Validation**: [TBD - considering Zod]

### Folder Structure
```
mixtape-release-frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and API clients
│   └── types/           # TypeScript type definitions
├── docs/                # Documentation
└── public/              # Static assets
```

### Code Organization Pattern
1. **API Layer** (`src/lib/api/`): Axios-based API client functions
2. **Hook Layer** (`src/hooks/`): Custom hooks that use API functions
3. **Component Layer** (`src/components/`, `src/app/`): UI components that use hooks

### Authentication Flow
[TBD - To be documented once implemented]

## Backend Architecture
[To be documented in mixtape-release-core]

## Deployment
[TBD]

## External Services
[TBD]

---

## Sub-Modules

### Authentication Module
**Status**: Planned
**Purpose**: Handle user authentication and session management
**Components**:
- Login page
- Auth hooks
- Token management
- Protected route wrapper

[More modules to be added as developed]

---

*Last updated: 2025-11-10*
*Status: Initial setup - pre-authentication phase*
