---
title: Almanac
subsystem: almanac
area: overview
excerpt: The Almanac is Mixtape's event and calendar system. Create events, track RSVPs, and manage schedules within your groups.
routes:
  - /almanac
  - /almanac/*
workAreas:
  - AlmanacWorkArea
tags:
  - almanac
  - events
  - calendar
---

# Almanac

The Almanac is Mixtape's event and calendar system. It lets groups create events, track who's coming, and manage schedules. Members can RSVP to events, follow events they're interested in, and view who else is attending.

---

## Key concepts

**Event** — A scheduled happening within a group. Events have a title, date/time, and can be published (visible to members) or unpublished (draft state).

**Occurrence** — A single instance of an event. For recurring events, each date is a separate occurrence. For one-time events, there is one occurrence.

**RSVP** — Your formal response to an event or occurrence. You can RSVP or cancel your RSVP at any time.

**Event Follow** — A lighter-weight subscription to an event: you're notified but not formally RSVP'd.

**Publish / Unpublish** — Events start unpublished. An admin publishes an event to make it visible and RSVP-able for members.

---

## What you can do

### RSVP to an event

- The event must be published and you must be a member of the group.
- Navigate to the event in your group.
- Click RSVP. Your attendance is recorded.
- You can cancel your RSVP at any time.

### Follow an event

- You must be a member of the group.
- Click Follow on an event to track it without a formal RSVP.

### View event attendees

- Open any published event.
- A list of members who have RSVP'd is available on the event detail page.

### View your group's calendar

- Navigate to your group's Almanac section.
- Events are shown grouped by date. Occurrences are listed for recurring events.

---

## Current limitations

- **Site-wide event access:** The site-wide event detail endpoint does not currently enforce group membership — any authenticated user can read or modify any event by UUID. Event UUIDs should not be shared publicly until this is resolved.

---

## Related features

- **Groups** — Almanac events are scoped to groups. Group membership determines event access.
- **Activity** — Event RSVPs and follows may generate activity feed entries.
