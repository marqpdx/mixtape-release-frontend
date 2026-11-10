"use client";

import { useRef, useState } from "react";
import NextLink from "next/link";
import { Box, Button, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { ArgusApi } from "@mixtape/api/clients/argus/types";
import { useArgus } from "@mixtape/api/clients/argus/useArgus";
import type { WorkAreaProps } from "@components/dashboard/shared/types";
import ArgusRunForm from "./ArgusRunForm";
import { localArgusUrl, type ArgusSubmission } from "./runRequest";

const date = (value: string | null) => {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
};
const counts = (value: Record<string, number> | null) => value === null ? "Findings not available"
  : Object.entries(value).map(([kind, count]) => `${kind}: ${count}`).join(" · ") || "No finding counts reported";
const elapsed = (value: string | null) => {
  if (!value) return "No recorded run";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (!Number.isFinite(minutes)) return "Elapsed time unknown";
  if (minutes < 0) return "Run date is in the future";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
};
const message = (cause: unknown) => cause instanceof Error ? cause.message : "Request failed. Refresh status before trying again.";

interface Props extends WorkAreaProps { identityKey?: string; api?: ArgusApi }

export default function ArgusWorkArea({ section, setActiveSection, identityKey = "superuser", api }: Props) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const state = useArgus(identityKey, selectedBlock, api);
  const blocks = state.blocks.data?.blocks ?? [];
  const available = state.blocks.isSuccess;
  const loading = state.blocks.isFetching;
  const activeSeries = state.series.filter((query) => query.data?.status === "active").length;
  const latest = blocks.map((block) => block.last_run_at).filter((value): value is string => !!value).sort().at(-1) ?? null;

  const mutate = async (action: () => Promise<string>) => {
    if (lock.current) throw new Error("Another request is still in progress.");
    lock.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try { setNotice(await action()); }
    catch (cause) { setError(message(cause)); throw cause; }
    finally { lock.current = false; setBusy(false); }
  };
  const start = (submission: ArgusSubmission) => mutate(async () => {
    const slug = submission.mode === "single" ? submission.block_slug : submission.request.block_slug;
    if (!available || !blocks.some((block) => block.slug === slug && block.block_state === "ready")) {
      throw new Error("This block is not available to start. Refresh status.");
    }
    if (submission.mode === "single") {
      const result = await state.startRun.mutateAsync(slug);
      return result.status === "not_reachable" ? result.detail : `Run started: ${result.run_id}`;
    }
    const result = await state.createSeries.mutateAsync(submission.request);
    return `Series ${result.series_id}: ${result.status}. This does not confirm that a run has started.`;
  });
  const stop = (id: string) => {
    void mutate(async () => { await state.stopSeries.mutateAsync(id); return "Stop acknowledged."; })
      .catch(() => { /* The error is shown above the work area. */ });
  };

  return <Box className="args-root" p={{ base: 4, md: 6 }} color="theme.text">
    <HStack className="args-header" justify="space-between" flexWrap="wrap" mb={5}>
      <Box className="args-title"><Heading as="h1" size="xl">Argus</Heading><Text color="theme.textSecondary">Quality, consistency and fidelity</Text></Box>
      <Button variant="outline" onClick={() => void state.refresh()} disabled={busy || loading} loading={loading}>Refresh status</Button>
    </HStack>
    {error && <Text role="alert" color="red.600" mb={4}>{error}</Text>}
    {notice && <Text role="status" mb={4}>{notice}</Text>}
    {state.blocks.isPending && <Text role="status">Loading audit status…</Text>}
    {state.blocks.isError && <Box className="args-unavailable" role="alert" borderWidth="1px" borderColor="theme.border" p={4} mb={5} borderRadius="md">
      <Text>Argus could not load its blocks: {message(state.blocks.error)}</Text><Text fontSize="sm">Run controls are unavailable. Refresh status to try again.</Text>
    </Box>}
    {section === "run" ? available && <ArgusRunForm blocks={blocks} available={available} busy={busy || loading} onStart={start} /> : section === "series" ? <Stack className="args-series" gap={4}>
      <HStack className="args-series-heading" justify="space-between" flexWrap="wrap"><Heading size="lg">Run series</Heading><Button onClick={() => setActiveSection("run")}>New series</Button></HStack>
      <Text color="theme.textSecondary">Bounded series run within their limits. Open-ended series still need approval for each run and are not available here yet.</Text>
      {!state.seriesIds.length && <Text>{available ? "No active series reported. Newly created series also appear here." : "Run series are not available yet."}</Text>}
      {state.series.map((query, index) => {
        const series = query.data;
        return <Box key={state.seriesIds[index]} className="args-series-card" borderWidth="1px" borderColor="theme.border" p={4} borderRadius="md">
          {query.isPending && <Text role="status">Loading series {state.seriesIds[index]}…</Text>}
          {query.isError && <Text role="alert">Series {state.seriesIds[index]} could not refresh: {message(query.error)}. Displayed values may be stale.</Text>}
          {series && <Stack className="args-series-content" gap={2}>
            <Heading size="md">{series.block_slug}</Heading>
            <Text>{series.status} · every {series.cadence_hours} hours · started by {series.started_by ?? "Not recorded"}</Text>
            <Text>{series.runs_done}{series.runs_total !== null ? ` of ${series.runs_total}` : ""} runs · {series.findings_count === undefined ? "Finding counts pending" : `${series.findings_count} found something`}</Text>
            <Text>{series.span.kind === "days" ? `For ${series.span.value} days` : `Ends after ${series.span.value} runs`}</Text>
            {series.span.kind === "days" && series.day_of_span !== null && <Text>Day {series.day_of_span} of {series.span.value}</Text>}
            <Text fontSize="sm">Caps: {series.per_turn_caps.max_tokens} tokens · {series.per_turn_caps.max_turns} turns · {series.per_turn_caps.max_wall_clock_seconds} seconds</Text>
            {series.status === "active" && <Button variant="outline" alignSelf="start" disabled={busy} onClick={() => stop(series.series_id)}>Stop series</Button>}
          </Stack>}
        </Box>;
      })}
    </Stack> : <Stack className="args-overview" gap={6}>
      <SimpleGrid className="args-summary" columns={{ base: 1, md: 3 }} gap={4}>
        <Box className="args-summary-blocks"><Heading size="md">Audit blocks</Heading><Text>{available ? `${blocks.length} total · ${blocks.filter((block) => block.block_state === "ready").length} ready · ${blocks.filter((block) => !block.last_run_at).length} without a recorded run` : "Awaiting block registry"}</Text></Box>
        <Box className="args-summary-series"><Heading size="md">Active series</Heading><Text>{!available || state.series.some((query) => query.isPending || query.isError) ? "Not available" : activeSeries}</Text></Box>
        <Box className="args-summary-tokens"><Heading size="md">Daily tokens</Heading><Text>Ceiling and usage not available</Text></Box>
      </SimpleGrid>
      <Text>Last audit activity: {date(latest)}</Text>
      <Box className="args-block-status"><HStack className="args-block-heading" justify="space-between" flexWrap="wrap" mb={3}><Heading size="lg">Block status</Heading><Button onClick={() => setActiveSection("run")}>Start a run</Button></HStack>
        {available && !blocks.length && <Text>No audit blocks reported.</Text>}
        <Stack className="args-block-list" gap={3}>{blocks.map((block) => <Box className="args-block" key={block.slug} borderWidth="1px" borderColor="theme.border" p={4} borderRadius="md">
          <Heading size="md">{block.slug}</Heading><Text>{block.domain} · {block.block_state}</Text><Text>Cadence not reported</Text><Text>Last run: {date(block.last_run_at)} · {elapsed(block.last_run_at)}</Text><Text>{counts(block.findings_by_type)}</Text>
          <Button variant="outline" size="sm" mt={2} onClick={() => setSelectedBlock(block.slug)}>View runs and findings: {block.slug}</Button>
        </Box>)}</Stack>
      </Box>
      {selectedBlock && <Box className="args-block-detail"><Heading size="lg" mb={2}>Runs: {selectedBlock}</Heading>
        {state.block.isFetching && <Text role="status">Refreshing run history…</Text>}
        {state.block.isError && <Text role="alert">Run history could not load: {message(state.block.error)}.</Text>}
        {state.block.isSuccess && !state.block.data.runs.length && <Text>No runs reported for this block.</Text>}
        <Stack className="args-run-list" gap={3}>{state.block.data?.runs.map((run) => <Box key={run.run_id} className="args-run" borderWidth="1px" borderColor="theme.border" p={3} borderRadius="md">
          <Text>{run.run_id} · {run.status} · {date(run.started_at)}</Text>
          {!run.findings.length && <Text>No structured findings reported for this run yet.</Text>}
          {run.findings.map((finding, index) => <Box key={index} className="args-finding" mt={2}><Text>{finding.type}: {finding.summary}</Text>
            {localArgusUrl(finding.detail_url) && <NextLink href={localArgusUrl(finding.detail_url)!}>View finding</NextLink>}
          </Box>)}
        </Box>)}</Stack>
      </Box>}
      <Box className="args-coverage"><Heading size="lg" mb={2}>Coverage gaps</Heading><Text>Coverage has not been reported yet.</Text></Box>
    </Stack>}
  </Box>;
}
