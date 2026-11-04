// apps/mixtape/src/app/(authenticated)/ariadne/page.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Heading, HStack, Input, Spinner, Text, Textarea, VStack } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";
import {
  accessionReview,
  approveSubQuestions,
  assemblePacket,
  createInquiry,
  curateCitation,
  draftReview,
  fetchInquiries,
  fetchLatestRun,
  fetchPacketDetail,
  fetchRunCandidates,
  fetchRunPackets,
  fetchSavedSearches,
  frameInquiry,
  gatherInquiry,
  mapInquiryRun,
  recordDecision,
  runSavedSearch,
  saveSearch,
  searchCorpus,
  type AriadneEvidencePacket,
  type AriadneEvidencePacketDetail,
  type AriadneInquiry,
  type AriadneInquiryReview,
  type AriadneInquiryRun,
  type AriadneInquiryTheme,
  type AriadneRun,
  type AriadneRunCandidate,
  type AriadneSavedSearch,
  type AriadneSearchResult,
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

  // P8: hybrid search + saved searches as Named Lenses (build spec §19.1).
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AriadneSearchResult[] | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [savedSearches, setSavedSearches] = useState<AriadneSavedSearch[]>([]);

  // P9/P9a (build spec §19.2-19.3): Inquiry Runs and the Review artifact.
  // Frame and Draft are the two steps that can call a model -- both are
  // gated behind an explicit checkbox here, never run silently.
  const [inquiries, setInquiries] = useState<AriadneInquiry[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [activeInquiry, setActiveInquiry] = useState<AriadneInquiry | null>(null);
  const [draftSubQuestions, setDraftSubQuestions] = useState("");
  const [frameUseModel, setFrameUseModel] = useState(false);
  const [activeRun, setActiveRun] = useState<AriadneInquiryRun | null>(null);
  const [themes, setThemes] = useState<AriadneInquiryTheme[]>([]);
  const [draftUseModel, setDraftUseModel] = useState(false);
  const [activeReview, setActiveReview] = useState<AriadneInquiryReview | null>(null);
  const [inquiryBusy, setInquiryBusy] = useState(false);

  const loadInquiries = useCallback(async () => {
    try {
      setInquiries(await fetchInquiries());
    } catch {
      // Non-fatal -- the create form still works without the list.
    }
  }, []);

  const handleCreateInquiry = useCallback(async () => {
    if (!newQuestion.trim()) return;
    setInquiryBusy(true);
    setError(null);
    try {
      const inquiry = await createInquiry(newQuestion);
      setActiveInquiry(inquiry);
      setActiveRun(null);
      setThemes([]);
      setActiveReview(null);
      setNewQuestion("");
      await loadInquiries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't create that Inquiry.");
    } finally {
      setInquiryBusy(false);
    }
  }, [newQuestion, loadInquiries]);

  const handleFrame = useCallback(async () => {
    if (!activeInquiry) return;
    setInquiryBusy(true);
    setError(null);
    try {
      const subQuestions = draftSubQuestions.trim()
        ? draftSubQuestions
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => ({ text: line.trim(), approved: false, search_terms: [line.trim()] }))
        : undefined;
      const updated = await frameInquiry(activeInquiry.id, { sub_questions: subQuestions, use_model: frameUseModel });
      setActiveInquiry(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Frame failed -- a model step may need use_model checked.");
    } finally {
      setInquiryBusy(false);
    }
  }, [activeInquiry, draftSubQuestions, frameUseModel]);

  const handleToggleApprove = useCallback(
    async (text: string) => {
      if (!activeInquiry) return;
      const alreadyApproved = activeInquiry.sub_questions.filter((sq) => sq.approved).map((sq) => sq.text);
      const next = alreadyApproved.includes(text)
        ? alreadyApproved.filter((t) => t !== text)
        : [...alreadyApproved, text];
      setInquiryBusy(true);
      try {
        setActiveInquiry(await approveSubQuestions(activeInquiry.id, next));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Couldn't update approval.");
      } finally {
        setInquiryBusy(false);
      }
    },
    [activeInquiry]
  );

  const handleGather = useCallback(async () => {
    if (!activeInquiry) return;
    setInquiryBusy(true);
    setError(null);
    try {
      const run = await gatherInquiry(activeInquiry.id);
      setActiveRun(run);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gather failed.");
    } finally {
      setInquiryBusy(false);
    }
  }, [activeInquiry]);

  const handleMap = useCallback(async () => {
    if (!activeRun) return;
    setInquiryBusy(true);
    setError(null);
    try {
      setThemes(await mapInquiryRun(activeRun.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Map failed.");
    } finally {
      setInquiryBusy(false);
    }
  }, [activeRun]);

  const handleDraft = useCallback(async () => {
    if (!activeRun) return;
    setInquiryBusy(true);
    setError(null);
    try {
      setActiveReview(await draftReview(activeRun.id, draftUseModel));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Draft needs use_model checked -- it's the one step that must generate prose.");
    } finally {
      setInquiryBusy(false);
    }
  }, [activeRun, draftUseModel]);

  const handleCurate = useCallback(
    async (citationId: string, action: "accept" | "amend" | "strike") => {
      if (!activeReview) return;
      setInquiryBusy(true);
      try {
        setActiveReview(await curateCitation(activeReview.id, { citation_id: citationId, action }));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Curation action failed.");
      } finally {
        setInquiryBusy(false);
      }
    },
    [activeReview]
  );

  const handleAccession = useCallback(async () => {
    if (!activeReview) return;
    setInquiryBusy(true);
    try {
      const inquiry = await accessionReview(activeReview.id);
      setActiveInquiry(inquiry);
      await loadInquiries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Accession failed.");
    } finally {
      setInquiryBusy(false);
    }
  }, [activeReview, loadInquiries]);

  const loadSavedSearches = useCallback(async () => {
    try {
      setSavedSearches(await fetchSavedSearches());
    } catch {
      // Non-fatal -- the search box still works without the saved list.
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchBusy(true);
    setError(null);
    try {
      setSearchResults(await searchCorpus(searchQuery));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearchBusy(false);
    }
  }, [searchQuery]);

  const handleSaveSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    const name = window.prompt("Name this saved search:", searchQuery);
    if (!name) return;
    setSearchBusy(true);
    try {
      await saveSearch(name, searchQuery);
      await loadSavedSearches();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't save that search.");
    } finally {
      setSearchBusy(false);
    }
  }, [searchQuery, loadSavedSearches]);

  const handleRunSavedSearch = useCallback(async (lens: AriadneSavedSearch) => {
    setSearchQuery(lens.query);
    setSearchBusy(true);
    setError(null);
    try {
      setSearchResults(await runSavedSearch(lens.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't run that saved search.");
    } finally {
      setSearchBusy(false);
    }
  }, []);

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
      loadSavedSearches();
      loadInquiries();
    }
  }, [identity, isSuperuser, loadRunAndCandidates, loadSavedSearches, loadInquiries]);

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

        <Box className="ard-search" borderTopWidth="1px" pt={4}>
          <Heading as="h2" size="sm" mb={2}>Search (P8)</Heading>
          <HStack mb={2}>
            <Input
              size="sm"
              placeholder="Search the corpus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              maxW="400px"
            />
            <Button size="sm" onClick={handleSearch} loading={searchBusy}>Search</Button>
            <Button size="sm" variant="outline" onClick={handleSaveSearch} loading={searchBusy}>
              Save as Lens
            </Button>
          </HStack>

          {savedSearches.length > 0 && (
            <HStack mb={2} wrap="wrap">
              <Text fontSize="xs" color="theme.textSecondary">Saved:</Text>
              {savedSearches.map((lens) => (
                <Badge key={lens.id} cursor="pointer" onClick={() => handleRunSavedSearch(lens)}>
                  {lens.name}
                </Badge>
              ))}
            </HStack>
          )}

          {searchResults && (
            <VStack align="stretch" gap={2} maxH="40vh" overflowY="auto">
              {searchResults.length === 0 && <Text fontSize="sm" color="theme.textSecondary">No matches.</Text>}
              {searchResults.map((result) => (
                <Box key={result.passage_id} p={2} borderWidth="1px" borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontSize="xs" fontWeight="bold">{result.document_title || result.source_key}</Text>
                    <HStack>
                      {result.found_by.map((method) => (
                        <Badge key={method} size="sm" colorPalette={method === "vector" ? "purple" : "blue"}>
                          {method}
                        </Badge>
                      ))}
                    </HStack>
                  </HStack>
                  <Text fontSize="sm" mt={1}>{result.excerpt}</Text>
                  {result.concept_expansion_terms && result.concept_expansion_terms.length > 0 && (
                    <Text fontSize="xs" color="theme.textSecondary" mt={1}>
                      also matched via: {result.concept_expansion_terms.join(", ")}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Box className="ard-inquiry" borderTopWidth="1px" pt={4}>
          <Heading as="h2" size="sm" mb={2}>Inquiry Runs (P9)</Heading>
          <HStack mb={2}>
            <Input
              size="sm"
              placeholder="State a question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              maxW="400px"
            />
            <Button size="sm" onClick={handleCreateInquiry} loading={inquiryBusy}>New Inquiry</Button>
          </HStack>

          {inquiries.length > 0 && (
            <HStack mb={2} wrap="wrap">
              <Text fontSize="xs" color="theme.textSecondary">Inquiries:</Text>
              {inquiries.map((inquiry) => (
                <Badge
                  key={inquiry.id}
                  cursor="pointer"
                  colorPalette={activeInquiry?.id === inquiry.id ? "blue" : "gray"}
                  onClick={() => {
                    setActiveInquiry(inquiry);
                    setActiveRun(null);
                    setThemes([]);
                    setActiveReview(null);
                  }}
                >
                  {inquiry.status}: {inquiry.question.slice(0, 40)}
                </Badge>
              ))}
            </HStack>
          )}

          {activeInquiry && (
            <VStack align="stretch" gap={3}>
              <Box p={2} borderWidth="1px" borderRadius="md">
                <Text fontSize="sm" fontWeight="bold">{activeInquiry.question}</Text>
                <Text fontSize="xs" color="theme.textSecondary">status: {activeInquiry.status}</Text>
              </Box>

              {/* Step 1: Frame */}
              <Box>
                <Text fontSize="xs" fontWeight="bold" mb={1}>1. Frame -- sub-questions, one per line</Text>
                <Textarea
                  size="sm"
                  placeholder="Enter sub-questions by hand, or check 'propose with model' below"
                  value={draftSubQuestions}
                  onChange={(e) => setDraftSubQuestions(e.target.value)}
                />
                <HStack mt={1}>
                  <label>
                    <input
                      type="checkbox"
                      checked={frameUseModel}
                      onChange={(e) => setFrameUseModel(e.target.checked)}
                    />{" "}
                    <Text as="span" fontSize="xs">propose with model (Inkwell, §19.5 consent)</Text>
                  </label>
                  <Button size="xs" onClick={handleFrame} loading={inquiryBusy}>Frame</Button>
                </HStack>

                {activeInquiry.sub_questions.length > 0 && (
                  <VStack align="stretch" gap={1} mt={2}>
                    {activeInquiry.sub_questions.map((sq) => (
                      <HStack key={sq.text} justify="space-between" p={1} borderWidth="1px" borderRadius="md">
                        <Text fontSize="sm">{sq.text}</Text>
                        <Button
                          size="xs"
                          variant={sq.approved ? "solid" : "outline"}
                          colorPalette={sq.approved ? "green" : "gray"}
                          onClick={() => handleToggleApprove(sq.text)}
                        >
                          {sq.approved ? "approved" : "approve"}
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>

              {/* Step 2: Gather */}
              <Box>
                <Text fontSize="xs" fontWeight="bold" mb={1}>2. Gather</Text>
                <Button size="xs" onClick={handleGather} loading={inquiryBusy}>Gather</Button>
                {activeRun && (
                  <Text fontSize="xs" color="theme.textSecondary" ml={2}>
                    {activeRun.gathered_passage_ids.length} passages gathered ({activeRun.status})
                  </Text>
                )}
              </Box>

              {/* Step 3: Map */}
              {activeRun && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" mb={1}>3. Map</Text>
                  <Button size="xs" onClick={handleMap} loading={inquiryBusy}>Map into themes</Button>
                  {themes.length > 0 && (
                    <VStack align="stretch" gap={1} mt={2}>
                      {themes.map((theme) => (
                        <Text key={theme.id} fontSize="sm">
                          {theme.label || `Theme ${theme.rank + 1}`} -- {theme.passage_count} passage(s)
                        </Text>
                      ))}
                    </VStack>
                  )}
                </Box>
              )}

              {/* Step 5: Draft (step 4, Review packets, is assembled per theme via the same packet endpoints as P6) */}
              {themes.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" mb={1}>5. Draft the Review</Text>
                  <HStack>
                    <label>
                      <input
                        type="checkbox"
                        checked={draftUseModel}
                        onChange={(e) => setDraftUseModel(e.target.checked)}
                      />{" "}
                      <Text as="span" fontSize="xs">generate with model (Inkwell, §19.5 consent -- required)</Text>
                    </label>
                    <Button size="xs" onClick={handleDraft} loading={inquiryBusy}>Draft</Button>
                  </HStack>
                </Box>
              )}

              {/* Step 6: Curate */}
              {activeReview && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" mb={1}>
                    6. Curate (v{activeReview.version}, {activeReview.uncited_claim_count} uncited claim(s))
                  </Text>
                  <VStack align="stretch" gap={1} mb={2}>
                    {activeReview.citations.map((citation) => (
                      <HStack key={citation.id} justify="space-between" p={1} borderWidth="1px" borderRadius="md">
                        <Text fontSize="sm">
                          {citation.text}{" "}
                          {citation.interpretation && (
                            <Badge size="sm" colorPalette="yellow">interpretation</Badge>
                          )}
                          <Badge size="sm" ml={1}>{citation.status}</Badge>
                        </Text>
                        <HStack>
                          <Button size="xs" colorPalette="green" onClick={() => handleCurate(citation.id, "accept")}>
                            Accept
                          </Button>
                          <Button size="xs" colorPalette="red" onClick={() => handleCurate(citation.id, "strike")}>
                            Strike
                          </Button>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                  <Button size="xs" colorPalette="blue" onClick={handleAccession} loading={inquiryBusy}>
                    Accession as standing review
                  </Button>
                  <Box mt={2} p={2} borderWidth="1px" borderRadius="md" whiteSpace="pre-wrap">
                    <Text fontSize="xs" fontFamily="mono">{activeReview.body_markdown}</Text>
                  </Box>
                </Box>
              )}
            </VStack>
          )}
        </Box>

        {loading && <Spinner size="sm" />}
      </VStack>
    </Box>
  );
}
