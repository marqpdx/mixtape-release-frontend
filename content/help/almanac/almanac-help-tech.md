---
title: Almanac — Technical Reference
subsystem: almanac
area: overview-tech
excerpt: Technical reference for Almanac administrators and developers. Covers event creation, occurrence models, RSVP management, and admin controls.
routes:
  - /almanac
  - /almanac/*
workAreas:
  - AlmanacWorkArea
tags:
  - almanac
  - events
  - admin
  - technical
---

# Almanac — Technical Reference

---

## For admins

### Create and manage events

- Admins and group owners can create events for their group.
- Events are created as unpublished drafts. Publish when ready.

### Publish / unpublish events

- Publishing makes an event visible to all group members and enables RSVPs.
- Unpublishing hides the event and disables new RSVPs.

### Sync RSVPs

- Admins can trigger a bulk RSVP sync for an event to reconcile attendance records.

### Bulk RSVP

- Admins can submit RSVPs for multiple members at once via the Bulk RSVP endpoint.

---

## API reference

All endpoints require authentication.

### Group-scoped events

| Method | Route | Description | Permission |
|--------|-------|-------------|------------|
| GET | `/api/groups/{group_slug}/events/` | List published events for a group | Group member |
| POST | `/api/groups/{group_slug}/events/` | Create an event | Group admin/owner |

### Site-wide event endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/almanac/events/` | List all accessible events |
| GET | `/api/almanac/events/{event_id}/` | Event detail (UUID) |
| PUT | `/api/almanac/events/{event_id}/` | Update event |
| DELETE | `/api/almanac/events/{event_id}/` | Delete event |

### Event actions

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/almanac/events/{event_id}/publish/` | Publish event |
| POST | `/api/almanac/events/{event_id}/unpublish/` | Unpublish event |
| POST | `/api/almanac/events/{event_id}/rsvp/` | RSVP to event |
| POST | `/api/almanac/events/{event_id}/follow/` | Follow event |
| POST | `/api/almanac/events/{event_id}/sync-rsvps/` | Sync RSVP records (admin) |
| POST | `/api/almanac/events/{event_id}/bulk-rsvp/` | Bulk RSVP (admin) |

### Attendees

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/almanac/events/{event_id}/attendees/` | List RSVPs |

### Occurrences

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/almanac/occurrences/{occurrence_id}/` | Occurrence detail |
| POST | `/api/almanac/occurrences/{occurrence_id}/rsvp/` | RSVP to occurrence |
| POST | `/api/almanac/occurrences/{occurrence_id}/cancel-rsvp/` | Cancel occurrence RSVP |

All event and occurrence IDs are UUIDs.

---

## Known gotchas

- **Site-wide endpoint does not enforce group membership (S2 — open):** `GET /api/almanac/events/{event_id}/` allows any authenticated user to read or modify any event by UUID. Do not expose event UUIDs publicly until this is resolved.
- **Occurrences use UUIDs:** Occurrence IDs in URL patterns are UUIDs, not integers.
- **No canon spec doc:** There is no standalone canonical almanac spec. The LIBRARY history file (`LIBRARY-almanac.md`) is the most complete reference.

---

## Related features

- **Groups** — Events are scoped to groups. Group membership determines access.
- **Activity** — Event RSVPs and follows may generate activity feed entries.
- **Stackroom** — Calendar data may be ingested into Stackroom for knowledge extraction in future phases.
