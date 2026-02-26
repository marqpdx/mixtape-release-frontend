# My Crossroads v2 — Frontend Pre-Test

**Feature:** Authenticated My Crossroads landing surface (Storyline, Streams, Composer, Voice, Leaf detail, Follow, Beacon)
**Date:** 2026-02-26
**Modules:** `components/crossroads/`, `app/(main)/(authenticated)/`
**Components:** `MyCrossroadsLayout.tsx`, `FeedToggle.tsx`, `Composer.tsx`, `StorylineFeed.tsx`, `StreamsFeed.tsx`, `LeafCard.tsx`, `SeedCard.tsx`, `FollowButton.tsx`, `Beacon.tsx`
**Backend dependencies:** Leaf, Seed, Follow, Streams, FeedbackBeacon APIs (all pre-built)

---

## What was built

### Frontend
- `(authenticated)/layout.tsx` — Auth guard: redirects to `/login?redirect=...` if unauthenticated
- `(authenticated)/members/[username]/page.tsx` — My Crossroads page: wires layout, feeds, composer, follow, beacon
- `(authenticated)/leaf/[id]/page.tsx` — Leaf detail with one-level threaded comments
- `MyCrossroadsLayout.tsx` — 60/40 desktop split, mobile bottom-fixed composer, Full Mode toggle (localStorage)
- `FeedToggle.tsx` — "My Storyline" / "Streams" pill toggle
- `Composer.tsx` — Text input with debounced auto-save (1.5s), quick post to Storyline, voice recording via `useVoiceRecorder`, recent seeds list
- `StorylineFeed.tsx` — Leaf feed from `/api/writing/leaves`
- `StreamsFeed.tsx` — Following feed from `/api/writing/streams`
- `LeafCard.tsx` — Renders text/image/link/voice/reference leaves, links to detail page
- `SeedCard.tsx` — Compact seed card with "Add to Storyline" promote action
- `FollowButton.tsx` — Follow/unfollow toggle using UUID `user_id`
- `Beacon.tsx` — DB-driven feedback beacon (Popover with bug/request/idea form, 30-day dismiss)
- `useVoiceRecorder.ts` — Shared hook: MediaRecorder, MIME detection, mic prewarm, idle shutdown, recording timer

### Backend (pre-existing, no changes in this phase except)
- `PublicMemberSerializer` — added `user_id` field (UUID) for follow wiring

---

## Environment contract

- `E2E_BASE_URL` — app base URL
- `E2E_AUTHOR_EMAIL` / `E2E_AUTHOR_PASSWORD` — authenticated user (owner of their My Crossroads)
- `E2E_OTHER_EMAIL` / `E2E_OTHER_PASSWORD` — second authenticated user (for follow + visitor view testing)
- Seeded data: Author user should have at least 1 text leaf and 1 seed in the system
- Seeded data: `FeedbackBeacon` with `key=my_crossroads_v1`, `is_active=true` (via `python manage.py seed_feedback_beacon --key my_crossroads_v1 --title "My Crossroads feedback" --scope component`)
- Microphone permissions grantable (for voice tests)

---

## Selector strategy

- Feed toggle: `getByRole('button', { name: /my storyline/i })`, `getByRole('button', { name: /streams/i })`
- Composer textarea: `getByPlaceholder(/capture a thought/i)`
- Post button: `getByRole('button', { name: /post to storyline/i })`
- Voice button: `getByRole('button', { name: /voice/i })`
- Full mode toggle: `getByRole('button', { name: /full mode|show composer/i })`
- Follow button: `getByRole('button', { name: /follow/i })`
- Leaf card: scoped by author display name + body text
- Seed card: scoped within "Recent Captures" section
- Add to Storyline: `getByRole('button', { name: /add to storyline/i })`
- Beacon: `getByRole('button', { name: /beacon feedback/i })`
- Comment input: `getByPlaceholder(/add a comment/i)`
- Back button: `getByRole('button', { name: /back/i })`

---

## A) Auth Guard & Routing

### A1. Unauthenticated user redirected to login
Steps:
1) Clear all cookies / log out.
2) Navigate to `/members/someuser`.
Expected:
- Redirected to `/login?redirect=%2Fmembers%2Fsomeuser`.
- My Crossroads page does NOT render.

