"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  createOcrSpikeArtifact,
  fetchOcrSpikeArtifact,
  fetchOcrSpikePageFile,
  fetchOcrSpikePages,
  listOcrSpikeShapes,
  listOcrSpikeArtifacts,
  runCloudOcr,
  runLocalOcr,
  runRecipeShaping,
  saveOcrEvaluation,
  saveOcrFeedback,
  type OcrCorrectionEffort,
  type OcrOutcome,
  type OcrPrivacySensitivity,
  type OcrScreen,
  type OcrSpikeArtifact,
  type OcrSpikeAttempt,
  type OcrSpikePage,
  type OcrSpikeShape,
  type OcrSpikeShapingAttempt,
} from "@mixtape/api/clients/ocrSpike/ocrSpikeApi";

const privacyOptions: Array<{ value: OcrPrivacySensitivity; label: string; helper: string }> = [
  { value: "medium", label: "Medium", helper: "Ask before cloud escalation." },
  { value: "low", label: "Low", helper: "Cloud escalation is acceptable." },
  { value: "complete", label: "Complete", helper: "Never send to cloud AI." },
];

const effortOptions: Array<{ value: OcrCorrectionEffort; label: string }> = [
  { value: "none", label: "No correction" },
  { value: "minor", label: "Minor correction" },
  { value: "heavy", label: "Heavy correction" },
  { value: "not_worth_it", label: "Not worth it" },
];

