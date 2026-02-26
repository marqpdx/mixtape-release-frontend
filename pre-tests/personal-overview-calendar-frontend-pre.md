# Personal Overview + Calendar Frontend Test Plan

Scope: Validate that Personal Overview renders and includes the new calendar card.

Target UI:
- `apps/mixtape/src/components/dashboard/sections/PersonalOverview.tsx`
- `apps/mixtape/src/components/dashboard/member/MemberWorkArea.tsx`

Assumptions:
- User is authenticated.
- Dashboard loads.

---

## A) Personal Overview renders

### A1. Overview is visible
Steps:
1) Go to `/app/dashboard`.
2) Select Personal → Overview.
Expected:
- Overview content renders (not blank).

---

## B) My Calendar card

### B1. Calendar card appears
Steps:
1) In Overview, locate “My Calendar.”
Expected:
- Card shows heading “My Calendar”.
- Body text mentions personal events + Crossroads gatherings.
- “Open calendar” button is present.

---

## Deliverables
- Screenshot showing the Personal Overview page with the “My Calendar” card.
