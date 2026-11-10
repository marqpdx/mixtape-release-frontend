"use client";

import { useState } from "react";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import type { ArgusBlockRecord } from "@mixtape/api/clients/argus/types";
import { buildRunRequest, initialRunDraft, type ArgusSubmission, type RunDraft } from "./runRequest";

interface Props {
  blocks: ArgusBlockRecord[];
  available: boolean;
  busy: boolean;
  onStart: (request: ArgusSubmission) => Promise<void>;
}
export default function ArgusRunForm({ blocks, available, busy, onStart }: Props) {
  const [draft, setDraft] = useState<RunDraft>(initialRunDraft);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const update = <K extends keyof RunDraft>(key: K, value: RunDraft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setConfirmed(false);
    setError(null);
  };
  const ready = available && draft.mode !== "open_ended";
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || busy || !confirmed) return;
    setError(null);
    try { await onStart(buildRunRequest(draft)); setConfirmed(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to start. Refresh status before retrying."); }
  };
  return <Box as="form" className="arun-form" onSubmit={submit} maxW="760px">
    <Stack className="arun-fields" gap={5}>
      <Heading size="lg">Start a run</Heading>
      <Text color="theme.textSecondary">Choose a block. Runs use your own builder account on Cass.</Text>
      <Field.Root><Field.Label htmlFor="argus-mode">Run mode</Field.Label>
        <select id="argus-mode" style={{ width: "100%", minWidth: 0 }} value={draft.mode} disabled={busy} onChange={(event) => update("mode", event.target.value as RunDraft["mode"])}>
          <option value="single">Single run</option><option value="bounded">Bounded series</option>
          <option value="open_ended" disabled>Open-ended series — not available yet; ask each time</option>
        </select>
      </Field.Root>
      <Box as="fieldset" className="arun-blocks" borderWidth="1px" borderColor="theme.border" p={4} borderRadius="md">
        <legend>Block</legend>
        {!blocks.length && <Text>No blocks are available to start.</Text>}
        <Stack className="arun-block-options" gap={2}>{blocks.map((block) => <label key={block.slug}>
          <input type="radio" name="argus-block" value={block.slug} disabled={busy || block.block_state !== "ready"}
            checked={draft.blockIds.includes(block.slug)} onChange={() => update("blockIds", [block.slug])} />
          {" "}{block.slug}{block.block_state !== "ready" ? ` (${block.block_state})` : ""}
        </label>)}</Stack>
      </Box>
      {draft.mode === "bounded" && <Stack className="arun-series-fields" gap={4}>
        <Field.Root><Field.Label htmlFor="argus-cadence">Run every (hours)</Field.Label>
          <Input id="argus-cadence" type="number" min={1} step={1} required disabled={busy}
            value={!draft.cadenceMinutes ? "" : Number(draft.cadenceMinutes) / 60}
            onChange={(event) => update("cadenceMinutes", !event.target.value ? "" : String(Number(event.target.value) * 60))} />
        </Field.Root>
        <Field.Root><Field.Label htmlFor="argus-bound">Series ends</Field.Label>
          <select id="argus-bound" style={{ width: "100%", minWidth: 0 }} value={draft.bound} disabled={busy} onChange={(event) => update("bound", event.target.value as RunDraft["bound"])}>
            <option value="days">After a number of days</option><option value="count">After a number of runs</option>
            <option value="end" disabled>At a date and time — not available yet</option>
          </select>
        </Field.Root>
        <Field.Root><Field.Label htmlFor="argus-span">{draft.bound === "count" ? "Number of runs" : "Number of days"}</Field.Label>
          <Input id="argus-span" type="number" min={1} max={draft.bound === "days" ? 7 : undefined} step={1} required disabled={busy}
            value={draft.bound === "count" ? draft.count : draft.days} onChange={(event) => update(draft.bound === "count" ? "count" : "days", event.target.value)} />
          <Field.HelperText>A bounded series runs on its own for at most seven days, within the agreed limits.</Field.HelperText>
        </Field.Root>
        <Stack className="arun-caps" direction={{ base: "column", md: "row" }} gap={4}>
          {([["tokens", "Token cap per turn"], ["turns", "Turn cap"], ["wallSeconds", "Wall-clock cap (seconds)"]] as const).map(([key, label]) => <Field.Root key={key}>
            <Field.Label htmlFor={`argus-${key}`}>{label}</Field.Label><Input id={`argus-${key}`} type="number" min={1} step={1} required disabled={busy}
              value={draft[key]} onChange={(event) => update(key, event.target.value)} />
          </Field.Root>)}
        </Stack>
      </Stack>}
      <Text color="theme.textSecondary" fontSize="sm">One run at a time on Cass. A daily token ceiling applies across all series. You can stop a series at any time.</Text>
      <label><input type="checkbox" checked={confirmed} disabled={busy || !ready} onChange={(event) => setConfirmed(event.target.checked)} />{" "}
        {draft.mode === "single" ? "I approve this run." : "I approve this bounded series running on its own within these limits."}
      </label>
      {!ready && <Text role="status">Runs are not available yet.</Text>}
      {error && <Text role="alert" color="red.600">{error}</Text>}
      <Button type="submit" alignSelf="start" disabled={!ready || busy || !confirmed || !draft.blockIds.length} loading={busy}>{draft.mode === "single" ? "Run now" : "Create series"}</Button>
    </Stack>
  </Box>;
}
