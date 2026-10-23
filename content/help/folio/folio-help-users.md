---
title: Folio
subsystem: folio
area: overview
excerpt: Start a new Folio from a raw, unstructured thought, and watch what you wrote get preserved verbatim before anything is interpreted.
routes:
  - /folio/new
  - /folio/inception/*
workAreas: []
tags:
  - folio
  - inception
  - materiality
---

# Folio

Folio is where a new body of work begins — before it has a title, a shape, or a plan. You start by writing down what's on your mind in plain language; Mixtape keeps that exactly as written, then works out what's material in it.

## What you can do here

- Start a new Folio by describing what you're working on, in your own words
- See your raw entry preserved exactly as you wrote it, with nothing rewritten or summarized on your behalf
- (Early builds) Inspect an early, deterministic pass over your entry via a debug view, before any model-based interpretation is added

## Key concepts

**Inception** — The raw, unedited text you enter to start a Folio. Nothing about it is corrected, reformatted, or reinterpreted before it's saved.

**Materiality** — What Mixtape works out is worth acting on from your inception text. This is judged, not assumed — early builds intentionally show you only the preserved raw text and do not yet render that judgment.

## How to start a Folio

1. Open **Folio → New** and answer "What are you working on?" in your own words — a sentence or a few paragraphs both work.
2. Select **Begin**. Mixtape saves your entry and takes you to its inception page.
3. On the inception page, confirm your text was preserved exactly as written. This is the current build's guarantee — everything downstream (identifying what's material, shaping a Folio around it) builds on this being trustworthy first.

## What this build does not do yet

This is an early, intentionally minimal build. It does not yet show you a shaped interpretation of your inception, suggest structure, or create Folio content on your behalf — it only proves your raw entry is captured and preserved. Treat anything beyond the preserved text on this page as not yet available, not as missing or broken.

## Mobile notes and tending

The mobile **Folio** tab saves text and voice notes into a Folio. Voice notes
transcribe after upload; you can review the notes in the web **Folio Workbench**.
Saving and transcription are separate from tending, the background reading that
suggests a Shape and mentions.

**Automatic tending is paused for now.** Capture and transcription continue, but
a completed transcript has not necessarily been interpreted. **Unplaced** means
a note's role remains open. **Tending failed** means a requested reading did not
finish; your saved note and recording remain available, and you can still choose
a Shape yourself. The Workbench's Provenance shows the reported error.
