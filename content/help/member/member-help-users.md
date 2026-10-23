---
title: Your Dashboard
subsystem: member
area: overview
excerpt: "Your Dashboard is your personal workspace on Mixtape — writing, groups, profile, and account settings all in one place."
routes:
  - /dashboard
  - /members/*
  - /member/*/library
workAreas: []
tags:
  - member
  - profile
  - dashboard
  - account
  - personal
---

# Your Dashboard

Your Dashboard is your personal home on Mixtape. From here you reach your writing, your groups, your profile, and your account settings without leaving one place.

---

## What you can do here

- Read your activity feed and see what's happening in your groups
- Work on your writing — drafts, published pieces, and new pieces
- Browse and navigate to your groups
- View and update your member profile
- Adjust your account preferences

---

## Navigating the dashboard

The left side of your dashboard is a navigation panel divided into four sections:

**Home**
- **Start Here** — A snapshot of recent activity, your groups and quick shortcuts; further down, **People in My Sphere** (people you share groups with) and your **Lists**
- **Activity** — A live feed of what's happening across your groups and connections

**Writing**
- **My Writing** — All your published pieces
- **Drafts** — Work in progress; pieces you haven't published yet
- **New Piece** — Start a fresh piece right away

**Connect**
- **My Groups** — All the groups you're a member of
- **Conversations** — Private messages with other members (Livewire)

**Account**
- **Settings** — **General** (dashboard options), **Writing** (writing preferences, shortcuts, spell dictionary) and **Notifications** (a link to your notification preferences)
- **Create Group** — Available to system administrators only

---

## Your profile

Your member profile is the public-facing view of who you are on Mixtape. Other members can see it when they browse your name in a group or view your writing.

Your full profile lives at `/members/[username]`. Open it from the avatar menu in the top bar, or click **Full Profile** from your dashboard profile panel.

### What appears on your profile

- Display name
- Quick intro (a short bio, up to 300 characters)
- Right now (a few words about what you're currently focused on)
- Location
- Voice intro (an audio clip with auto-generated transcript — see below)
- Profile photo and banner image

Skills, work areas, and extended bio are visible on some profile views but are not available for editing in this release. They will be re-enabled in an upcoming update.

---

## Editing your profile

Click **Edit Profile** anywhere you see it — in the group header or in your profile panel on the dashboard. Editing happens in one place, the Dashboard's **Edit Profile**, which has two parts:

- **Details** — the fields below
- **Look & layout** — your profile's theme, font, accent colour and the order and visibility of its sections, with a live preview

### Fields you can edit now

| Field | What it's for |
|-------|--------------|
| Display Name | How your name appears across Mixtape |
| Quick Intro | A short bio shown on your profile and member cards (up to 300 characters, required) |
| Right Now | A line about what you're focused on at the moment |
| Location | City, region, or "Remote" |
| Quick Link | A personal or work URL shown on your member card |
| Voice Intro | A short audio clip that plays on your profile |
| Profile Photo | The image used as your avatar |
| Banner Image | The wide image shown across the top of your profile |

Save your changes with the **Save Changes** button at the bottom. A sticky action bar stays visible as you scroll so you don't lose your place.

### Voice intro

Your voice intro is a short audio recording that plays directly on your profile. When someone views your profile, they can listen to your clip and read an auto-generated transcript.

To add a voice intro:
1. Go to **Edit Profile**
2. Find the **Intro Voice Note** field
3. Click **Upload audio** and select a file (MP3, WAV, or most audio formats — up to 25 MB)
4. The transcript is generated automatically, usually within a minute. It will appear below the player once ready.

You can replace or remove your voice intro at any time from the same field.

---

## Current limitations

- **Skills, Work Areas, and Bio** are displayed on some profile views but cannot be edited yet. These fields will return in a future update.
- **Storyline** and **Writing** tabs on the full profile page are in development and cannot be accessed yet.
- Your file library still lives on its own page (`/member/[username]/library`).

---

## Related features

- **Groups** — Most community activity happens inside your groups
- **Writing** — Published pieces and drafts live in your personal writing area
- **Your Group Member Profile** — A lightweight edit surface for updating your profile from inside a group
