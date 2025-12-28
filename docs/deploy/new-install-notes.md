# Mixtape Installation Guide

This guide covers deploying your own Mixtape instance.

## Architecture Overview

Mixtape is structured as a monorepo with the following apps:

```
apps/
├── mixtape/      # Core Mixtape (public pages + workspace)
├── crossroads/   # Crossroads-specific public site (reference implementation)
└── mobile/       # React Native mobile app (future)

packages/
├── core/         # Shared types
├── api/          # API clients and hooks
└── auth/         # Authentication utilities
```

## Deployment Options for New Mixtape Users

You have two options when deploying your own Mixtape instance:

### Option 1: Use Mixtape As-Is (Recommended for Getting Started)

Deploy the complete Mixtape app with minimal public pages and full workspace functionality.

```bash
cd apps/mixtape
yarn install
yarn build
```

**What you get:**
- Minimal public pages (home, about, contact) at `/`
- Full workspace features at `/dashboard`, `/groups/[slug]`, `/admin`
- Authentication pages at `/login`, `/signup`
- Ready to deploy to your domain

**Deployment:**
- Deploy to `your-domain.com`
- Everything runs at the root level
- Single Next.js app, simple deployment

### Option 2: Custom Public Site + Mixtape Workspace

Build your own custom public site while using Mixtape for the workspace.

```bash
# Copy workspace routes to your custom app
cp -r apps/mixtape/app/(authenticated) your-site/app/
cp -r apps/mixtape/app/(auth) your-site/app/
cp -r apps/mixtape/components your-site/

# Build your own public pages in your-site/app/(root)/
```

**What you get:**
- Full control over public-facing pages
- Mixtape workspace functionality at `/dashboard`, `/groups`, etc.
- Customize branding, content, and user experience

**Deployment with nginx (recommended):**

```nginx
# nginx.conf
server {
  listen 80;
  server_name your-domain.com;

  # Your public site
  location / {
    proxy_pass http://localhost:3010;
  }

  # Mixtape workspace (optional: serve at /app)
  location /app/ {
    proxy_pass http://localhost:3011;
  }
}
```

**Ports:**
- `3010` - Public site
- `3011` - Mixtape workspace (if separate)

**Configure base path for workspace (if using `/app` prefix):**

```js
// apps/mixtape/next.config.js
module.exports = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
}
```

```env
# .env.local
NEXT_PUBLIC_BASE_PATH=/app
```

## CORS Configuration

When deploying public site and workspace under the same domain (e.g., `your-domain.com` and `your-domain.com/app`), CORS is automatically handled since they share the same origin.

If deploying to separate domains, configure your Django backend `CORS_ALLOWED_ORIGINS`:

```python
# Django settings
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "https://app.your-domain.com",
]
```

## Next Steps

1. Configure your environment variables (see `apps/mixtape/.env.example`)
2. Set up your Django backend connection
3. Deploy to your hosting provider (Vercel, Docker, etc.)
4. Customize as needed

For more details, see:
- [Monorepo Structure](../architecture/monorepo.md)
- [Backend Configuration](../backend/setup.md)
- [Deployment Guide](./production.md)
