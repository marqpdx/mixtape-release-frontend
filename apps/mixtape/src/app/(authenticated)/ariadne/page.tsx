// apps/mixtape/src/app/(authenticated)/ariadne/page.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Heading, HStack, Spinner, Text, Textarea, VStack } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";
import {
  assemblePacket,
  fetchLatestRun,
  fetchPacketDetail,
  fetchRunCandidates,
  fetchRunPackets,
  recordDecision,
  type AriadneEvidencePacket,
  type AriadneEvidencePacketDetail,
  type AriadneRun,
  type AriadneRunCandidate,
  type RunDisposition,
} from "@mixtape/api/clients/ariadne/ariadneApi";

/**
 * ARIADNE — P6 curation workbench (build spec §9, §10, §13)
 *
 * Three-region layout per §13's "First workbench": Candidate rail,
 * Evidence workspace, Crafting rail. Covers §9's 4A-4D only (Discover,
 * Select, Assemble packets, Review) -- 4E (model interpretation) and 4F
 * (assertion curation) aren't built yet; "accept" here promotes a
 * candidate's phrase straight to a Concept (see core's ariadne/services.py),
 * which is as far as curation goes in this pass.
 *
 * Superuser-only, same inline-check convention as /admin/puddlejump --
 * enforced again server-side by every endpoint this page calls
 * (ariadne/api/permissions.py), not just here.
 */

const DISPOSITION_COLORS: Record<RunDisposition, string> = {
  pending: "gray",
  accept: "green",
  decline: "red",
  defer: "yellow",
  drop: "gray",
};

