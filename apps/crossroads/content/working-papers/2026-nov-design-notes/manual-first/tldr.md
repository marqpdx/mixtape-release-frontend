---
title: Manual first — know a step before you automate it
version: '1.0'
date: '2026-11-01'
summary: A person does a step by hand until they know it well enough to automate it and still own it. Six stages from "write it down" to "prove it from scratch", with a hand-built machine testing the automation and the automation checking the machine.
---

Automation that nobody understands isn't owned: it runs until the day it surprises everyone. So a step moves from manual to automated in stages:

1. an agent writes the runbook step;
2. the owner does it by hand;
3. the agent encodes exactly what the owner did;
4. the automation, run against the hand-built machine, must report **zero changes**;
5. the owner signs off;
6. later, it's proved from scratch on a fresh machine.

Agents draft; people run. An agent never holds the key that changes a server. The same order applies wherever something a person was responsible for gets automated: deploys, backups, audits, model vetting.

**Names:** *Ansible* sets up servers from code; *runbook* is the written procedure; *Tier 0* is the first sanity check in model vetting.
