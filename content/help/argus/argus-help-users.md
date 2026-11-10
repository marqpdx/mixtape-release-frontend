---
title: Argus
subsystem: argus
area: overview
excerpt: Review audit blocks, inspect runs and findings, and start or stop bounded audit series.
routes:
  - /argus
workAreas: []
tags:
  - argus
  - audits
  - findings
---

# Argus

Argus is a superuser workspace for reviewing quality, consistency, and fidelity audits. You must be signed in with a superuser account to use it.

## Review audit status

Open **Audit overview** to see the available audit blocks, their readiness, last recorded runs, and reported finding counts. Choose **View runs and findings** for a block to inspect its run history. Findings can include an issue, recommendation, severity, confidence, and source locations.

Choose **Refresh status** to request current information. Missing findings, unreported coverage, and unavailable counts do not establish that an audit found no issues.

## Start a single run

1. Choose **Start a run**.
2. Select **Single run** and one ready block.
3. Check **I approve this run.**
4. Choose **Run now** and read the response.

If the runner reports that it is not reachable, the page displays that response. Refresh status before trying again.

## Create a bounded series

1. In **Start a run**, select **Bounded series** and one ready block.
2. Enter the cadence as a positive whole number of hours.
3. Choose an end after a number of days or runs. The series must fit within seven days.
4. Enter positive whole numbers for the token, turn, and wall-clock caps.
5. Review the limits, check the approval box, and choose **Create series**.

Creating a series does not confirm that a run has started. Review its reported status in **Run series**.

## Review or stop a series

Open **Run series** to review reported cadence, progress, span, and caps. Choose **Stop series** on an active series and check for the stop acknowledgement. If a refresh fails, displayed values may be stale.

## Current limitations

- Each request selects one block. Multi-block series, open-ended series, and exact end times are not available here yet.
- Run controls are unavailable when the block registry cannot load. Blocks that are not ready cannot be selected.
- Daily token ceiling and usage, coverage gaps, and some finding counts may not be reported yet.
