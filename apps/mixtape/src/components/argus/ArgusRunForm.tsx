"use client";

import { useState } from "react";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import type { ArgusSnapshot, ArgusStartRequest } from "@mixtape/api/clients/argus/types";
import { buildRunRequest, initialRunDraft, type RunDraft } from "./runRequest";

interface Props {
  snapshot: ArgusSnapshot;
  busy: boolean;
  onStart: (request: ArgusStartRequest) => Promise<void>;
}

export default function ArgusRunForm({ snapshot, busy, onStart }: Props) {
  const [draft, setDraft] = useState<RunDraft>(initialRunDraft);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [cadenceUnit, setCadenceUnit] = useState<"hours" | "minutes">("hours");
  const update = <K extends keyof RunDraft>(key: K, value: RunDraft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setConfirmed(false);
    setError(null);
  };
  const ready = snapshot.available && snapshot.manual_ready && (draft.mode === "single" || snapshot.scheduling_ready);
  const reason = !snapshot.available ? snapshot.unavailable_reason : !snapshot.manual_ready ? snapshot.manual_reason : snapshot.scheduling_reason;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || busy || !confirmed) return;
    setError(null);
    try {
      await onStart(buildRunRequest(draft));
      setConfirmed(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start. Check the run status before retrying.");
    }
  };

  return (
    <Box as="form" className="arun-form" onSubmit={submit} maxW="760px">
      <Stack className="arun-fields" gap={5}>
        <Heading size="lg">Start a run</Heading>
        <Text color="theme.textSecondary">Choose a block and limits for each turn. Runs use your own builder account on Cass.</Text>
        <Field.Root>
          <Field.Label htmlFor="argus-mode">Run mode</Field.Label>
          <select id="argus-mode" value={draft.mode} disabled={busy} onChange={(event) => {
            update("mode", event.target.value as RunDraft["mode"]);
            if (event.target.value === "single") update("blockIds", draft.blockIds.slice(0, 1));
          }}>
            <option value="single">Single run</option>
            <option value="bounded">Bounded series</option>
            <option value="open_ended">Open-ended series — ask each time</option>
          </select>
        </Field.Root>
        <Box as="fieldset" className="arun-blocks" borderWidth="1px" borderColor="theme.border" p={4} borderRadius="md">
          <legend>Blocks</legend>
          {!snapshot.blocks.length && <Text color="theme.textSecondary">The block registry is not available yet. The first planned block is help-fidelity-01.</Text>}
          <Stack className="arun-block-options" gap={2}>
            {snapshot.blocks.map((block) => <label key={block.id}>
              <input type={draft.mode === "single" ? "radio" : "checkbox"} name="argus-block"
                value={block.id} disabled={busy || block.state !== "ready"} checked={draft.blockIds.includes(block.id)}
                onChange={(event) => update("blockIds", draft.mode === "single" ? [block.id] : event.target.checked
                  ? [...draft.blockIds, block.id] : draft.blockIds.filter((id) => id !== block.id))} />
              {" "}{block.name}{block.state !== "ready" ? ` (${block.state})` : ""}
            </label>)}
          </Stack>
        </Box>
        {draft.mode !== "single" && <Stack className="arun-series-fields" gap={4}>
          <Field.Root>
            <Field.Label htmlFor="argus-cadence">Run every</Field.Label>
            <Stack className="arun-cadence" direction="row" gap={3}>
              <Input id="argus-cadence" type="number" min={1} step={1} required
                value={cadenceUnit === "minutes" || !draft.cadenceMinutes ? draft.cadenceMinutes : Number(draft.cadenceMinutes) / 60}
                disabled={busy} onChange={(event) => update("cadenceMinutes", !event.target.value || cadenceUnit === "minutes"
                  ? event.target.value : String(Number(event.target.value) * 60))} />
              <select aria-label="Cadence unit" value={cadenceUnit} disabled={busy} onChange={(event) => {
                setCadenceUnit(event.target.value as "hours" | "minutes");
                setConfirmed(false);
              }}><option value="hours">hours</option><option value="minutes">minutes</option></select>
            </Stack>
          </Field.Root>
          {draft.mode === "bounded" ? <>
            <Field.Root>
              <Field.Label htmlFor="argus-bound">Series ends</Field.Label>
              <select id="argus-bound" value={draft.bound} disabled={busy} onChange={(event) => update("bound", event.target.value as RunDraft["bound"])}>
                <option value="days">After a number of days</option><option value="count">After a number of runs</option><option value="end">At a date and time</option>
              </select>
            </Field.Root>
            <Field.Root>
              <Field.Label htmlFor="argus-span">{draft.bound === "count" ? "Number of runs" : draft.bound === "days" ? "Number of days" : "End time (your local time)"}</Field.Label>
              {draft.bound === "days"
                ? <Input id="argus-span" type="number" min={1} max={7} step={1} required disabled={busy} value={draft.days} onChange={(event) => update("days", event.target.value)} />
                : draft.bound === "count"
                ? <Input id="argus-span" type="number" min={1} step={1} required disabled={busy} value={draft.count} onChange={(event) => update("count", event.target.value)} />
                : <Input id="argus-span" type="datetime-local" required disabled={busy} value={draft.end} onChange={(event) => update("end", event.target.value)} />}
              <Field.HelperText>A bounded series runs on its own for at most seven days, within the agreed limits.</Field.HelperText>
            </Field.Root>
          </> : <Text>Every occurrence needs your approval. Leaving this page open does not approve another run.</Text>}
        </Stack>}
        <Stack className="arun-caps" direction={{ base: "column", md: "row" }} gap={4}>
          {([
            ["tokens", "Token cap per turn"], ["turns", "Turn cap"], ["wallSeconds", "Wall-clock cap (seconds)"],
          ] as const).map(([key, label]) => <Field.Root key={key}>
            <Field.Label htmlFor={`argus-${key}`}>{label}</Field.Label>
            <Input id={`argus-${key}`} type="number" min={1} step={1} required disabled={busy}
              value={draft[key]} onChange={(event) => update(key, event.target.value)} />
          </Field.Root>)}
        </Stack>
        <Text color="theme.textSecondary" fontSize="sm">One run at a time on Cass. A daily token ceiling applies across all series. You can stop a series at any time.</Text>
        <label><input type="checkbox" checked={confirmed} disabled={busy || !ready}
          onChange={(event) => setConfirmed(event.target.checked)} />{" "}
          {draft.mode === "single" ? "I approve this run with these limits." : draft.mode === "bounded"
            ? "I approve this bounded series running on its own within these limits."
            : "Create this series; ask me before every run."}
        </label>
        {!ready && <Text role="status">{reason || "Runs are not available yet."}</Text>}
        {error && <Text role="alert" color="red.600">{error}</Text>}
        <Button type="submit" alignSelf="start" disabled={!ready || busy || !confirmed || !draft.blockIds.length} loading={busy}>
          {draft.mode === "single" ? "Run now" : "Create series"}
        </Button>
      </Stack>
    </Box>
  );
}