### A2. Authenticated user sees My Crossroads
Steps:
1) Log in as Author.
2) Navigate to `/members/{author_username}`.
Expected:
- Page loads with navbar, 60/40 layout (desktop), feed toggle, composer.
- No redirect.

### A3. Auth page redirects authenticated users to root
Steps:
1) Log in as Author.
2) Navigate to `/login`.
Expected:
- Redirected to `/` (not `/dashboard`).

---

## B) Layout — Desktop

### B1. 60/40 split visible
Steps:
1) Log in, navigate to own My Crossroads on desktop (>768px).
Expected:
- Left pane ~60% width: feed toggle + feed content.
- Right pane ~40% width: Composer heading + textarea + recent seeds.
- Vertical divider (left border on composer pane) visible.

### B2. Full Mode collapses composer
Steps:
1) On desktop, click the expand icon (top-right of narrative pane).
Expected:
- Composer pane disappears.
- Narrative pane expands to full width.
- Floating pencil button appears at bottom-right.

### B3. Full Mode — reopen composer
Steps:
1) While in Full Mode, click the floating pencil button.
Expected:
- Composer pane reappears (40%).
- Floating pencil button disappears.
- Expand icon returns to top-right.

### B4. Full Mode persists across refresh
Steps:
1) Enable Full Mode.
2) Refresh the page.
Expected:
- Page loads in Full Mode (composer hidden, narrative full-width).
3) Disable Full Mode, refresh again.
Expected:
- Page loads with 60/40 split.

### B5. Visitor view — no composer
Steps:
1) Log in as Other user.
2) Navigate to `/members/{author_username}`.
Expected:
- Narrative pane at full width.
- No composer pane.
- No Full Mode toggle icon.
- Follow button visible next to feed toggle.

---

## C) Layout — Mobile

### C1. Mobile narrative + bottom composer
Steps:
1) Log in, navigate to own My Crossroads on mobile (<768px).
Expected:
- Narrative feed scrollable in main content area.
- Composer fixed at bottom of viewport.
- Composer is scrollable (max 50vh).

### C2. Mobile visitor — no composer
Steps:
1) Log in as Other user, navigate to `/members/{author_username}` on mobile.
Expected:
- Narrative feed fills the screen.
- No bottom composer.

---

## D) Feed Toggle

### D1. Default state is Storyline
Steps:
1) Navigate to own My Crossroads.
Expected:
- "My Storyline" button is active (dark bg).
- "Streams" button is inactive.
- Help text "Everything here is chosen by you." visible below toggle.

### D2. Switch to Streams
Steps:
1) Click "Streams".
Expected:
- Streams button becomes active.
- Feed content switches (either shows followed users' leaves or empty state).
- No page navigation (in-place switch).

### D3. Switch back to Storyline
Steps:
1) Click "My Storyline".
Expected:
- Storyline button active again.
- Own leaves displayed.

---

## E) Storyline Feed

### E1. Leaves displayed
Steps:
1) Navigate to own My Crossroads (with existing leaves).
Expected:
- Leaf cards visible: author avatar, display name, @username, relative timestamp.
- Body text visible.
- Comment count or "Reply" shown in footer.

### E2. Empty storyline
Steps:
1) Navigate to a user with no leaves (or new account).
Expected:
- "Your Storyline is empty" heading.
- "Capture a thought in the Composer, then post it here." subtext.

### E3. Leaf card links to detail
Steps:
1) Click any leaf card.
Expected:
- Navigates to `/leaf/{leaf_id}`.
- Leaf detail page loads.

### E4. Reference leaf display
Steps:
1) If a reference leaf exists: curated badge, caption, blue source card visible.
Expected:
- "curated" badge in header.
- Source type label + source title in blue card below body.

### E5. Voice leaf display
Steps:
1) If a voice leaf exists: microphone icon + "Voice note" label visible.
Expected:
- Purple mic icon with italic "Voice note" text.
- Transcript text (if available) shown below.

### E6. Link leaf display
Steps:
1) If a link leaf exists: link preview card visible.
Expected:
- Link icon + title in bordered card.
- Description below title if available.

---

## F) Streams Feed

