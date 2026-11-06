---
title: Where Your Data Goes — Charter
version: '1.0'
date: '2026-11-05'
summary: Mixtape's promise about what happens to a person's material when AI or an outside service touches it. Local first; the cloud only on your own account, with your approval, filtered and recorded. It says plainly where today's system still falls short.
---

## 1. Our promise

Mixtape will never sell a service under a false premise. What follows is what happens to your writing, your recordings, your documents and your questions when Mixtape's AI or an outside service touches them. We hold ourselves to it, a check runs on every change to our code, and an audit compares the running system against it before every milestone.

## 2. What stays on Mixtape's own servers

- **By default, AI work runs on our own servers, on local models.** That covers summaries, synopses, tending notes, reading scanned pages (OCR), and the drafting and refining tools. Where a local model can't yet do a task well enough, it runs on your own cloud account with your approval, as a separate step we measure and move local as soon as the evidence allows. A "local only" setting is never overridden.
- **Transcription of your voice runs on our servers.**
- **Search over your material runs on our servers.** The index that finds things for you is built and searched here.
- **Mixtape never trains a model on your content.** When a task runs on your own cloud account (section 3), that provider's terms for your account apply, including its own training setting. We will show you where to check it.

## 3. When something may go to a cloud model

Some tasks need a frontier model. When one does, all five of these hold:

1. **On your own account.** It runs under your own connected Claude (or Codex) account, never a shared Mixtape account and never someone else's.
2. **With your approval.** You see what would leave and approve it before it goes. Approving one thing does not approve the next.
3. **Through the filter.** Before anything leaves, a privacy filter removes or masks what your settings say must not go.
4. **Recorded.** Every cloud call leaves a record you can see: what was asked, under whose approval, on which account, and what came back.
5. **Never against a "local only" setting.** If you, or a group you work in, choose local only, nothing goes to the cloud, and no other setting can override that. The strictest setting that applies always wins.

## 4. Outside services that are not AI

A few features talk to services outside Mixtape. Each one is named here, along with what it receives and why:

| Service | What it receives | Why |
|---|---|---|
| Expo (push notifications) | A notification's title and text, and your device's push token | To reach your phone |
| DiceBear | A random seed, no personal content | To draw avatar images |
| Project Gutenberg | Nothing about you; we fetch public-domain texts | Book imports |
| Dice (job search) | Your search terms | Opportunity search, when you use it |
| Google (Gmail, read-only) | Your sign-in consent; we read the mail you allow | Sourcework, only if you connect it |
| Wikipedia | Research questions | Research lookups, when you use them |
| Semantic Scholar and named web pages | Research questions and page addresses | Daedalus research, when it is wired in |

Lookups like these will get the same "local only" switch as cloud models (Service Trust ST-8).

## 5. What never happens

- No Mixtape server key calls a cloud model directly. Any future API key works only behind the same approval and record as everything else.
- No borrowed account: your work never runs on another person's or a group's AI account, or on Mixtape's own login.
- No silent fallback: if your account is not connected or has expired, the task stops and says so. It does not quietly use another route.
- No AI session on our servers can run commands, read our code or reach other tools beyond the few its task needs. Most get none.
- No saved AI session transcripts on our servers beyond what the record needs.

## 6. Where we are today

This charter states the destination. As of 2026-10-27 the system falls short in these places, each with its fix in the Service Trust plan:

| Promise | Today | Fix |
|---|---|---|
| No server key calls a model | The key is emptied on the server (2026-10-27). The code paths remain and fail closed. | ST-4 moves them behind Switchboard |
| Your own account; no fallback | LinkedIn copy and Atrium run on the server's own Claude login, because no runtimes are connected yet | ST-3 (the CTO connects first, as user one) |
| Approval and filter for every cloud call | Approval is checked for Shuttle, Heddle and LinkedIn copy; the privacy filter is not built | ST-4, ST-5 |
| Local only holds | The setting is stored but not yet enforced | ST-6 |
| A record for every call | Every governed call through Switchboard is recorded; some direct local calls are not | ST-7 |
| Outside lookups switchable | No switch yet | ST-8 |
| AI sessions limited to what they need | Done for Claude Code (2026-10-27): no tools unless named, an empty working directory, no saved sessions | ST-2 ✅ |

No group uses Mixtape yet: only the CTO and a few private alpha users. Groups are not invited in until this table is clear and an audit run is clean.

## 7. How this is kept true

- **On every change.** A check in core (`tools/check_data_routes.py`, run in CI) fails when code adds a cloud SDK, launches an AI command-line tool outside the shared runners, starts an AI session without naming its tools, or names an outside host that isn't listed. Its allowlist (`tools/data-routes.toml`) names each approved place, with its route and reason.
- **Before every milestone.** Argus block `data-routes-01` re-runs the Service Map's inventory against the code and the server, and records any drift from this charter.
- **From time to time, adversarially.** Argus block `charter-pressure-01` tries to break each promise across all of Mixtape, looking for routes nobody has listed yet.
- **In the open.** The Service Map records how each call travels today, including the routes taken to move things forward.
