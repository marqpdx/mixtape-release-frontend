# Mixtape Release Frontend

Modern React/Next.js frontend for the Mixtape Release platform.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: Chakra UI v3
- **Language**: TypeScript (strict mode)
- **Package Manager**: Yarn
- **Port**: 3010 (development)

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Yarn

### Installation

```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

The application will be available at `http://localhost:3010`

## Project Structure

```
mixtape-release-frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and API clients
│   └── types/           # TypeScript type definitions
├── docs/                # Documentation
│   ├── 01-business-and-use-cases.md
│   ├── 02-architecture.md
│   ├── 03-data-models.md
│   └── 04-design-decisions.md
└── public/              # Static assets
```

## Code Organization Pattern

We follow a three-layer architecture:

1. **API Layer** (`src/lib/api/`): Axios-based HTTP clients
2. **Hook Layer** (`src/hooks/`): React hooks wrapping API calls
3. **Component Layer**: UI components consuming hooks

Example:
```typescript
// API Layer
export const getUser = (id: number) => axios.get(`/users/${id}`);

// Hook Layer
export const useUser = (id: number) => useQuery(['user', id], () => getUser(id));

// Component Layer
const UserProfile = () => {
  const { data: user } = useUser(1);
  return <div>{user.name}</div>;
};
```

## Scripts

- `yarn dev` - Start development server on port 3010
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Documentation

See the [docs](./docs/) directory for comprehensive documentation including:
- Business requirements and use cases
- Architecture and design decisions
- Data models and API contracts

## Current Status

**Phase**: Pre-authentication setup ✓

The basic Next.js + Chakra UI setup is complete. Next steps:
1. Add authentication (JWT with Django backend)
2. Integrate TanStack Query for data fetching
3. Add state management (Zustand or React Context)
4. Build core features

---

*Last updated: 2025-11-10*
