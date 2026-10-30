---
title: AI accounts
subsystem: member
area: settings
excerpt: "Connect your own Claude account, so the cloud AI work you approve runs on your account and no one else's."
routes: []
workAreas: []
tags:
  - member
  - settings
  - ai
  - claude
  - privacy
---

# AI accounts

Some tasks in Mixtape can use a cloud AI model. Mixtape never runs them on a shared Mixtape account or on anyone else's. When you approve a task, it runs on **your own** account. **AI accounts** is where you connect it.

Open it from your Dashboard: **Settings** → **AI accounts**.

---

## What connecting means

- **Your account, only for your work.** Cloud tasks you approve run on your connected Claude account. Mixtape doesn't lend it to anyone else, and doesn't use anyone else's for you.
- **Nothing without your approval.** Connecting doesn't send anything anywhere. Each task still asks you first.
- **Most AI work stays on Mixtape's own servers.** Connecting only matters for the few tasks that need a cloud model.
- **Disconnect at any time.** Disconnecting stops anything from running on your account at once.

If your account isn't connected, a task that needs it stops and tells you; it never quietly runs some other way.

---

## Connect your Claude account

1. Go to **Settings** → **AI accounts**.
2. Click **Connect your Claude account**. The status changes to **Signing in**.
3. After a moment, **Open Claude to sign in** appears. Click it; Claude's sign-in page opens in a new tab.
4. Sign in with your own Claude account and approve the request.
5. Come back to Mixtape. The page updates by itself to **Connected**.

The sign-in link is only good for about ten minutes. If it runs out, click **Sign in again**.

---

## What the status means

| Status | Meaning |
|---|---|
| **Not connected** | You haven't connected an account yet |
| **Signing in** | A sign-in is under way; use the link to finish it |
| **Connected** | Ready. Tasks you approve can run on your account |
| **Sign in again** | Your sign-in has expired or you disconnected. Tasks that need it wait until you sign in |
| **Something went wrong** | The last sign-in didn't complete. The message underneath says why; try **Sign in again** |

Mixtape checks your sign-in once a day, so an expired one shows here before a task needs it.

---

## Buttons

- **Check now:** checks your sign-in straight away. It doesn't use your account or send any of your work.
- **Disconnect:** signs Mixtape out of your Claude account. Nothing runs on it until you connect again.

---

## Current limitations

- **Claude only, for now.** Codex comes later.
- **Tasks are moving over one by one.** Tasks that use a cloud model are being moved onto your own account; until one has moved, it doesn't use your account.
- **Small numbers.** During the alpha, a server has room for a few connected accounts. If it's full, you'll see "No room for another AI account right now"; ask an administrator.
- If you see **"AI accounts aren't set up on this server yet"**, an administrator hasn't finished setting the server up. Nothing you can do will fix it from your side.

---

## Related features

- **Your Dashboard:** where Settings lives
