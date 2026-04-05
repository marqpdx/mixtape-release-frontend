# Help System Frontend Pre-Test Plan

Scope: Validate the new authenticated Mixtape help runtime, Help Hub, and contextual help integrations.

Target UI:
- `apps/mixtape/src/components/help/HelpProvider.tsx`
- `apps/mixtape/src/components/help/HelpDrawer.tsx`
- `apps/mixtape/src/components/help/HelpButton.tsx`
- `apps/mixtape/src/components/help/HelpTip.tsx`
- `apps/mixtape/src/app/(authenticated)/help/page.tsx`
- `apps/mixtape/src/components/writing/draft-room/DraftRoomWorkArea.tsx`

Assumptions:
- User is authenticated.
- Admin / superuser credentials are available so the Draft Room menu item is visible.
- Help manifest generation has run as part of app startup or build.

---

## A) Global Help Entry

### A1. Floating Help button is visible in authenticated Mixtape
Steps:
1. Log into Mixtape.
2. Go to `/app/dashboard`.
Expected:
- A floating `Help` button is visible near the lower-right corner.

### A2. Help drawer opens from the floating button
Steps:
1. Click the floating `Help` button.
Expected:
- A drawer opens.
- The drawer header includes `Help`.
- The drawer shows either a context-specific article or the fallback browse state.

---

## B) Help Hub

### B1. Help Hub index loads
Steps:
1. Go to `/app/help`.
Expected:
- The page loads without error.
- A search field with placeholder `Search help docs...` is visible.
- At least one help article card is visible.

### B2. Writing help appears in the Help Hub
Steps:
1. Go to `/app/help`.
2. Search for `writing`.
Expected:
- A card titled `Writing` appears.
- The excerpt references seeds, drafts, or publishing.

### B3. Writing help article loads
Steps:
1. Open the `Writing` article from the Help Hub.
Expected:
- The article page loads.
- `Writing` is shown as the main heading.
- Sections such as `Key concepts`, `How to write and save a draft`, or `Current limitations` are visible.

---

## C) Contextual Help In Draft Room

### C1. Draft Room shows an inline help tip
Steps:
1. Go to `/app/dashboard`.
2. Open `Writing`.
3. Click `Draft Room`.
Expected:
- The Draft Room work area loads.
- An inline `?` help tip is visible near a `Draft Room` header.

### C2. Draft Room floating Help resolves to Writing help
Steps:
1. While on Draft Room, click the floating `Help` button.
Expected:
- The drawer opens to the `Writing` article rather than only the fallback browse state.
- The drawer body includes writing-specific text about drafts, seeds, publishing, or stream commands.

### C3. Draft Room inline help tip opens a preview
Steps:
1. While on Draft Room, click the inline `?` help tip.
Expected:
- A small popover opens.
- The popover shows the `Writing` article title.
- A `Read more` action is visible.

---

## Deliverables
- Screenshot of `/app/help` with the `Writing` card visible.
- Screenshot of Draft Room with the inline help tip visible.
- Screenshot of the Help drawer opened from Draft Room showing Writing help content.
