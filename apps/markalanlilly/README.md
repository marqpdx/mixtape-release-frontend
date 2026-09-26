# Mark Alan Lilly personal site

First instance of the reusable Mixtape personal-site frontend.

## Run locally

From the frontend monorepo root:

```bash
yarn dev:markalanlilly
```

The app runs at `http://127.0.0.1:3012` and reads the API base URL from
`NEXT_PUBLIC_ROOT_API_URL`, falling back to `http://127.0.0.1:8010` during
server rendering.

## Site identity

`src/site.config.ts` defines the owner, included group sources, title, and
primary navigation. Components do not contain owner or group identifiers.

The initial instance aggregates:

- owner: `marqpdx`
- groups: `mindful-brilliance`, `wild-stillness`

## Public data

Writing pages use `GET /api/public/sites/writing`. The core API owns source
aggregation, visibility enforcement, deduplication, taxonomy, collections,
archive facets, filtering, and pagination. The frontend only renders that
public contract.
