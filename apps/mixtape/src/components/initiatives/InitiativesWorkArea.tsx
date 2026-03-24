"use client";

// components/initiatives/InitiativesWorkArea.tsx
//
// Top-level work area for Initiatives, wired into GroupWorkArea via section="initiatives-landing".
// Three views: list → initiative detail → session detail.

import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Input,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  IconArrowLeft,
  IconBrain,
  IconChevronRight,
  IconClipboardText,
  IconDeviceFloppy,
  IconLayoutGrid,
  IconList,
  IconMoodSpark,
  IconNote,
  IconPlus,
  IconRoute,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useGroupInitiatives } from "@mixtape/api/hooks/initiatives/useGroupInitiatives";
import { useInitiative } from "@mixtape/api/hooks/initiatives/useInitiative";
import { useSessionExchange } from "@mixtape/api/hooks/initiatives/useSessionExchange";
import { routeArtifactToPuddlejump } from "@mixtape/api/clients/initiatives/initiativesApi";
import type {
  ArtifactResponse,
  InitiativeResponse,
  SessionDistillation,
  SessionResponse,
} from "@mixtape/api/clients/initiatives/initiativesApi";

// ============================================================================
// Constants
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  active: "green",
  simmering: "orange",
  paused: "gray",
  resolved: "blue",
  archived: "purple",
};

const VIEW_MODE_KEY = "initiatives_view_mode";
type ViewMode = "list" | "landscape";

const ARTIFACT_KIND_LABELS: Record<string, string> = {
  document: "Document",
  decision: "Decision",
  action: "Action",
  question: "Question",
  annotation: "Annotation",
};

const SESSION_INTENT_LABELS: Record<string, string> = {
  open_inquiry: "Open Inquiry",
  focused_review: "Focused Review",
  decision_session: "Decision Session",
  retrospective: "Retrospective",
  other: "Other",
};

const getSessionDistillation = (
  distillation: SessionResponse["distillation"]
): SessionDistillation => distillation ?? {};

// ============================================================================
// Root — view router
// ============================================================================

interface InitiativesWorkAreaProps {
  groupSlug: string;
}

type View =
  | { kind: "list" }
  | { kind: "detail"; initiativeId: string }
  | { kind: "session"; initiativeId: string; sessionId: string };

export default function InitiativesWorkArea({ groupSlug }: InitiativesWorkAreaProps) {
  const [view, setView] = useState<View>({ kind: "list" });

  if (view.kind === "list") {
    return (
      <InitiativeListView
        groupSlug={groupSlug}
        onOpen={(id) => setView({ kind: "detail", initiativeId: id })}
      />
    );
  }

  if (view.kind === "detail") {
    return (
      <InitiativeDetailView
        groupSlug={groupSlug}
        initiativeId={view.initiativeId}
        onBack={() => setView({ kind: "list" })}
        onOpenSession={(sId) =>
          setView({ kind: "session", initiativeId: view.initiativeId, sessionId: sId })
        }
      />
    );
  }

  // view.kind === "session"
  return (
    <SessionDetailView
      groupSlug={groupSlug}
      initiativeId={view.initiativeId}
      sessionId={view.sessionId}
      onBack={() =>
        setView({ kind: "detail", initiativeId: view.initiativeId })
      }
    />
  );
}

// ============================================================================
// InitiativeListView
// ============================================================================

interface InitiativeListViewProps {
  groupSlug: string;
  onOpen: (id: string) => void;
}

