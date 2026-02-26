# Grist Mill (Member) Frontend Test Plan

Scope: Validate member access to Grist Mill from the dashboard.

Target UI:
- `apps/mixtape/src/components/dashboard/member/memberConfig.ts`
- `apps/mixtape/src/components/dashboard/member/MemberWorkArea.tsx`
- `apps/mixtape/src/components/gristmill/MillWorkArea.tsx`

Assumptions:
- User is authenticated.
- Member dashboard loads.

---

## A) Navigation

### A1. Menu item exists
Steps:
1) Go to `/app/dashboard`.
2) Open the Writing section in the left nav.
Expected:
- `Grist Mill` appears as a menu item.

### A2. Work area loads
Steps:
1) Click `Grist Mill`.
Expected:
- Work area loads without error.
- No “No Sponsor Context” alert.

---

## B) Sponsor Context

### B1. Member sponsor is wired
Steps:
1) Load Grist Mill as a member.
Expected:
- Mill renders with member sponsor context.
- No group-specific UI is shown (unless generic).

---

## Deliverables
- Screenshot of the Writing menu showing “Grist Mill.”
- Screenshot of the Grist Mill panel loaded as a member.
