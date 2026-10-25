# Folio BaseContent / sponsor-scoped slug: CTO migration review

2026-10-25. Replaces the earlier global-slug proposal (`16400408`). The original
0005 was never deployed; **review this replacement 0005 before deploying**. No
production migration, server restart or deploy is performed by this work.

## Model and ownership

`Folio` now inherits `fundamentals.BaseContent`, overriding only title capacity
(255 characters) and display. It has no custom `save()` or slug generator.
The inherited constraint is on `(sponsor_content_type, sponsor_object_id, slug)`.
Different members/groups can use the same slug; duplicates within one sponsor
get `-2`, `-3`, etc. An untitled Folio keeps the shared `untitled---…` placeholder;
its first usable title replaces it once, recording history. Later title edits
leave the non-placeholder slug unchanged.

The original `Folio.created_by` field is replaced by sponsor, author and
submitted_by. Personal creation assigns all three to the requesting member.
The member API now scopes by sponsor, not author: being a group's contributor
or a different member's author does not grant personal Workbench access.
Group sponsorship is supported by the model; group selection/access UI is later.
FolioNote and FolioInception keep their own created_by provenance unchanged.
Storyboard's Folio ownership references follow the new member-sponsor scope.

The CTO additionally approved fixing the **shared** slug generator to fit the
existing field length while reserving duplicate suffix space. The slug limit
stays **64**, not 255; a 255-character Folio title is preserved in full. This is
in shared BaseData, not a second Folio implementation. Existing non-placeholder
slugs are not rewritten. Both explicit and derived first-title updates now use
model save so slug/history changes reach the database.

## Replacement `folio/0005_folio_slug.py`

Applies from `0004_alter_folionote_confirmed_shape_and_more`:

1. Add inherited BaseContent fields (slug lifecycle, sponsorship, authorship,
   summary/body/publication fields). Sponsor columns are temporarily nullable.
2. If legacy rows exist locally, map their creator to the member sponsor, author
   and submitted_by; initialize placeholders/title slugs with sponsor-scoped
   numeric suffixes. Preserve UUIDs, titles and dependent notes. A legacy row
   without a creator is rejected explicitly rather than assigned another sponsor.
3. Require the sponsor columns, remove the old creator field, align inherited
   UUID metadata, and add BaseContent indexes plus the sponsor-scoped unique
   constraint. There is no platform-wide slug constraint and no 0006 layered fix.

This is a schema transition requiring coordinated deployment after review. A
database that applied the **old** 0005 locally must not assume that replacing the
file changes its applied schema. Tests use a separate fresh database to avoid
altering another agent's local test database. Production has not applied old 0005.
Reversing this migration is not a lossless sponsorship conversion for newly
created group Folios; do not use rollback as a way to reintroduce the old model.

## Workbench and help

The API exposes read-only `slug_history` beside `slug`. The Workbench resolves
UUID, current slug, then history inside the authenticated member's Folio list;
old links are replaced with the current canonical slug URL. Current identifiers
win over historical entries, and conflicting histories are not guessed between.
This is authenticated client navigation, not a public title-revealing redirect.
Workbench help explains temporary links, the first-title transition and stable
later links. No shared API barrel or unrelated client folder is changed.

## Verification and deployment gate

The replacement migration is exercised from the historical 0004 schema in an
isolated local test database. Tests cover member/group scope, numeric duplicate
suffixes, the database constraint, initial sponsor/authorship mapping, title and
UUID preservation, placeholder promotion/history, full-length titles, personal
access boundaries and Storyboard integration. Separate shared-generator tests
cover field limits and suffix growth. Offline client tests cover UUID/current/
history lookup, scope isolation and ambiguous-history refusal.

All 70 Folio, Storyboard API and shared slug-length tests pass in the isolated
database. Offline route checks and source-only web TypeScript also pass.
Commits are in the accompanying agent handoff. Source-only
web TypeScript checking excludes generated Next route files; the normal project
check currently encounters a stale generated library-page route from unrelated
work. No generated files were edited to mask that issue. Device/browser and
production checks remain after review/deployment.