export default function OcrSpikePage() {
  const [artifacts, setArtifacts] = useState<OcrSpikeArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<OcrSpikeArtifact | null>(null);
  const [shapes, setShapes] = useState<OcrSpikeShape[]>([]);
  const [pages, setPages] = useState<OcrSpikePage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<OcrPrivacySensitivity>("medium");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workingText, setWorkingText] = useState("");
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [qualityRating, setQualityRating] = useState<number | null>(3);
  const [correctionEffort, setCorrectionEffort] = useState<OcrCorrectionEffort>("none");
  const [notes, setNotes] = useState("");
  const [searchSummary, setSearchSummary] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const selectedArtifactId = selectedArtifact?.artifact_id ?? null;

  const selectedPage = useMemo(
    () => pages.find((page) => page.page_id === selectedPageId) ?? pages[0] ?? null,
    [pages, selectedPageId]
  );
  const selectedAttempt = useMemo(
    () => selectedPage?.attempts.find((attempt) => attempt.attempt_id === selectedAttemptId) ?? selectedPage?.attempts[0] ?? null,
    [selectedAttemptId, selectedPage]
  );
  const screen: OcrScreen = selectedArtifact ? (pages.length > 0 ? "curation" : "processing") : "upload";
  const cloudBlocked = selectedArtifact?.privacy_sensitivity === "complete";
  const artifactIsProcessing = selectedArtifact?.status === "preparing" || selectedArtifact?.status === "recognizing";
  const attemptsAreProcessing = pages.some((page) => page.attempts.some((attempt) => attempt.status === "processing"));
  const shapingIsProcessing = pages.some((page) => page.shaping_attempts.some((attempt) => attempt.status === "processing"));
  const shouldPoll = Boolean(selectedArtifactId && (artifactIsProcessing || attemptsAreProcessing || shapingIsProcessing));
  const latestShapingAttempt = selectedPage?.shaping_attempts[0] ?? null;

  const refreshArtifacts = useCallback(async () => {
    const next = await listOcrSpikeArtifacts();
    setArtifacts(next);
    if (!selectedArtifactId && next.length > 0) setSelectedArtifact(next[0]);
  }, [selectedArtifactId]);

  const refreshSelected = useCallback(async () => {
    if (!selectedArtifactId) return;
    const [artifact, nextPages] = await Promise.all([
      fetchOcrSpikeArtifact(selectedArtifactId),
      fetchOcrSpikePages(selectedArtifactId),
    ]);
    setSelectedArtifact(artifact);
    setPages(nextPages);
    setSelectedPageId((current) => current ?? nextPages[0]?.page_id ?? null);
    setLastRefreshedAt(new Date());
  }, [selectedArtifactId]);

  useEffect(() => {
    void refreshArtifacts().catch(() => setError("Could not load OCR spike artifacts."));
    void listOcrSpikeShapes().then(setShapes).catch(() => setError("Could not load OCR spike shapes."));
  }, [refreshArtifacts]);

  useEffect(() => {
    if (!selectedArtifactId) return;
    void refreshSelected().catch(() => setError("Could not load OCR spike artifact."));
  }, [refreshSelected, selectedArtifactId]);

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = window.setInterval(() => {
      void refreshSelected().catch(() => setError("Could not refresh OCR spike status."));
    }, 2500);
    return () => window.clearInterval(interval);
  }, [refreshSelected, shouldPoll]);

  useEffect(() => {
    if (!selectedAttempt) return;
    setSelectedAttemptId(selectedAttempt.attempt_id);
    setWorkingText(selectedPage?.evaluation?.final_text || selectedAttempt.raw_text || "");
    setNotes(selectedPage?.evaluation?.notes || "");
    setSearchSummary(selectedPage?.evaluation?.search_summary || "");
    setQualityRating(selectedPage?.evaluation?.quality_rating ?? 3);
    setCorrectionEffort(selectedPage?.evaluation?.correction_effort || "none");
  }, [selectedAttempt, selectedPage]);

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const artifact = await createOcrSpikeArtifact(file, privacy);
      setSelectedArtifact(artifact);
      setPages([]);
      setSelectedPageId(null);
      await refreshArtifacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRunLocal = async () => {
    if (!selectedArtifact) return;
    setBusy(true);
    setError(null);
    try {
      const artifact = await runLocalOcr(selectedArtifact.artifact_id);
      setSelectedArtifact(artifact);
      window.setTimeout(() => void refreshSelected(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start local recognition.");
    } finally {
      setBusy(false);
    }
  };

  const handleCloud = async () => {
    if (!selectedPage || cloudBlocked) return;
    setBusy(true);
    setError(null);
    try {
      await runCloudOcr(selectedPage.page_id);
      window.setTimeout(() => void refreshSelected(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start cloud recognition.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEvaluation = async (outcome: OcrOutcome) => {
    if (!selectedPage) return;
    setBusy(true);
    setError(null);
    try {
      await saveOcrEvaluation(selectedPage.page_id, {
        selected_attempt_id: selectedAttemptId,
        final_text: workingText,
        outcome,
        quality_rating: qualityRating,
        correction_effort: correctionEffort,
        search_summary: searchSummary,
        notes,
      });
      await refreshSelected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save evaluation.");
    } finally {
      setBusy(false);
    }
  };

  const handleShapeRecipe = async () => {
    if (!selectedPage) return;
    setBusy(true);
    setError(null);
    try {
      await runRecipeShaping(selectedPage.page_id, {
        selected_attempt_id: selectedAttemptId,
        reviewed_text: workingText,
        shape_id: "food_service.recipe",
      });
      window.setTimeout(() => void refreshSelected(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start recipe shaping.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedback.trim()) return;
    setBusy(true);
    setFeedbackSaved(false);
    try {
      await saveOcrFeedback({
        artifact_id: selectedArtifact?.artifact_id ?? null,
        page_id: selectedPage?.page_id ?? null,
        screen,
        note: feedback.trim(),
      });
      setFeedback("");
      setFeedbackSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="ocrsp-root" minH="100vh" bg="gray.50" color="gray.900">
      <Container className="ocrsp-shell" maxW="1280px" py={8}>
        <VStack className="ocrsp-stack" align="stretch" gap={6}>
          <Flex className="ocrsp-header" justify="space-between" align={{ base: "start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
            <Box>
              <Badge colorPalette="purple" mb={3}>Spike</Badge>
              <Heading size="lg">OCR Recognition Pilot</Heading>
              <Text color="gray.600" mt={2}>Upload, recognize, curate, evaluate. Nothing enters Catalyst, Stackroom, Find, or canon.</Text>
            </Box>
            {busy && <HStack><Spinner size="sm" /><Text fontSize="sm">Working…</Text></HStack>}
          </Flex>

          {error && <Box className="ocrsp-error" bg="red.50" border="1px solid" borderColor="red.200" p={4}>{error}</Box>}

          <SimpleGrid className="ocrsp-main-grid" columns={{ base: 1, lg: 3 }} gap={5} alignItems="start">
            <VStack className="ocrsp-sidebar" align="stretch" gap={4}>
              <Box bg="white" border="1px solid" borderColor="gray.200" p={5} borderRadius="md">
                <Heading size="sm" mb={4}>Upload</Heading>
                <NativeSelect.Root mb={3}>
                  <NativeSelect.Field value={privacy} onChange={(event) => setPrivacy(event.currentTarget.value as OcrPrivacySensitivity)}>
                    {privacyOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Text fontSize="sm" color="gray.600" mb={4}>{privacyOptions.find((item) => item.value === privacy)?.helper}</Text>
                <Button as="label" w="100%" colorPalette="blue" cursor="pointer">
                  Choose artifact
                  <input hidden type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event) => void handleUpload(event.currentTarget.files)} />
                </Button>
              </Box>

              <Box bg="white" border="1px solid" borderColor="gray.200" p={5} borderRadius="md">
                <Heading size="sm" mb={4}>Pilot Queue</Heading>
                <VStack align="stretch" gap={2}>
                  {artifacts.map((artifact) => (
                    <Button
                      key={artifact.artifact_id}
                      variant={selectedArtifact?.artifact_id === artifact.artifact_id ? "solid" : "outline"}
                      justifyContent="start"
                      onClick={() => {
                        setSelectedArtifact(artifact);
                        setPages([]);
                        setSelectedPageId(null);
                      }}
                    >
                      <Text truncate>{artifact.original_filename}</Text>
                    </Button>
                  ))}
                  {artifacts.length === 0 && <Text color="gray.500" fontSize="sm">No artifacts yet.</Text>}
                </VStack>
              </Box>

              <FeedbackBox value={feedback} saved={feedbackSaved} onChange={setFeedback} onSave={() => void handleSaveFeedback()} />
            </VStack>

            <Box className="ocrsp-workspace" gridColumn={{ base: "auto", lg: "span 2" }}>
              {!selectedArtifact ? (
                <EmptyState />
              ) : (
                <VStack align="stretch" gap={4}>
                  <ArtifactSummary artifact={selectedArtifact} pages={pages} lastRefreshedAt={lastRefreshedAt} polling={shouldPoll} onRunLocal={() => void handleRunLocal()} />
                  {pages.length === 0 ? (
                    <ProcessingState artifact={selectedArtifact} onRefresh={() => void refreshSelected()} />
                  ) : (
                    <SimpleGrid className="ocrsp-review-grid" columns={{ base: 1, xl: 2 }} gap={4}>
                      <Box bg="white" border="1px solid" borderColor="gray.200" p={4} borderRadius="md">
                        <HStack mb={3} justify="space-between">
                          <Heading size="sm">Original Page</Heading>
                          <NativeSelect.Root w="140px">
                            <NativeSelect.Field value={selectedPage?.page_id ?? ""} onChange={(event) => setSelectedPageId(event.currentTarget.value)}>
                              {pages.map((page) => <option key={page.page_id} value={page.page_id}>Page {page.page_number}</option>)}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </HStack>
                        {selectedPage && <PreviewFrame page={selectedPage} artifact={selectedArtifact} />}
                      </Box>

                      <Box bg="white" border="1px solid" borderColor="gray.200" p={4} borderRadius="md">
                        <HStack mb={3} justify="space-between" align="center">
                          <Heading size="sm">Recognized Text</Heading>
                          <AttemptPicker attempts={selectedPage?.attempts ?? []} value={selectedAttemptId} onChange={setSelectedAttemptId} />
                        </HStack>
                        <Textarea minH="360px" value={workingText} onChange={(event) => setWorkingText(event.currentTarget.value)} />

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mt={4}>
                          <NativeSelect.Root>
                            <NativeSelect.Field value={qualityRating ?? ""} onChange={(event) => setQualityRating(Number(event.currentTarget.value))}>
                              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>Quality {value} / 5</option>)}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                          <NativeSelect.Root>
                            <NativeSelect.Field value={correctionEffort} onChange={(event) => setCorrectionEffort(event.currentTarget.value as OcrCorrectionEffort)}>
                              {effortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </SimpleGrid>

                        <Textarea mt={3} placeholder="Evaluation notes" value={notes} onChange={(event) => setNotes(event.currentTarget.value)} />
                        <Textarea mt={3} placeholder="Search summary if unreadable" value={searchSummary} onChange={(event) => setSearchSummary(event.currentTarget.value)} />

                        <HStack mt={4} gap={2} flexWrap="wrap">
                          <Button colorPalette="green" onClick={() => void handleSaveEvaluation(selectedAttempt?.provider === "cloud" ? "accepted_cloud" : "accepted_local")}>Accept Text</Button>
                          <Button colorPalette="blue" onClick={() => void handleSaveEvaluation(selectedAttempt?.provider === "cloud" ? "corrected_cloud" : "corrected_local")}>Accept Corrected Text</Button>
                          <Button colorPalette="purple" onClick={() => void handleShapeRecipe()} disabled={!workingText.trim()}>Shape as Recipe</Button>
                          <Button variant="outline" disabled={cloudBlocked} onClick={() => void handleCloud()}>Send This Page to Cloud</Button>
                          <Button variant="outline" colorPalette="red" onClick={() => void handleSaveEvaluation("unreadable")}>Mark Unreadable</Button>
                        </HStack>
                        {cloudBlocked && <Text mt={3} color="orange.700" fontSize="sm">Cloud escalation is disabled because privacy sensitivity is complete.</Text>}
                        <RecipeShapePanel shape={shapes.find((item) => item.shape_id === "food_service.recipe") ?? null} attempt={latestShapingAttempt} />
                      </Box>
                    </SimpleGrid>
                  )}
                </VStack>
              )}
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}

function ArtifactSummary({
  artifact,
  pages,
  lastRefreshedAt,
  polling,
  onRunLocal,
}: {
  artifact: OcrSpikeArtifact;
  pages: OcrSpikePage[];
  lastRefreshedAt: Date | null;
  polling: boolean;
  onRunLocal: () => void;
}) {
  const attempts = pages.flatMap((page) => page.attempts.map((attempt) => ({ ...attempt, pageNumber: page.page_number })));
  return (
    <Flex className="ocrsp-artifact-summary" bg="white" border="1px solid" borderColor="gray.200" p={5} borderRadius="md" justify="space-between" gap={4} align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }}>
      <Box>
        <Heading size="md">{artifact.original_filename}</Heading>
        <HStack mt={2} gap={2} flexWrap="wrap">
          <Badge>{artifact.status}</Badge>
          <Badge colorPalette={artifact.privacy_sensitivity === "complete" ? "red" : "blue"}>{artifact.privacy_sensitivity} privacy</Badge>
          <Text color="gray.600" fontSize="sm">{artifact.page_count ?? "?"} page(s)</Text>
          {polling && <HStack gap={1}><Spinner size="xs" /><Text color="gray.600" fontSize="sm">Refreshing</Text></HStack>}
        </HStack>
        {attempts.length > 0 && (
          <HStack mt={3} gap={2} flexWrap="wrap">
            {attempts.map((attempt) => (
              <Badge key={attempt.attempt_id} colorPalette={statusColor(attempt.status)}>
                Page {attempt.pageNumber} · {attempt.engine_name || attempt.provider} · {attempt.status}
              </Badge>
            ))}
          </HStack>
        )}
        {lastRefreshedAt && <Text color="gray.500" fontSize="xs" mt={2}>Last checked {lastRefreshedAt.toLocaleTimeString()}</Text>}
      </Box>
      <Button colorPalette="blue" onClick={onRunLocal}>Run Local Recognition</Button>
    </Flex>
  );
}

function statusColor(status: OcrSpikeAttempt["status"]) {
  if (status === "complete") return "green";
  if (status === "failed") return "red";
  return "yellow";
}

function shapeStatusColor(status: OcrSpikeShapingAttempt["status"]) {
  if (status === "complete") return "green";
  if (status === "failed") return "red";
  return "yellow";
}

function ProcessingState({ artifact, onRefresh }: { artifact: OcrSpikeArtifact; onRefresh: () => void }) {
  return (
    <Box className="ocrsp-processing" bg="white" border="1px solid" borderColor="gray.200" p={8} borderRadius="md">
      <Heading size="sm" mb={3}>Processing</Heading>
      <Text color="gray.600" mb={5}>Current status: {artifact.status}. This screen checks for new pages and recognition attempts automatically.</Text>
      <Button onClick={onRefresh}>Refresh Results</Button>
    </Box>
  );
}

function PreviewFrame({ page, artifact }: { page: OcrSpikePage; artifact: OcrSpikeArtifact }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let nextUrl: string | null = null;
    setObjectUrl(null);
    setPreviewError(null);
    void fetchOcrSpikePageFile(page.page_id)
      .then((blob) => {
        if (revoked) return;
        nextUrl = URL.createObjectURL(blob);
        setObjectUrl(nextUrl);
      })
      .catch(() => {
        if (!revoked) setPreviewError("Could not load the page preview.");
      });
    return () => {
      revoked = true;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [page.page_id]);

  if (previewError) {
    return (
      <Box border="1px solid" borderColor="red.100" bg="red.50" p={4}>
        <Text color="red.700" fontSize="sm">{previewError}</Text>
      </Box>
    );
  }

  if (!objectUrl) {
    return (
      <Box border="1px solid" borderColor="gray.100" h="240px" display="grid" placeItems="center">
        <HStack><Spinner size="sm" /><Text fontSize="sm" color="gray.600">Loading preview</Text></HStack>
      </Box>
    );
  }

  const previewContentType = page.image_content_type || artifact.content_type;
  if (previewContentType.startsWith("image/")) {
    return (
      <Box border="1px solid" borderColor="gray.100" maxH="560px" overflow="auto">
        <Image
          src={objectUrl}
          alt={`Page ${page.page_number}`}
          width={960}
          height={720}
          unoptimized
          style={{ width: "100%", height: "auto", maxHeight: "560px", objectFit: "contain" }}
        />
      </Box>
    );
  }
  return (
    <Box border="1px solid" borderColor="gray.100" h="560px" overflow="hidden">
      <iframe src={objectUrl} title={`Page ${page.page_number}`} style={{ width: "100%", height: "560px", border: 0 }} />
    </Box>
  );
}

function AttemptPicker({ attempts, value, onChange }: { attempts: OcrSpikeAttempt[]; value: string | null; onChange: (value: string) => void }) {
  return (
    <NativeSelect.Root w="220px">
      <NativeSelect.Field value={value ?? attempts[0]?.attempt_id ?? ""} onChange={(event) => onChange(event.currentTarget.value)}>
        {attempts.map((attempt) => (
          <option key={attempt.attempt_id} value={attempt.attempt_id}>
            {attemptLabel(attempt)}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

function attemptLabel(attempt: OcrSpikeAttempt) {
  const engine = attempt.engine_name || attempt.provider;
  const confidence = attempt.confidence_summary.overall;
  const confidenceLabel = typeof confidence === "number" ? ` · ${Math.round(confidence * 100)}%` : "";
  return `${engine} · ${attempt.status}${confidenceLabel}`;
}

function RecipeShapePanel({ shape, attempt }: { shape: OcrSpikeShape | null; attempt: OcrSpikeShapingAttempt | null }) {
  return (
    <Box className="ocrsp-shape-panel" mt={5} borderTop="1px solid" borderColor="gray.200" pt={4}>
      <HStack justify="space-between" align="start" mb={3} gap={3}>
        <Box>
          <Heading size="sm">Recipe Shape</Heading>
          <Text color="gray.600" fontSize="sm" mt={1}>
            {shape ? `${shape.name} · ${shape.shape_id}@${shape.shape_version}` : "food_service.recipe@0.1.0"}
          </Text>
        </Box>
        {attempt && <Badge colorPalette={shapeStatusColor(attempt.status)}>{attempt.status}</Badge>}
      </HStack>

      {!attempt ? (
        <Text color="gray.600" fontSize="sm">Use reviewed text above, then shape it into the food-service recipe contract.</Text>
      ) : attempt.status === "processing" ? (
        <HStack color="gray.600"><Spinner size="sm" /><Text fontSize="sm">Shaping with local model…</Text></HStack>
      ) : (
        <VStack align="stretch" gap={3}>
          <HStack gap={2} flexWrap="wrap">
            <Badge>{attempt.model_name || "local model"}</Badge>
            <Badge>{attempt.processing_time_ms ? `${Math.round(attempt.processing_time_ms / 1000)}s` : "runtime pending"}</Badge>
            {attempt.validation_errors.length > 0 && <Badge colorPalette="red">{attempt.validation_errors.length} validation issue(s)</Badge>}
          </HStack>
          {attempt.error_message && <Box bg="red.50" border="1px solid" borderColor="red.200" p={3}><Text color="red.700" fontSize="sm">{attempt.error_message}</Text></Box>}
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={3}>
            <Box>
              <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" mb={2}>Markdown</Text>
              <Box as="pre" bg="gray.950" color="gray.50" p={3} borderRadius="md" maxH="340px" overflow="auto" fontSize="12px" whiteSpace="pre-wrap">
                {attempt.output_markdown || "No Markdown returned."}
              </Box>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" mb={2}>JSON</Text>
              <Box as="pre" bg="gray.950" color="gray.50" p={3} borderRadius="md" maxH="340px" overflow="auto" fontSize="12px" whiteSpace="pre-wrap">
                {JSON.stringify(attempt.output_json || {}, null, 2)}
              </Box>
            </Box>
          </SimpleGrid>
        </VStack>
      )}
    </Box>
  );
}

function FeedbackBox({ value, saved, onChange, onSave }: { value: string; saved: boolean; onChange: (value: string) => void; onSave: () => void }) {
  return (
    <Box className="ocrsp-feedback" bg="white" border="1px solid" borderColor="gray.200" p={5} borderRadius="md">
      <Heading size="sm" mb={3}>How can we improve this screen?</Heading>
      <Textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder="Workflow, copy, layout, missing controls…" />
      <HStack mt={3} justify="space-between">
        <Button size="sm" onClick={onSave}>Save Feedback</Button>
        {saved && <Text color="green.700" fontSize="sm">Saved</Text>}
      </HStack>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box className="ocrsp-empty" bg="white" border="1px solid" borderColor="gray.200" p={8} borderRadius="md">
      <Heading size="md" mb={3}>Start with an artifact.</Heading>
      <Text color="gray.600">Choose a PDF or image, set its privacy sensitivity, and run local recognition.</Text>
    </Box>
  );
}