export default function AriadnePage() {
  const { user, isLoading: identityLoading } = useAuth();
  const identity = user as UserIdentity | null;
  const isSuperuser = !!identity?.is_superuser;

  const [run, setRun] = useState<AriadneRun | null>(null);
  const [candidates, setCandidates] = useState<AriadneRunCandidate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [packets, setPackets] = useState<AriadneEvidencePacket[]>([]);
  const [selectedPacketDetail, setSelectedPacketDetail] = useState<AriadneEvidencePacketDetail | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.concept_or_phrase_key === selectedKey) ?? null,
    [candidates, selectedKey]
  );

  const loadRunAndCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const latestRun = await fetchLatestRun();
      setRun(latestRun);
      const runCandidates = await fetchRunCandidates(latestRun.id);
      setCandidates(runCandidates);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't load the Discovery Run.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (identity && isSuperuser) {
      document.title = "Ariadne - Mixtape Crossroads";
      loadRunAndCandidates();
    }
  }, [identity, isSuperuser, loadRunAndCandidates]);

  const loadPacketsFor = useCallback(
    async (candidateKey: string) => {
      if (!run) return;
      const allPackets = await fetchRunPackets(run.id);
      const forCandidate = allPackets.filter((p) => p.candidate_key === candidateKey);
      setPackets(forCandidate);
      setSelectedPacketDetail(null);
      if (forCandidate.length > 0) {
        const detail = await fetchPacketDetail(forCandidate[0].id);
        setSelectedPacketDetail(detail);
      }
    },
    [run]
  );

  const handleSelectCandidate = useCallback(
    (candidate: AriadneRunCandidate) => {
      setSelectedKey(candidate.concept_or_phrase_key);
      setReason(candidate.disposition_reason);
      loadPacketsFor(candidate.concept_or_phrase_key);
    },
    [loadPacketsFor]
  );

  const handleAssemble = useCallback(async () => {
    if (!run || !selectedCandidate) return;
    setBusy(true);
    setError(null);
    try {
      await assemblePacket(run.id, selectedCandidate.concept_or_phrase_key);
      await loadPacketsFor(selectedCandidate.concept_or_phrase_key);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't assemble an evidence packet.");
    } finally {
      setBusy(false);
    }
  }, [run, selectedCandidate, loadPacketsFor]);

  const handleDecision = useCallback(
    async (action: RunDisposition) => {
      if (!run || !selectedCandidate) return;
      setBusy(true);
      setError(null);
      try {
        const updated = await recordDecision(run.id, {
          candidate_key: selectedCandidate.concept_or_phrase_key,
          action,
          reason,
        });
        setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Couldn't record that decision.");
      } finally {
        setBusy(false);
      }
    },
    [run, selectedCandidate, reason]
  );

  const handleSelectPacket = useCallback(async (packet: AriadneEvidencePacket) => {
    const detail = await fetchPacketDetail(packet.id);
    setSelectedPacketDetail(detail);
  }, []);

  if (identityLoading) {
    return <Text>Loading...</Text>;
  }
  if (!identity) {
    return <Text>Authentication required...</Text>;
  }
  if (!isSuperuser) {
    return <Text>Superuser access required.</Text>;
  }

  return (
    <Box className="ard-root" p={{ base: 4, md: 6 }}>
      <VStack align="stretch" gap={4}>
        <Box className="ard-header">
          <Heading as="h1" size="lg" color="theme.text">
            Ariadne
          </Heading>
          <Text color="theme.textSecondary" fontSize="sm">
            {run
              ? `${run.lens_name} Lens, v${run.lens_version} — ${run.candidate_count} candidates, ${run.status}`
              : loading
                ? "Loading the latest Discovery Run..."
                : "No Discovery Run found."}
          </Text>
          {error && <Text color="red.500" fontSize="sm">{error}</Text>}
        </Box>

        <Flex className="ard-workbench" gap={4} align="flex-start" wrap="wrap">
          <Box className="ard-candidate-rail" flex="1" minW="280px" maxH="70vh" overflowY="auto">
            <Heading as="h2" size="sm" mb={2}>Candidates</Heading>
            <VStack align="stretch" gap={1}>
              {candidates.map((candidate) => (
                <Box
                  key={candidate.id}
                  className="ard-candidate-row"
                  p={2}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={selectedKey === candidate.concept_or_phrase_key ? "theme.accent" : "theme.border"}
                  cursor="pointer"
                  onClick={() => handleSelectCandidate(candidate)}
                >
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">
                      #{candidate.rank} {candidate.concept_or_phrase_key}
                    </Text>
                    <Badge colorPalette={DISPOSITION_COLORS[candidate.disposition]}>{candidate.disposition}</Badge>
                  </HStack>
                  <Text fontSize="xs" color="theme.textSecondary">score {candidate.score.toFixed(2)}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Box className="ard-evidence-workspace" flex="2" minW="320px">
            <Heading as="h2" size="sm" mb={2}>Evidence</Heading>
            {!selectedCandidate && <Text fontSize="sm" color="theme.textSecondary">Select a candidate.</Text>}
            {selectedCandidate && (
              <VStack align="stretch" gap={3}>
                <HStack>
                  {packets.map((packet) => (
                    <Badge
                      key={packet.id}
                      cursor="pointer"
                      colorPalette={selectedPacketDetail?.id === packet.id ? "blue" : "gray"}
                      onClick={() => handleSelectPacket(packet)}
                    >
                      v{packet.packet_version}
                    </Badge>
                  ))}
                  <Button size="xs" onClick={handleAssemble} loading={busy}>
                    Assemble evidence
                  </Button>
                </HStack>

                {selectedPacketDetail && (
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="sm" fontStyle="italic">{selectedPacketDetail.summary}</Text>
                    {selectedPacketDetail.passages.map((passage) => (
                      <Box key={passage.passage_id} p={2} borderWidth="1px" borderRadius="md">
                        <Text fontSize="xs" fontWeight="bold">{passage.document_title || passage.source_key}</Text>
                        {passage.heading_path && (
                          <Text fontSize="xs" color="theme.textSecondary">{passage.heading_path}</Text>
                        )}
                        <Text fontSize="sm" mt={1}>{passage.excerpt}</Text>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}
          </Box>

          <Box className="ard-crafting-rail" flex="1" minW="260px">
            <Heading as="h2" size="sm" mb={2}>Decide</Heading>
            {!selectedCandidate && <Text fontSize="sm" color="theme.textSecondary">Select a candidate.</Text>}
            {selectedCandidate && (
              <VStack align="stretch" gap={2}>
                <Textarea
                  size="sm"
                  placeholder="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <HStack wrap="wrap">
                  <Button size="sm" colorPalette="green" onClick={() => handleDecision("accept")} loading={busy}>
                    Accept
                  </Button>
                  <Button size="sm" colorPalette="yellow" onClick={() => handleDecision("defer")} loading={busy}>
                    Defer
                  </Button>
                  <Button size="sm" colorPalette="red" onClick={() => handleDecision("decline")} loading={busy}>
                    Decline
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecision("drop")} loading={busy}>
                    Drop
                  </Button>
                </HStack>
                {selectedCandidate.concept_label && (
                  <Text fontSize="xs" color="theme.textSecondary">
                    Promoted to Concept &ldquo;{selectedCandidate.concept_label}&rdquo;
                  </Text>
                )}
              </VStack>
            )}
          </Box>
        </Flex>

        {loading && <Spinner size="sm" />}
      </VStack>
    </Box>
  );
}