### F1. Streams shows followed users' content
Steps:
1) Follow another user who has leaves.
2) Switch to "Streams" tab.
Expected:
- Leaves from followed user appear.
- Cards render identically to Storyline cards.

### F2. Empty streams
Steps:
1) Switch to "Streams" with no follows (or followed users have no leaves).
Expected:
- "Your Streams are quiet" heading.
- "Follow other members to see their Leaves here." subtext.

---

## G) Composer — Text

### G1. Type and auto-save
Steps:
1) Type "Hello world" in composer textarea.
2) Wait 2 seconds (debounce is 1.5s).
Expected:
- "Auto-saved" label appears next to Post button.
- Network: POST `/api/writing/seeds` on first save, then PATCH on subsequent edits.

### G2. Quick post to Storyline
Steps:
1) Type "My first post" in composer.
2) Click "Post to Storyline".
Expected:
- POST `/api/writing/leaves` sent with `body_text` and `kind: text`.
- Textarea clears.
- New leaf appears in Storyline feed (may require brief wait or refetch).

### G3. Empty text cannot post
Steps:
1) Leave textarea empty or spaces-only.
Expected:
- "Post to Storyline" button is disabled.

### G4. Textarea disabled while posting
Steps:
1) Click "Post to Storyline".
Expected:
- Button shows loading spinner.
- Textarea disabled during POST.

---

## H) Composer — Voice Recording

### H1. Start recording
Steps:
1) Click the "Voice" button (mic icon).
Expected:
- Recording starts.
- Mic icon replaced by stop icon (square).
- Timer shows `0:00` and counts up.
- Textarea becomes disabled.

### H2. Stop recording
Steps:
1) While recording, click the stop button.
Expected:
- Recording stops.
- Timer stops.
- Voice button returns to mic icon.
- Network: POST `/api/writing/seeds` with `audio_file` FormData.

### H3. Voice seed appears in recent captures
Steps:
1) Record and stop a voice note.
2) Check "Recent Captures" section below composer.
Expected:
- New seed appears with purple "voice" badge.
- Body text shows "(Voice note)" or transcript once available.

### H4. Mic error handling
Steps:
1) Deny microphone permission in browser.
2) Click "Voice" button.
Expected:
- Error text appears (red, near the voice button).
- No crash, no console errors.

### H5. Post button disabled during recording
Steps:
1) Start recording.
Expected:
- "Post to Storyline" button is disabled.

---

## I) Recent Seeds & Promote

### I1. Recent seeds displayed
Steps:
1) Create several seeds (via typing + auto-save).
Expected:
- "Recent Captures" section shows seed cards.
- Each card: truncated body text (3 lines max), relative timestamp.

### I2. Promote seed to Storyline
Steps:
1) Click "Add to Storyline" on a seed card.
Expected:
- POST to promote endpoint.
- Seed card shows "published" badge (green).
- "Add to Storyline" button disappears for that seed.
- New leaf appears in Storyline feed.

### I3. Voice seed in list
Steps:
1) After recording a voice seed, check the list.
Expected:
- Voice seed shows "(Voice note)" body text.
- Purple "voice" badge visible.
- "Add to Storyline" button available.

### I4. Already-promoted seed is dimmed
Steps:
1) Promote a seed.
Expected:
- Card opacity reduced.
- "published" badge shown.
- No "Add to Storyline" button.

---

## J) Leaf Detail Page

### J1. Navigate and display
Steps:
1) Click a leaf card in the feed.
Expected:
- URL changes to `/leaf/{id}`.
- Full leaf content displayed: author avatar, name, @username, timestamp.
- Body text (or image/link/voice content).
- "Back" button at top.

### J2. Back navigation
Steps:
1) On leaf detail page, click "Back".
Expected:
- Returns to previous page (My Crossroads).

### J3. Comment section visible
Steps:
1) On leaf detail page.
Expected:
- "Comments" heading visible.
- Comment input (if logged in): textarea with send button.
- Existing comments listed below (if any).
- "No comments yet. Be the first to reply." if empty.

### J4. Submit a comment
Steps:
1) Type a comment in the textarea.
2) Click send.
Expected:
- POST `/api/writing/leaves/{id}/comments` sent.
- Comment appears in list.
- Textarea clears.

