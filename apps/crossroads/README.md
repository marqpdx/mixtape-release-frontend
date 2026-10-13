# Crossroads Place public site

The public web frontend for **Crossroads Place** (`crossroads.place`), the
reference community that runs on Mixtape.

## Naming

- **Mixtape** is the whole ecology: Crossroads, Catalyst, Tapestry, Livewire,
  Stackroom, Inkwell and the services around them.
- **Crossroads** is Mixtape's people-and-groups layer: identity, membership,
  groups, roles, relationships and shared contexts. It puts collaboration
  first, not social.
- **Crossroads Place** is the reference deployment and community at
  `crossroads.place`. This app is its public face.

In code, `crossroads` usually means Crossroads Place: the package name
(`@crossroads/app`), the domain, the default Group slug
(`MIXTAPE_DEFAULT_GROUP_SLUG`) and Threadworks' instance-wide visibility scope.
These are deployment facts and are left as they are.

Settled 2026-10-13. Source: `puddlejump/reference/glossary/hand-touch/crossroads.md`.

## Run locally

From the frontend monorepo root:

```bash
yarn dev:crossroads
```

The app runs at `http://127.0.0.1:3010`. It reads the API base URL from
`NEXT_PUBLIC_ROOT_API_URL`, and the authenticated Mixtape app's URL from
`NEXT_PUBLIC_APP_URL` (used for login redirects from Group subdomains).

## What it serves

Route groups under `src/app/(main)/`:

| Group | What it holds |
|-------|---------------|
| `(site)` | Public orientation and product pages: products, Catalyst, Commons, get-started, subscription, contact, privacy, accessibility; tenant pages at `[slug]` |
| `(group-landing)` | Group public presence pages at `/groups/[slug]` (`group-public-landing-adr`) |
| `(content)` | About and membership copy |
| `(member)` | Public member and group profiles |
| `(authenticated)` | Signed-in views served from this app (Commons, leaf, members, mindmap, feedback) |
| `(root)` | Welcome |

## Group subdomains

`src/middleware.ts` rewrites `{slug}.go.crossroads.place` to
`/groups/{slug}`. The suffix comes from `TENANT_SUFFIX` and defaults to
`.go.crossroads.place`. On these pages the Group's identity leads, and
Crossroads is only a quiet "Powered by" attribution (`group-public-landing-adr`
Decision 11).

## See also

- `TEMPLATE-RUNBOOK.md`: authoring a Crossroads Page layout template.
- `docs/levels.md`: participation UI patterns (Group Participant, Member,
  Maker).
