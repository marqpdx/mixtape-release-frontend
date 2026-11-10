"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { Box, Button, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { argusClient } from "@mixtape/api/clients/argus";
import type { ArgusClient, ArgusSeries, ArgusSnapshot, ArgusStartRequest } from "@mixtape/api/clients/argus/types";
import type { WorkAreaProps } from "@components/dashboard/shared/types";
import ArgusRunForm from "./ArgusRunForm";
import { localArgusUrl } from "./runRequest";

const date = (value: string | null) => {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
};
const findings = (value: Record<string, number> | null) => value === null ? "Findings not available"
  : Object.entries(value).map(([kind, count]) => `${kind}: ${count}`).join(" · ") || "No findings";

const elapsed = (value: string | null) => {
  if (!value) return "No recorded run";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (!Number.isFinite(minutes)) return "Elapsed time unknown";
  if (minutes < 0) return "Run date is in the future";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
};

const dayProgress = (series: ArgusSeries) => {
  if (!series.ends_at) return null;
  const start = new Date(series.starts_at).getTime();
  const end = new Date(series.ends_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const days = Math.ceil((end - start) / 86_400_000);
  const day = Math.min(days, Math.max(1, Math.floor((Date.now() - start) / 86_400_000) + 1));
  return `Day ${day} of ${days}`;
};

// Injectable only for integration tests; the production page always uses argusClient.
interface Props extends WorkAreaProps { client?: ArgusClient }

export default function ArgusWorkArea({ section, setActiveSection, client = argusClient }: Props) {
  const [snapshot, setSnapshot] = useState<ArgusSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const mutationLock = useRef(false);
  const generation = useRef(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const next = await client.snapshot(signal);
      if (signal?.aborted || current !== generation.current) return;
      setSnapshot(next);
      setError(null);
    } catch (cause) {
      if (signal?.aborted || current !== generation.current) return;
      // A failed refresh revokes readiness; stale data must never enable a start.
      setSnapshot(null);
      setError(cause instanceof Error ? cause.message : "Unable to load Argus.");
    } finally {
      if (!signal?.aborted && current === generation.current) setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => { controller.abort(); generation.current += 1; };
  }, [refresh]);

  const mutate = async (action: () => Promise<void>, success: string) => {
    if (mutationLock.current) throw new Error("Another request is still in progress.");
    mutationLock.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await refresh();
    } catch (cause) {
      // No optimistic record or automatic retry: the server may have received it.
      await refresh();
      setError(cause instanceof Error ? cause.message : "Request failed. Refresh the status before retrying.");
      throw cause;
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  };

  const start = (request: ArgusStartRequest) => mutate(() => client.start(request), "Request accepted. Check the status below.");
  const handleSeriesAction = (action: () => Promise<void>, success: string) => {
    void mutate(action, success).catch(() => { /* The error is rendered above the work area. */ });
  };
  const activeSeries = snapshot?.series.filter((item) => item.can_stop) ?? [];
  const latestActivity = snapshot?.blocks.map((block) => block.last_run_at).filter((value): value is string => !!value).sort().at(-1) ?? null;

  return <Box className="args-root" p={{ base: 4, md: 6 }} color="theme.text">
    <HStack className="args-header" justify="space-between" flexWrap="wrap" mb={5}>
      <Box className="args-title"><Heading as="h1" size="xl">Argus</Heading><Text color="theme.textSecondary">Quality, consistency and fidelity</Text></Box>
      <Button variant="outline" onClick={() => void refresh()} disabled={busy || loading} loading={loading}>Refresh status</Button>
    </HStack>
    {error && <Text role="alert" color="red.600" mb={4}>{error}</Text>}
    {notice && <Text role="status" mb={4}>{notice}</Text>}
    {loading && !snapshot && <Text role="status">Loading audit status…</Text>}
    {snapshot && <>
      {!snapshot.available && <Box className="args-unavailable" role="status" borderWidth="1px" borderColor="theme.border" p={4} mb={5} borderRadius="md">
        <Text>{snapshot.unavailable_reason}</Text>
        <Text fontSize="sm" color="theme.textSecondary">Audit history and coverage will appear when connected.</Text>
      </Box>}
      {section === "run" ? <ArgusRunForm snapshot={snapshot} busy={busy || loading} onStart={start} /> : section === "series" ? <Stack className="args-series" gap={4}>
        <HStack className="args-series-heading" justify="space-between" flexWrap="wrap"><Heading size="lg">Run series</Heading><Button onClick={() => setActiveSection("run")}>New series</Button></HStack>
        <Text color="theme.textSecondary">Bounded series run within their limits. Open-ended series ask before every run.</Text>
        {!snapshot.series.length && <Text>{snapshot.available ? "No run series yet." : "Run series are not available yet."}</Text>}
        {snapshot.series.map((series) => <Box key={series.id} className="args-series-card" borderWidth="1px" borderColor="theme.border" p={4} borderRadius="md">
          <Stack className="args-series-content" gap={2}>
            <Heading size="md">{series.block_ids.join(", ")}</Heading>
            <Text>{series.status} · every {series.cadence_minutes} minutes · started by {series.started_by}</Text>
            <Text>{series.completed_runs}{series.run_count !== null ? ` of ${series.run_count}` : ""} runs · {series.fruitful_runs === null ? "Finding counts pending" : `${series.fruitful_runs} found something`}</Text>
            <Text>Started: {date(series.starts_at)} · {series.mode === "open_ended" ? "Ask each time" : series.ends_at ? `Ends: ${date(series.ends_at)}` : `Ends after ${series.run_count} runs`}</Text>
            {dayProgress(series) && <Text>{dayProgress(series)}</Text>}
            <Text>Next due: {date(series.next_due_at)}</Text>
            <Text fontSize="sm">Caps: {series.caps.tokens} tokens · {series.caps.turns} turns · {series.caps.wall_seconds} seconds</Text>
            <HStack className="args-series-actions" flexWrap="wrap">
              {series.mode === "open_ended" && series.awaiting_approval && <Button disabled={busy || loading || !snapshot.manual_ready || !series.can_approve}
                onClick={() => handleSeriesAction(() => client.approveNext(series.id), "Next-run approval accepted.")}>Approve next run</Button>}
              {series.can_stop && <Button variant="outline" disabled={busy} onClick={() => handleSeriesAction(() => client.stop(series.id), "Stop acknowledged. Check the current status.")}>Stop series</Button>}
            </HStack>
          </Stack>
        </Box>)}
      </Stack> : <Stack className="args-overview" gap={6}>
        <SimpleGrid className="args-summary" columns={{ base: 1, md: 3 }} gap={4}>
          <Box className="args-summary-blocks"><Heading size="md">Audit blocks</Heading><Text>{snapshot.available ? `${snapshot.blocks.length} total · ${snapshot.blocks.filter((block) => block.state === "ready").length} ready · ${snapshot.blocks.filter((block) => !block.last_run_at).length} without a recorded run` : "Awaiting block registry"}</Text></Box>
          <Box className="args-summary-series"><Heading size="md">Active series</Heading><Text>{snapshot.available ? activeSeries.length : "Not available"}</Text></Box>
          <Box className="args-summary-tokens"><Heading size="md">Daily tokens</Heading><Text>{snapshot.daily_tokens ? `${snapshot.daily_tokens.used.toLocaleString()} of ${snapshot.daily_tokens.limit.toLocaleString()}` : "Ceiling and usage not available"}</Text></Box>
        </SimpleGrid>
        <Text>Last audit activity: {date(latestActivity)}</Text>
        <Box className="args-block-status"><HStack className="args-block-heading" justify="space-between" flexWrap="wrap" mb={3}><Heading size="lg">Block status</Heading><Button onClick={() => setActiveSection("run")}>Start a run</Button></HStack>
          {!snapshot.blocks.length && <Text>{snapshot.available ? "No audit blocks reported." : "Block status is not available yet."}</Text>}
          <Stack className="args-block-list" gap={3}>{snapshot.blocks.map((block) => <Box className="args-block" key={block.id} borderWidth="1px" borderColor="theme.border" p={4} borderRadius="md">
            <Heading size="md">{block.name}</Heading><Text>{block.domain} · {block.state} · {block.cadence_minutes === null ? "Cadence not reported" : `every ${block.cadence_minutes} minutes`}</Text><Text>Last run: {date(block.last_run_at)} · {elapsed(block.last_run_at)}</Text><Text>{findings(block.findings)}</Text>
            <HStack className="args-block-links" gap={4}>{localArgusUrl(block.block_url) && <NextLink href={localArgusUrl(block.block_url)!}>View block</NextLink>}{localArgusUrl(block.last_run_url) && <NextLink href={localArgusUrl(block.last_run_url)!}>View last run</NextLink>}</HStack>
          </Box>)}</Stack>
        </Box>
        <Box className="args-coverage"><Heading size="lg" mb={2}>Coverage gaps</Heading>
          {snapshot.coverage ? <><Text>{snapshot.coverage.covered} covered · {snapshot.coverage.uncovered.length} uncovered</Text>{snapshot.coverage.uncovered.map((gap) => <Text key={gap.name}>{gap.name}: {gap.reason}</Text>)}</> : <Text>Coverage has not been reported yet.</Text>}
        </Box>
        <Box className="args-recent-runs"><Heading size="lg" mb={2}>Recent runs</Heading>
          {!snapshot.runs.length && <Text>{snapshot.available ? "No runs reported yet." : "Run history is not available yet."}</Text>}
          <Stack className="args-run-list" gap={3}>{snapshot.runs.map((run) => <Box key={run.id} className="args-run" borderWidth="1px" borderColor="theme.border" p={3} borderRadius="md">
            <Text>{run.block_id} · {run.status} · {date(run.started_at)}</Text><Text>{findings(run.findings)}</Text>
            {localArgusUrl(run.dialogue_url) && <NextLink href={localArgusUrl(run.dialogue_url)!}>Open run and follow-up Dialogue</NextLink>}
          </Box>)}</Stack>
        </Box>
      </Stack>}
    </>}
  </Box>;
}