### J5. Reply to a comment
Steps:
1) Click "Reply" on a top-level comment.
Expected:
- Inline reply textarea appears, indented below the comment.
2) Type reply and click send.
Expected:
- Reply appears nested under parent comment (indented, left border).
- Reply textarea collapses.

### J6. Replies are one-level only
Steps:
1) Observe a reply (child comment).
Expected:
- No "Reply" button on child comments.
- Only top-level comments have "Reply".

### J7. Reference leaf detail
Steps:
1) Navigate to a reference leaf.
Expected:
- "curated" badge in header.
- Caption text.
- Blue source card with type label + title.

### J8. Not found
Steps:
1) Navigate to `/leaf/nonexistent-uuid`.
Expected:
- "Leaf not found." error message.
- No crash.

---

## K) Follow Button

### K1. Follow button visible for other users
Steps:
1) Log in as Other user.
2) Navigate to `/members/{author_username}`.
Expected:
- "Follow" button visible next to feed toggle.
- Button is solid blue with user-plus icon.

### K2. Follow a user
Steps:
1) Click "Follow".
Expected:
- POST `/api/workbench/follows` sent with `user_id` (UUID).
- Button changes to "Following" (outline style, gray, user-check icon).

### K3. Unfollow a user
Steps:
1) Click "Following".
Expected:
- DELETE `/api/workbench/follows/{user_id}` sent.
- Button reverts to "Follow" (solid blue).

### K4. Follow button NOT visible for own page
Steps:
1) Navigate to own My Crossroads.
Expected:
- No follow button anywhere on the page.

### K5. Follow button loading state
Steps:
1) Navigate to another user's page (before follow status loads).
Expected:
- Button shows "..." placeholder while loading.

---

## L) Feedback Beacon

### L1. Beacon visible when active
Steps:
1) Ensure `FeedbackBeacon` with `key=my_crossroads_v1` is active in DB.
2) Navigate to own My Crossroads.
Expected:
- Beacon icon button visible below the feed.

### L2. Beacon popover opens
Steps:
1) Click the beacon icon.
Expected:
- Popover opens with title, body text, feature context.
- Radio group: bug / request / idea (default: idea).
- Textarea for message.
- "Send feedback" button.
- "Hide for 30 days" button.

### L3. Submit feedback
Steps:
1) Select "request", type a message, click "Send feedback".
Expected:
- POST `/api/feedback/items` sent with `beacon_key`, `kind`, `message`, `page_url`.
- "Thanks for the feedback" confirmation shown in popover.

### L4. Dismiss for 30 days
Steps:
1) Click "Hide for 30 days".
Expected:
- Popover closes.
- Beacon icon disappears.
- `localStorage` key `beacon_dismissed_my_crossroads_v1` set.
2) Refresh page.
Expected:
- Beacon still hidden (within 30-day window).

### L5. Beacon hidden when inactive
Steps:
1) Deactivate beacon in DB (`is_active=false`).
2) Navigate to My Crossroads.
Expected:
- No beacon icon rendered.

---

## M) Redirect Cleanup

### M1. No /dashboard references
Steps:
1) Log in and complete auth flow.
Expected:
- Never redirected to `/dashboard`.
- Auth page redirect goes to `/`.

### M2. Login with redirect param
Steps:
1) Unauthenticated, navigate to `/members/someuser`.
2) Redirected to `/login?redirect=...`.
3) Log in.
Expected:
- After login, redirected back to `/members/someuser` (not `/dashboard`).

---

## Deliverables
- Screenshot of 60/40 desktop layout (owner view).
- Screenshot of Full Mode (narrative full-width + floating pencil button).
- Screenshot of mobile layout (bottom composer).
- Screenshot of visitor view (no composer, follow button visible).
- Screenshot of voice recording in progress (stop icon + timer).
- Screenshot of leaf detail with comments + reply thread.
- Screenshot of beacon popover with feedback form.
- Verify no console errors during all scenarios.
- Verify `npx tsc --noEmit` passes.

---

## Run Commands
```bash
# When converted to Playwright
npx playwright test pre-tests/playwright/my-crossroads-v2.spec.ts
```