function InitiativeListView({ groupSlug, onOpen }: InitiativeListViewProps) {
  const { initiatives, isLoading, error, createInitiative } =
    useGroupInitiatives(groupSlug);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", direction: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || "list";
    }
    return "list";
  });

  const mutedText = useColorModeValue("gray.600", "gray.400");

  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  const sorted = [...initiatives].sort(
    (a, b) => b.momentum_score - a.momentum_score
  );

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setFormError("Title is required");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const created = await createInitiative({
        title: form.title.trim(),
        direction: form.direction.trim(),
      });
      setShowCreate(false);
      setForm({ title: "", direction: "" });
      onOpen(created.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="lg" />
        <Text mt={4} color={mutedText}>
          Loading initiatives…
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{error}</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      {/* Header */}
      <HStack justify="space-between">
        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <IconBrain size={24} />
            <Heading size="lg">Initiatives</Heading>
          </HStack>
          <Text fontSize="sm" color={mutedText}>
            AI-assisted inquiry sessions for structured group thinking
          </Text>
        </VStack>
        <HStack gap={2}>
          <HStack gap={0} borderWidth="1px" borderRadius="md" overflow="hidden">
            <Button
              size="sm"
              variant={viewMode === "list" ? "solid" : "ghost"}
              colorPalette={viewMode === "list" ? "blue" : "gray"}
              borderRadius={0}
              onClick={() => toggleViewMode("list")}
              title="List view"
            >
              <IconList size={16} />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "landscape" ? "solid" : "ghost"}
              colorPalette={viewMode === "landscape" ? "blue" : "gray"}
              borderRadius={0}
              onClick={() => toggleViewMode("landscape")}
              title="Landscape view"
            >
              <IconLayoutGrid size={16} />
            </Button>
          </HStack>
          <Button
            size="sm"
            colorPalette="green"
            onClick={() => setShowCreate(!showCreate)}
          >
            <IconPlus size={16} />
            New Initiative
          </Button>
        </HStack>
      </HStack>

      {/* Create form */}
      {showCreate && (
        <Card.Root>
          <Card.Header>
            <Heading size="md">New Initiative</Heading>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              {formError && (
                <Alert.Root status="error">
                  <Alert.Indicator />
                  <Alert.Title>{formError}</Alert.Title>
                </Alert.Root>
              )}
              <Field.Root>
                <Field.Label>Title</Field.Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="What are we working through?"
                  maxLength={200}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Initial Direction (optional)</Field.Label>
                <Textarea
                  value={form.direction}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, direction: e.target.value }))
                  }
                  placeholder="What's the rough starting point or goal?"
                  rows={3}
                  maxLength={1000}
                />
                <Field.HelperText>
                  This becomes the seed for the rolling summary.
                </Field.HelperText>
              </Field.Root>
            </VStack>
          </Card.Body>
          <Card.Footer>
            <HStack justify="end" gap={2}>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  setFormError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                colorPalette="green"
                loading={creating}
                disabled={!form.title.trim()}
                onClick={handleCreate}
              >
                <IconDeviceFloppy size={16} />
                Create Initiative
              </Button>
            </HStack>
          </Card.Footer>
        </Card.Root>
      )}

      {/* Empty state / grid */}
      {sorted.length === 0 ? (
        <Box textAlign="center" py={16}>
          <IconBrain size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <Heading size="md" mt={4} color="gray.500">
            No initiatives yet
          </Heading>
          <Text color="gray.400" mt={2}>
            Start an initiative to begin structured AI-assisted inquiry.
          </Text>
        </Box>
      ) : viewMode === "landscape" ? (
        <InitiativeLandscapeView initiatives={sorted} onOpen={onOpen} />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {sorted.map((ini) => (
            <InitiativeCard key={ini.id} initiative={ini} onOpen={onOpen} />
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
}

// ============================================================================
// InitiativeCard
// ============================================================================

function MomentumBar({ score }: { score: number }) {
  // Cap display at 200; bar width is proportional (clamped 0–100%)
  const pct = Math.min(100, (score / 200) * 100);
  const color = score === 0 ? "gray.200" : score < 20 ? "blue.200" : score < 80 ? "blue.400" : "blue.600";
  return (
    <Box w="100%">
      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" color="gray.500">Momentum</Text>
        <Text fontSize="xs" fontWeight="medium" color="gray.500">{score.toFixed(0)}</Text>
      </HStack>
      <Box w="100%" h="4px" bg="gray.100" borderRadius="full" overflow="hidden">
        <Box w={`${pct}%`} h="100%" bg={color} borderRadius="full" />
      </Box>
    </Box>
  );
}

function InitiativeCard({
  initiative,
  onOpen,
}: {
  initiative: InitiativeResponse;
  onOpen: (id: string) => void;
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  return (
    <Card.Root
      bg={cardBg}
      cursor="pointer"
      _hover={{ shadow: "md" }}
      onClick={() => onOpen(initiative.id)}
    >
      <Card.Body>
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <Badge
              colorPalette={STATUS_COLORS[initiative.status] || "gray"}
              size="sm"
            >
              {initiative.status}
            </Badge>
            <IconChevronRight size={16} />
          </HStack>
          <Heading size="sm">{initiative.title}</Heading>
          {initiative.direction && (
            <Text fontSize="sm" color={mutedText} lineClamp={2}>
              {initiative.direction}
            </Text>
          )}
          {initiative.rolling_summary?.where_we_are_now && (
            <Text
              fontSize="xs"
              color={mutedText}
              lineClamp={2}
              fontStyle="italic"
            >
              "{initiative.rolling_summary.where_we_are_now}"
            </Text>
          )}
          <MomentumBar score={initiative.momentum_score} />
          <Text fontSize="xs" color={mutedText}>
            {initiative.last_session_at
              ? `Last session: ${new Date(initiative.last_session_at).toLocaleDateString()}`
              : "No sessions yet"}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================================================
// InitiativeLandscapeView (v0 — simplified visual mode)
// ============================================================================

function InitiativeLandscapeView({
  initiatives,
  onOpen,
}: {
  initiatives: InitiativeResponse[];
  onOpen: (id: string) => void;
}) {
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const maxScore = Math.max(...initiatives.map((i) => i.momentum_score), 1);

  return (
    <VStack align="stretch" gap={2}>
      {initiatives.map((ini) => {
        const pct = Math.max(4, (ini.momentum_score / maxScore) * 100);
        const color = STATUS_COLORS[ini.status] || "gray";
        return (
          <Box
            key={ini.id}
            cursor="pointer"
            onClick={() => onOpen(ini.id)}
            _hover={{ opacity: 0.85 }}
          >
            <HStack gap={3} mb={1}>
              <Badge colorPalette={color} size="sm" minW="80px" textAlign="center">
                {ini.status}
              </Badge>
              <Text fontSize="sm" fontWeight="medium" flex={1} lineClamp={1}>
                {ini.title}
              </Text>
              <Text fontSize="xs" color={mutedText}>
                {ini.momentum_score.toFixed(0)}
              </Text>
            </HStack>
            <Box
              w={`${pct}%`}
              h="6px"
              bg={`${color}.400`}
              borderRadius="full"
              transition="width 0.3s ease"
            />
          </Box>
        );
      })}
    </VStack>
  );
}

// ============================================================================
// InitiativeDetailView
// ============================================================================

interface InitiativeDetailViewProps {
  groupSlug: string;
  initiativeId: string;
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
}

function InitiativeDetailView({
  groupSlug,
  initiativeId,
  onBack,
  onOpenSession,
}: InitiativeDetailViewProps) {
  const { initiative, sessions, artifacts, isLoading, error, createSession, createArtifact } =
    useInitiative(groupSlug, initiativeId);

  const [creatingSession, setCreatingSession] = useState(false);
  const [showArtifactForm, setShowArtifactForm] = useState(false);

  const mutedText = useColorModeValue("gray.600", "gray.400");

  const handleNewSession = async () => {
    setCreatingSession(true);
    try {
      const s = await createSession({
        intent: "open_inquiry",
        capture_mode: "typed",
      });
      onOpenSession(s.id);
    } catch {
      // error surfaced via hook state
    } finally {
      setCreatingSession(false);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !initiative) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{error || "Initiative not found"}</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      {/* Back nav */}
      <HStack>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} />
          Initiatives
        </Button>
      </HStack>

      {/* Header */}
      <VStack align="start" gap={2}>
        <Badge colorPalette={STATUS_COLORS[initiative.status] || "gray"}>
          {initiative.status}
        </Badge>
        <Heading size="lg">{initiative.title}</Heading>
        {initiative.direction && (
          <Text color={mutedText}>{initiative.direction}</Text>
        )}
      </VStack>

      {/* Rolling Summary */}
      {initiative.rolling_summary && (
        <RollingSummaryPanel summary={initiative.rolling_summary} />
      )}

      <Separator />

      {/* Sessions */}
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <Heading size="md">Sessions</Heading>
          <Button
            size="sm"
            colorPalette="green"
            loading={creatingSession}
            onClick={handleNewSession}
          >
            <IconPlus size={16} />
            New Session
          </Button>
        </HStack>
        {sessions.length === 0 ? (
          <Box py={6} textAlign="center">
            <Text color={mutedText} fontSize="sm">
              No sessions yet. Start a session to begin a working conversation.
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={2}>
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} onOpen={onOpenSession} />
            ))}
          </VStack>
        )}
      </VStack>

      <Separator />

      {/* Artifacts */}
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <HStack gap={2}>
            <Heading size="md">Artifacts</Heading>
            <Badge variant="outline" size="sm">
              {artifacts.length}
            </Badge>
          </HStack>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowArtifactForm(!showArtifactForm)}
          >
            <IconNote size={16} />
            Direct Annotation
          </Button>
        </HStack>

        {showArtifactForm && (
          <DirectAnnotationForm
            onSubmit={async (payload) => {
              await createArtifact({ ...payload, session: null });
              setShowArtifactForm(false);
            }}
            onCancel={() => setShowArtifactForm(false)}
          />
        )}

        {artifacts.length === 0 && !showArtifactForm ? (
          <Box py={4} textAlign="center">
            <Text color={mutedText} fontSize="sm">
              No artifacts yet. Add a direct annotation or extract one from a
              session.
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={2}>
            {artifacts.map((a) => (
              <ArtifactRow
                key={a.id}
                artifact={a}
                groupSlug={groupSlug}
                initiativeId={initiativeId}
              />
            ))}
          </VStack>
        )}
      </VStack>
    </VStack>
  );
}

// ============================================================================
// RollingSummaryPanel
// ============================================================================

function RollingSummaryPanel({
  summary,
}: {
  summary: NonNullable<InitiativeResponse["rolling_summary"]>;
}) {
  const bgColor = useColorModeValue("blue.50", "blue.900");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  return (
    <Card.Root bg={bgColor}>
      <Card.Header>
        <HStack gap={2}>
          <IconMoodSpark size={18} />
          <Heading size="sm">Rolling Summary</Heading>
        </HStack>
      </Card.Header>
      <Card.Body>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {summary.current_direction && (
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                color={mutedText}
                mb={1}
              >
                Current Direction
              </Text>
              <Text fontSize="sm">{summary.current_direction}</Text>
            </Box>
          )}
          {summary.where_we_are_now && (
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                color={mutedText}
                mb={1}
              >
                Where We Are Now
              </Text>
              <Text fontSize="sm">{summary.where_we_are_now}</Text>
            </Box>
          )}
          {summary.key_decisions?.length > 0 && (
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                color={mutedText}
                mb={1}
              >
                Key Decisions
              </Text>
              <VStack align="start" gap={1}>
                {summary.key_decisions.map((d, i) => (
                  <Text key={i} fontSize="sm">
                    • {d}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}
          {summary.open_questions?.length > 0 && (
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                color={mutedText}
                mb={1}
              >
                Open Questions
              </Text>
              <VStack align="start" gap={1}>
                {summary.open_questions.map((q, i) => (
                  <Text key={i} fontSize="sm">
                    • {q}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================================================
// SessionRow
// ============================================================================

function SessionRow({
  session,
  onOpen,
}: {
  session: SessionResponse;
  onOpen: (id: string) => void;
}) {
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const isOpen = !session.ended_at;

  return (
    <Card.Root
      cursor="pointer"
      _hover={{ shadow: "sm" }}
      onClick={() => onOpen(session.id)}
    >
      <Card.Body py={3}>
        <HStack justify="space-between">
          <HStack gap={3}>
            <Badge
              colorPalette={isOpen ? "green" : "gray"}
              variant={isOpen ? "solid" : "outline"}
              size="sm"
            >
              {isOpen ? "open" : "closed"}
            </Badge>
            <VStack align="start" gap={0}>
              <Text fontWeight="medium" fontSize="sm">
                {SESSION_INTENT_LABELS[session.intent] || session.intent}
              </Text>
              <Text fontSize="xs" color={mutedText}>
                {new Date(session.created_at).toLocaleDateString()} ·{" "}
                {session.raw_transcript.length} turns · {session.artifact_count}{" "}
                artifacts
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2}>
            {session.distillation_state !== "none" && (
              <Badge colorPalette="purple" size="sm" variant="outline">
                {session.distillation_state}
              </Badge>
            )}
            <IconChevronRight size={16} />
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================================================
// DirectAnnotationForm
// ============================================================================

interface DirectAnnotationPayload {
  kind: ArtifactResponse["kind"];
  title: string;
  body: string;
  note?: string;
}

interface DirectAnnotationFormProps {
  onSubmit: (payload: DirectAnnotationPayload) => Promise<void>;
  onCancel: () => void;
}

function DirectAnnotationForm({
  onSubmit,
  onCancel,
}: DirectAnnotationFormProps) {
  const [form, setForm] = useState<DirectAnnotationPayload>({
    kind: "annotation",
    title: "",
    body: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <Card.Root borderColor="orange.300" borderWidth="1px">
      <Card.Header>
        <Heading size="sm">Direct Annotation</Heading>
        <Text fontSize="xs" color="orange.600" mt={1}>
          Artifacts added directly (not from a session) are flagged for async
          quality review.
        </Text>
      </Card.Header>
      <Card.Body>
        <VStack gap={4} align="stretch">
          {error && (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Title>{error}</Alert.Title>
            </Alert.Root>
          )}
          <Field.Root>
            <Field.Label>Kind</Field.Label>
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  kind: e.target.value as ArtifactResponse["kind"],
                }))
              }
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                width: "100%",
              }}
            >
              {Object.entries(ARTIFACT_KIND_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field.Root>
          <Field.Root>
            <Field.Label>Title</Field.Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Short label for this artifact"
              maxLength={200}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Body</Field.Label>
            <Textarea
              value={form.body}
              onChange={(e) =>
                setForm((p) => ({ ...p, body: e.target.value }))
              }
              placeholder="The content of this artifact"
              rows={5}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Note (optional)</Field.Label>
            <Input
              value={form.note ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, note: e.target.value }))
              }
              placeholder="Any context or meta-note"
              maxLength={500}
            />
          </Field.Root>
        </VStack>
      </Card.Body>
      <Card.Footer>
        <HStack justify="end" gap={2}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button colorPalette="orange" loading={saving} onClick={handleSubmit}>
            <IconNote size={16} />
            Save Annotation
          </Button>
        </HStack>
      </Card.Footer>
    </Card.Root>
  );
}

// ============================================================================
// ArtifactRow
// ============================================================================

function ArtifactRow({
  artifact,
  groupSlug,
  initiativeId,
}: {
  artifact: ArtifactResponse;
  groupSlug: string;
  initiativeId: string;
}) {
  const [routing, setRouting] = useState(false);
  const [routed, setRouted] = useState(artifact.puddlejump_routed);
  const [candidateDoc, setCandidateDoc] = useState<string | null>(null);
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const candidateBg = useColorModeValue("teal.50", "teal.900");

  const handleRoute = async () => {
    setRouting(true);
    try {
      const result = await routeArtifactToPuddlejump(
        groupSlug,
        initiativeId,
        artifact.id
      );
      setRouted(true);
      setCandidateDoc(result.document);
    } catch {
      // silent for now
    } finally {
      setRouting(false);
    }
  };

  return (
    <Card.Root>
      <Card.Body py={3}>
        <VStack align="stretch" gap={2}>
          <HStack justify="space-between">
            <HStack gap={2} flexWrap="wrap">
              <Badge colorPalette="purple" size="sm">
                {ARTIFACT_KIND_LABELS[artifact.kind] || artifact.kind}
              </Badge>
              {artifact.is_direct_annotation && (
                <Badge colorPalette="orange" variant="outline" size="sm">
                  annotation
                </Badge>
              )}
              {artifact.quality_scan_state === "complete" &&
                artifact.quality_scan_result && (
                  <Badge
                    colorPalette={
                      artifact.quality_scan_result?.quality === "low"
                        ? "red"
                        : "green"
                    }
                    variant="outline"
                    size="sm"
                  >
                    {artifact.quality_scan_result?.quality || "reviewed"}
                  </Badge>
                )}
              {artifact.quality_scan_state === "pending" && (
                <Badge colorPalette="gray" variant="outline" size="sm">
                  pending review
                </Badge>
              )}
            </HStack>
            {!routed ? (
              <Button
                size="xs"
                variant="outline"
                loading={routing}
                onClick={handleRoute}
              >
                <IconRoute size={14} />
                Route to Puddlejump
              </Button>
            ) : (
              <Badge colorPalette="teal" variant="outline" size="sm">
                routed
              </Badge>
            )}
          </HStack>
          <Text fontWeight="medium" fontSize="sm">
            {artifact.title}
          </Text>
          <Text fontSize="sm" color={mutedText} lineClamp={3}>
            {artifact.body}
          </Text>
          {candidateDoc && (
            <Box
              mt={2}
              p={3}
              bg={candidateBg}
              borderRadius="md"
              borderColor="teal.200"
              borderWidth="1px"
            >
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="teal.700"
                mb={1}
              >
                Puddlejump Candidate Doc
              </Text>
              <Text
                fontSize="xs"
                fontFamily="mono"
                whiteSpace="pre-wrap"
                color="teal.900"
              >
                {candidateDoc}
              </Text>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================================================
// SessionDetailView
// ============================================================================

interface SessionDetailViewProps {
  groupSlug: string;
  initiativeId: string;
  sessionId: string;
  onBack: () => void;
}

function SessionDetailView({
  groupSlug,
  initiativeId,
  sessionId,
  onBack,
}: SessionDetailViewProps) {
  const {
    sessions,
    artifacts,
    isLoading,
    error,
    closeSession,
    proposeDistillation,
    commitDistillation,
  } = useInitiative(groupSlug, initiativeId);

  const {
    localTurns,
    message,
    setMessage,
    isStreaming,
    error: exchangeError,
    sendMessage,
    clearError: clearExchangeError,
  } = useSessionExchange(groupSlug, initiativeId, sessionId);

  const session = sessions.find((s) => s.id === sessionId);
  const sessionArtifacts = artifacts.filter((a) => a.session === sessionId);

  const [proposing, setProposing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [commitForm, setCommitForm] = useState({
    decisions: "",
    open_questions: "",
    actions: "",
    notes: "",
  });
  const [closing, setClosing] = useState(false);

  const mutedText = useColorModeValue("gray.600", "gray.400");
  const humanTurnBg = useColorModeValue("gray.50", "gray.700");
  const assistantTurnBg = useColorModeValue("blue.50", "blue.900");
  const streamingBg = useColorModeValue("purple.50", "purple.900");

  const handlePropose = async () => {
    setProposing(true);
    try {
      await proposeDistillation(sessionId);
    } finally {
      setProposing(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      await commitDistillation(sessionId, commitForm);
      setShowCommitForm(false);
    } finally {
      setCommitting(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await closeSession(sessionId);
    } finally {
      setClosing(false);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{error || "Session not found"}</Alert.Title>
      </Alert.Root>
    );
  }

  const isOpen = !session.ended_at;

  return (
    <VStack align="stretch" gap={6}>
      {/* Back nav */}
      <HStack>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} />
          Back to Initiative
        </Button>
      </HStack>

      {/* Header */}
      <HStack justify="space-between">
        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <Badge colorPalette={isOpen ? "green" : "gray"}>
              {isOpen ? "open" : "closed"}
            </Badge>
            <Heading size="md">
              {SESSION_INTENT_LABELS[session.intent] || session.intent}
            </Heading>
          </HStack>
          <Text fontSize="sm" color={mutedText}>
            {new Date(session.created_at).toLocaleDateString()} ·{" "}
            {session.raw_transcript.length} turns
          </Text>
        </VStack>
        {isOpen && (
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            loading={closing}
            onClick={handleClose}
          >
            <IconX size={16} />
            Close Session
          </Button>
        )}
      </HStack>

      {/* AI Exchange */}
      <VStack align="stretch" gap={3}>
        <HStack gap={2}>
          <IconBrain size={18} />
          <Heading size="sm">Session Exchange</Heading>
        </HStack>

        {/* Persisted transcript */}
        {session.raw_transcript.length > 0 && (
          <VStack align="stretch" gap={2}>
            {session.raw_transcript.map((turn, i) => (
              <Box
                key={i}
                p={3}
                borderRadius="md"
                bg={turn.speaker === "human" ? humanTurnBg : assistantTurnBg}
              >
                <HStack gap={2} mb={1}>
                  <Badge
                    size="sm"
                    colorPalette={turn.speaker === "human" ? "gray" : "blue"}
                  >
                    {turn.speaker === "human"
                      ? turn.username || "user"
                      : "assistant"}
                  </Badge>
                  <Text fontSize="xs" color={mutedText}>
                    {new Date(turn.timestamp).toLocaleTimeString()}
                  </Text>
                </HStack>
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {turn.text}
                </Text>
              </Box>
            ))}
          </VStack>
        )}

        {/* Live streaming turns */}
        {localTurns.length > 0 && (
          <VStack align="stretch" gap={2}>
            {localTurns.map((turn, i) => (
              <Box
                key={`live-${i}`}
                p={3}
                borderRadius="md"
                bg={turn.streaming ? streamingBg : turn.role === "user" ? humanTurnBg : assistantTurnBg}
              >
                <HStack gap={2} mb={1}>
                  <Badge
                    size="sm"
                    colorPalette={turn.role === "user" ? "gray" : "purple"}
                    variant={turn.streaming ? "solid" : "outline"}
                  >
                    {turn.role === "user" ? "you" : turn.streaming ? "thinking…" : "assistant"}
                  </Badge>
                </HStack>
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {turn.text}
                  {turn.streaming && <Text as="span" opacity={0.5}> ▌</Text>}
                </Text>
              </Box>
            ))}
          </VStack>
        )}

        {session.raw_transcript.length === 0 && localTurns.length === 0 && (
          <Box py={4} textAlign="center">
            <Text fontSize="sm" color={mutedText}>
              No turns yet. Send a message to start the conversation.
            </Text>
          </Box>
        )}

        {/* Exchange error */}
        {exchangeError && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>{exchangeError}</Alert.Title>
            <Button size="xs" variant="ghost" onClick={clearExchangeError} ml="auto">
              Dismiss
            </Button>
          </Alert.Root>
        )}

        {/* Input — only for open sessions */}
        {isOpen && (
          <HStack gap={2}>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask, reflect, or explore…"
              disabled={isStreaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              flex={1}
            />
            <Button
              colorPalette="purple"
              loading={isStreaming}
              disabled={!message.trim()}
              onClick={sendMessage}
            >
              <IconSend size={16} />
            </Button>
          </HStack>
        )}
      </VStack>

      <Separator />

      {/* Distillation */}
      <VStack align="stretch" gap={4}>
        <Heading size="sm">Distillation</Heading>

        {session.distillation_state === "none" && (
          <HStack align="center">
            <Button
              size="sm"
              colorPalette="purple"
              loading={proposing}
              onClick={handlePropose}
            >
              <IconClipboardText size={16} />
              Propose Distillation
            </Button>
            <Text fontSize="xs" color={mutedText}>
              Generates a structured summary of this session.
            </Text>
          </HStack>
        )}

        {session.distillation_state === "proposed" && session.distillation && (
          <Card.Root borderColor="purple.300" borderWidth="1px">
            <Card.Header>
              <HStack justify="space-between">
                <Heading size="sm">Proposed Distillation</Heading>
                <Button
                  size="sm"
                  colorPalette="purple"
                  onClick={() => {
                    const distillation = getSessionDistillation(session.distillation);
                    setCommitForm({
                      decisions: distillation.decisions ?? "",
                      open_questions: distillation.open_questions ?? "",
                      actions: distillation.actions ?? "",
                      notes: distillation.notes ?? "",
                    });
                    setShowCommitForm(true);
                  }}
                >
                  Curate &amp; Commit
                </Button>
              </HStack>
            </Card.Header>
            <Card.Body>
              <Text
                fontSize="sm"
                whiteSpace="pre-wrap"
                color={mutedText}
                fontFamily="mono"
              >
                {JSON.stringify(session.distillation, null, 2)}
              </Text>
            </Card.Body>
          </Card.Root>
        )}

        {session.distillation_state === "curated" && (
          <Badge colorPalette="purple" size="md">
            Distillation committed — rolling summary updated
          </Badge>
        )}

        {showCommitForm && (
          <Card.Root>
            <Card.Header>
              <Heading size="sm">Curate Distillation</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                {(
                  ["decisions", "open_questions", "actions", "notes"] as const
                ).map((field) => (
                  <Field.Root key={field}>
                    <Field.Label>
                      {field
                        .replace("_", " ")
                        .replace(/^\w/, (c) => c.toUpperCase())}
                    </Field.Label>
                    <Textarea
                      value={commitForm[field]}
                      onChange={(e) =>
                        setCommitForm((p) => ({
                          ...p,
                          [field]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </Field.Root>
                ))}
              </VStack>
            </Card.Body>
            <Card.Footer>
              <HStack justify="end" gap={2}>
                <Button
                  variant="ghost"
                  onClick={() => setShowCommitForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="purple"
                  loading={committing}
                  onClick={handleCommit}
                >
                  <IconSend size={16} />
                  Commit
                </Button>
              </HStack>
            </Card.Footer>
          </Card.Root>
        )}
      </VStack>

      {/* Session artifacts */}
      {sessionArtifacts.length > 0 && (
        <>
          <Separator />
          <VStack align="stretch" gap={3}>
            <Heading size="sm">
              Session Artifacts ({sessionArtifacts.length})
            </Heading>
            {sessionArtifacts.map((a) => (
              <Card.Root key={a.id}>
                <Card.Body py={3}>
                  <HStack gap={2} mb={1}>
                    <Badge colorPalette="purple" size="sm">
                      {ARTIFACT_KIND_LABELS[a.kind] || a.kind}
                    </Badge>
                  </HStack>
                  <Text fontWeight="medium" fontSize="sm">
                    {a.title}
                  </Text>
                  <Text fontSize="sm" color={mutedText} mt={1}>
                    {a.body}
                  </Text>
                </Card.Body>
              </Card.Root>
            ))}
          </VStack>
        </>
      )}
    </VStack>
  );
}
