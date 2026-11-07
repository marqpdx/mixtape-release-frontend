---
title: Where Your Data Goes — Charter
version: '1.0'
date: '2026-11-05'
summary: Mixtape's promise about what happens to a person's material when AI or an outside service touches it. Local first; the cloud only on your own account, with your approval, filtered and recorded. It says plainly where today's system still falls short.
names: '*Switchboard* is Mixtape''s governed door to its tools; *Argus* is its audit practice; *ST-3* and the like are steps in the Service Trust plan.'
status: ratified
---

A short charter, ratified, with teeth:

- AI work runs on Mixtape's own servers by default. When a task needs a frontier model, it runs on **your own** cloud account, with your approval, through a privacy filter, and leaves a record. A "local only" setting always wins.
- It names every outside service and what each receives.
- It lists what never happens: no server key calling a model, no borrowed accounts, no silent fallback.
- Section 6 is a table of where the system falls short today, each gap with its fix.

What makes it more than a policy is section 7: a check runs on every code change and fails if code adds an unapproved route, and audits test the running system against each promise. The code summary in this packet shows most of section 6 being closed.
