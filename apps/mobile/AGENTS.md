# AGENTS.md – Mixtape Mobile Client (React Native)

**Purpose:**  
Instructions for Codex when operating inside the Mixtape mobile client directory.  
This is a **subset** of the Mixtape platform and should remain decoupled from unrelated backend/services unless explicitly asked.

---

## Scope & Repo Context

This directory contains the Mixtape **mobile client** built with:

- React Native (likely Expo)
- TypeScript
- Shared client libraries (API, auth, types, hooks)
- Minimal backend touchpoints (HTTP APIs + optional realtime)

Codex must treat this as the primary scope when run from this directory.

**Do not** modify sibling projects (e.g., `mixtape_core/`, `hub3/`, `livewire/`) unless the user explicitly requests a cross-project change.

---

## Core Principles

- **Copy existing patterns in this mobile codebase** (folder structure, naming, hooks style, API wrappers, state management).
- Prefer **small, incremental, reviewable changes**.
- When proposing a different architecture (state management, navigation, query caching, etc.):
  - Explain why it’s worth it.
  - Summarize trade-offs.
  - Wait for explicit approval before refactoring widely.

---

## Technical Conventions (Mobile)

### TypeScript
- Prefer strict typing.
- Avoid `any` unless unavoidable (and document why).
- Keep shared domain types under a stable location (e.g., `src/types/`).

### Navigation
- Follow the project’s existing navigation approach (e.g., React Navigation, Expo Router).
- Do not introduce a new navigation system unless explicitly approved.

### State & Data Fetching
- Use the existing data fetching approach (e.g., React Query, SWR, custom hooks).
- If React Query is used:
  - Keep query keys consistent and centralized where appropriate.
  - Prefer small hooks (`useCourses`, `useCourse(id)`) over one giant “EarthLab hook”.
- Global state uses Zustand stores in `src/stores/*` (e.g., `useAuthStore`, `useChatStore`).

### API Layer
- Use the existing API client wrapper (e.g., `apiClient`, `axios` wrapper, `fetch` wrapper).
- Do **not** scatter raw network calls throughout UI components.
- Centralize endpoint paths and auth header logic in one place.
- Prefer shared API clients from `@mixtape/api/clients/*` over ad-hoc network calls in UI.

### Auth
- Follow existing token storage patterns (SecureStore/Keychain/Keystore, etc.).
- Do not store access tokens in insecure storage.
- Avoid duplicating auth logic across screens; keep it in the auth module/provider.

### UI
- Match existing UI system (e.g., RN core, Tamagui, NativeBase, custom components).
- Create reusable components for repeated patterns.

### Realtime & Messaging
- Socket connectivity is centralized in `src/services/socket/socketService.ts`.
- Messaging events use Livewire-style event names via `src/services/messaging/messagingService.ts`.
- Prefer `src/hooks/useSocket.ts`, `src/hooks/useMessaging.ts`, and `src/hooks/useUnreadCounts.ts` over raw socket usage.

---

## Cross-Project Rules (Mobile ↔ Backend)

- Assume backend APIs are **contracts**. If a backend change is needed:
  1. Describe the mismatch or missing capability.
  2. Propose the backend change.
  3. Wait for explicit approval before editing backend code.
- Prefer backward-compatible API evolution.

---

## Safety Rules (Mobile)

Codex must **never**:

- Delete or rename files/directories without explicit permission.
- Modify environment files or secrets (`.env`, `.env.*`, app signing configs) without explicit approval.
- Make sweeping dependency changes (Expo/RN major upgrades, navigation replacement) without proposing a plan and getting approval.
- Commit or publish builds; never assume release actions.

---

## Workflow Rules

1. Before changes:
   - Summarize plan and list the files likely to change.
2. During changes:
   - Keep edits tight and avoid unrelated cleanup.
3. After changes:
   - List all modified files.
   - Provide diffs or a clear summary of changes.
4. Prefer “analyze first” before refactors.

## App Startup & Env
- `src/config/env.ts` must be imported first in `App.tsx` to map `EXPO_PUBLIC_*` to `NEXT_PUBLIC_*` for shared packages.

## Navigation
- Use React Navigation (native stack + bottom tabs) and keep route param types in `src/navigation/AppNavigator.tsx`.

---

## Standard First Prompt (Mobile Directory)

When starting Codex in this directory, the user may paste:

```text
You are Codex operating inside the Mixtape mobile client directory.

Read and follow this local AGENTS.md as the primary rulebook.
Do not modify any sibling projects unless I explicitly ask.

Before doing anything else:
1) Confirm you read AGENTS.md.
2) Summarize the project structure you see (high level).
3) State what files you would touch for the task I give you.

Do not modify any files yet.
