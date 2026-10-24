# Folio slug: CTO review before production migration

Decision E, 2026-10-23. Prepared and tested locally; **not deployed**.

Review Core `app/folio/migrations/0005_folio_slug.py` before deploying the Core
model/serializer change. Do not restart Core with the new model against the old
schema; apply the reviewed migration as part of the coordinated deployment.

The migration has three operations, in one migration transaction:

1. Add a nullable `slug` column without an intermediate lookup index.
2. Backfill existing Folios in created-at/id order from their titles. Blank or
   non-ASCII-only titles use `folio`; duplicates receive an identity suffix.
   UUID-shaped slugs are prefixed so they cannot shadow legacy UUID bookmarks.
   Only the new column is written: titles, UUIDs, ownership and notes stay intact.
3. Make slug non-null and unique, with the final lookup index.

New Folios receive stable slugs on save. Later title edits do not regenerate them.
The serializer exposes slug read-only. The database uniqueness constraint protects
concurrent creation; a duplicate title has an identity-suffixed fallback.
Backfill is intended for the current small Folio population; it builds a set of
used slugs and updates one row at a time. It needs a normal migration window to
avoid old application processes inserting rows during the schema transition.
Reverse migration removes the new slug column; existing source material remains.

Web index and Workbench switching use `/folio/<slug>/notes`. The existing route
segment name remains internal; it resolves against the authenticated writer's
Folio list and passes the UUID into existing API hooks. An old UUID web bookmark
is replaced with its canonical slug URL by the authenticated client. This is a
client navigation redirect, not a public HTTP redirect exposing private titles.
Older API responses without slug still work with UUID links during rollout.

Checks: all 50 Folio tests pass, including an actual migration from the pre-slug
historical schema, duplicate/blank-title backfill, stable title edits, read-only
API output and owner-scoped access. Workbench TypeScript passes. Browser navigation
and production migration still require CTO review/deploy verification.
