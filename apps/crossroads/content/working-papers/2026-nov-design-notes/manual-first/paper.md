---
title: Manual first — know a step before you automate it
version: '1.0'
date: '2026-11-01'
summary: A person does a step by hand until they know it well enough to automate it and still own it. Six stages from "write it down" to "prove it from scratch", with a hand-built machine testing the automation and the automation checking the machine.
---

## The principle

A person does a step by hand until they know it well enough to automate it **and still own it**. The owner is the person responsible for that section of code: they can say what each line does, what it changes on the machine, how to tell it worked, and how to undo it.

Automation comes after knowing, not instead of it. Automation that nobody understands isn't owned. It runs until the day it does something unexpected, and then no one can say whether it did what it was meant to.

## Why

- **Ownership survives automation.** A playbook written from steps its owner has done by hand is a record of what they know. One written ahead of that knowledge is a guess that happens to run.
- **The manual run is the specification.** Doing a step by hand, with the runbook open, turns up what the step actually needs: the auto-created cluster, the port clash, the password that mustn't be printed. Those become the automation's checks.
- **Reliability over speed** (`puddlejump/CLAUDE.md`). Automation makes a step fast; knowing it is what makes it reliable. Automation built on a step nobody knows repeats the unknown faster.
- **Agents draft, people run.** An agent can write the commands, the runbook entry and the playbook. The person who owns the machine runs them. An agent never holds the key that changes a server.

## How a step moves from manual to automated

| Stage | Who | What happens |
|---|---|---|
| 1. **Write** | Agent | Writes the step in the runbook: target, expected effect, exact commands, how to check it, how to undo it. |
| 2. **Do it by hand** | Owner | Runs the commands themselves, reads the output, checks the result. The runbook records what actually happened. |
| 3. **Encode** | Agent | Writes the same step as automation (an Ansible task or role), matching what the owner did, not an idealised version. |
| 4. **Prove the match** | Owner | Runs the automation against the machine they set up by hand. It must report **zero changes**: the automation describes the state the owner made, exactly. Any change it wants is a difference to understand before going on. |
| 5. **Own it** | Owner | Signs off the role in the repo's ownership record. From now on the automation is how the step is done, and its owner reviews any change to it. |
| 6. **Prove it from scratch** (later) | Owner | Runs it on a fresh, disposable machine. That proves the automation can build the state, not just recognise it. |

Stage 4 is the tandem the CTO asked for: the hand-built machine tests the automation, and the automation checks the hand-built machine.

The owner decides when they know a step well enough to move on. Some steps take one manual run, some several. A step can go back to manual if its automation surprises its owner.

## What this means for agents

- Agents may run **read-only** checks over SSH as a read-only account, as they already have (hostname, versions, listeners, `git status`), and must say so in the runbook.
- Agents **do not run Ansible** against any server, including in check mode, and do not hold the owner's key or any admin rights. The owner runs every playbook and pastes the output back when the agent needs it.
- Agents never change a server by hand either. Every change is a runbook step the owner runs.

## Where else this applies

The same order holds wherever Mixtape automates something a person was responsible for: deployment, backups, Argus runs, model vetting (Tier 0 by hand before a task-fitness verdict), migrations. When a new automation is proposed, the first question is: **who has done this by hand, and do they own the result?**

## Open questions

1. **Where is ownership recorded?** Adopted for `mixtape-infra` (CTO, 2026-10-28): an `OWNERS` file, one line per role, plus each role's README naming its owner and the date it reached stage 5. The CTO owns every role for now, kept so another person can be swapped in easily: the README holds what the owner knows (the manual steps, checks and undo), so a new owner can repeat stage 2 from it.
2. **Can ownership pass to another person?** Recommendation: yes, by the new person doing stage 2 themselves, on a disposable machine if need be, then taking stage 5. Ownership isn't handed over by documents alone.
3. **Does this bind agents' own automation** (CI checks, scheduled jobs)? Recommendation: yes, with the CTO as owner until someone else takes a section.
