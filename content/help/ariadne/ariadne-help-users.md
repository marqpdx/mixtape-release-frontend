---
title: Ariadne
subsystem: ariadne
area: overview
excerpt: Ariadne is a superuser-only curation workbench over the Puddlejump canon corpus -- discover candidate concepts, assemble evidence packets, and review them into Concepts.
routes:
  - /ariadne
  - /ariadne/*
tags:
  - ariadne
  - puddlejump
  - superuser
---

# Ariadne

Ariadne is a superuser-only tool for discovering and curating ideas across the Puddlejump canon corpus -- surfacing related material, evidence, and relationships without requiring anyone to reread the whole corpus by hand. It's gated to superusers both on the page and by every endpoint it calls.

**Current state:** a working curation workbench, in three parts — a candidate rail (discovered phrases from a run, or results from searching the corpus), an evidence workspace (assembling packets of supporting material for a candidate), and a crafting rail (reviewing a packet and deciding its disposition: accept, decline, defer, or drop). Accepting a candidate promotes its phrase straight to a Concept — that's as far as curation goes today; interpreting what a Concept means, and curating assertions about it, come in a later phase.

Search works two ways: a corpus search for a term, or a saved search you can re-run later as a Named Lens. Both use hybrid search (combining exact and meaning-based matching) over the corpus.

Treat anything beyond discovering candidates, assembling evidence, and accept/decline/defer/drop review as not yet available — model interpretation and assertion curation are still being built.
