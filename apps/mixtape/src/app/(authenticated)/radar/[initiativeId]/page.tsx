"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  Link,
  Skeleton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  useRadarInitiative,
  useUpdateRadarInitiative,
  useArchiveRadarInitiative,
  useRadarArtifacts,
  useCreateRadarDocLink,
  useImportRadarConversation,
  useDeleteRadarArtifact,
} from "@mixtape/api/hooks/radar";
import type { RadarInitiative, RadarInitiativeArtifact } from "@mixtape/api/clients/radar/radarApi";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Zone 1 — North Star (narrative)
// ---------------------------------------------------------------------------

function NarrativeZone({
  initiative,
  initiativeId,
}: {
  initiative: RadarInitiative;
  initiativeId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initiative.narrative);
  const { mutate: update, isPending } = useUpdateRadarInitiative(initiativeId);

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const bgColor = useColorModeValue("white", "gray.800");
  const zoneBg = useColorModeValue("gray.50", "gray.850");

  const handleBlur = () => {
    if (value !== initiative.narrative) {
      update({ narrative: value }, { onSuccess: () => setEditing(false) });
    } else {
      setEditing(false);
    }
  };

  return (
    <Box className="riw-narrative-zone">
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color={mutedColor}
        textTransform="uppercase"
        letterSpacing="wide"
        mb={2}
      >
        North Star
      </Text>
      {editing ? (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          rows={4}
          size="sm"
          autoFocus
          disabled={isPending}
          placeholder="Write a sentence or two about why this matters — a north star to orient all the work."
        />
      ) : (
        <Box
          className="riw-narrative-display"
          border="1px solid"
          borderColor={initiative.narrative ? borderColor : "transparent"}
          borderRadius="md"
          bg={initiative.narrative ? bgColor : "transparent"}
          p={initiative.narrative ? 3 : 0}
          cursor="text"
          onClick={() => {
            setValue(initiative.narrative);
            setEditing(true);
          }}
          minH="48px"
        >
          {initiative.narrative ? (
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {initiative.narrative}
            </Text>
          ) : (
            <Text fontSize="sm" color={mutedColor} fontStyle="italic">
              Write a sentence or two about why this matters — a north star to orient all the work.
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Zone 2 — Last Session
// ---------------------------------------------------------------------------

function LastSessionZone({
  initiative,
  initiativeId,
}: {
  initiative: RadarInitiative;
  initiativeId: string;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(initiative.last_session_note);
  const { mutate: update, isPending } = useUpdateRadarInitiative(initiativeId);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.800");

  const handleNoteBlur = () => {
    if (noteValue !== initiative.last_session_note) {
      update({ last_session_note: noteValue }, { onSuccess: () => setEditingNote(false) });
    } else {
      setEditingNote(false);
    }
  };

  const sessionDate = initiative.last_session_at ?? initiative.updated_at;

  return (
    <Box className="riw-session-zone">
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color={mutedColor}
        textTransform="uppercase"
        letterSpacing="wide"
        mb={2}
      >
        Last Session
      </Text>
      <Box
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        bg={bgColor}
        p={3}
      >
        <Text fontSize="xs" color={mutedColor} mb={2}>
          {formatDate(sessionDate)}
        </Text>
        {editingNote ? (
          <Textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value.slice(0, 500))}
            onBlur={handleNoteBlur}
            rows={3}
            size="sm"
            maxLength={500}
            autoFocus
            disabled={isPending}
            placeholder="Where we left off…"
          />
        ) : (
          <Box
            cursor="text"
            onClick={() => {
              setNoteValue(initiative.last_session_note);
              setEditingNote(true);
            }}
          >
            {initiative.last_session_note ? (
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {initiative.last_session_note}
              </Text>
            ) : (
              <Text fontSize="sm" color={mutedColor} fontStyle="italic">
                Click to add a note — where we left off…
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ArtifactRow
// ---------------------------------------------------------------------------

function ArtifactRow({
  artifact,
  initiativeId,
}: {
  artifact: RadarInitiativeArtifact;
  initiativeId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: deleteArtifact, isPending: deleting } = useDeleteRadarArtifact(initiativeId);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.800");

  const isDoc = artifact.artifact_type === "doc_link";

  return (
    <Box
      className="riw-artifact-row"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
      px={3}
      py={2}
    >
      <HStack justify="space-between" align="start" gap={2}>
        <HStack gap={2} flex={1} minW={0}>
          <Text fontSize="sm">{isDoc ? "📄" : "💬"}</Text>
          <Box flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
              {artifact.label}
            </Text>
            {isDoc && artifact.doc_path && (
              <Text fontSize="xs" color={mutedColor} lineClamp={1}>
                {artifact.doc_path}
              </Text>
            )}
            {!isDoc && (
              <HStack gap={2} mt={0.5}>
                <Badge size="sm" colorPalette="blue" variant="subtle">
                  {artifact.conversation_source || "import"}
                </Badge>
                <Text fontSize="xs" color={mutedColor}>
                  {formatDate(artifact.created_at)}
                </Text>
              </HStack>
            )}
          </Box>
        </HStack>

        <HStack gap={1} flexShrink={0}>
          {isDoc ? (
            <Link href={`/puddlejump/${artifact.doc_path}`} fontSize="xs" color={mutedColor}>
              Open
            </Link>
          ) : (
            <Button
              size="xs"
              variant="ghost"
              color={mutedColor}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Collapse" : "Expand"}
            </Button>
          )}
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={() => deleteArtifact(artifact.id)}
            disabled={deleting}
          >
            Remove
          </Button>
        </HStack>
      </HStack>

      {!isDoc && expanded && artifact.conversation_text && (
        <Box
          mt={3}
          pt={3}
          borderTop="1px solid"
          borderColor={borderColor}
          maxH="320px"
          overflowY="auto"
        >
          <Text fontSize="xs" whiteSpace="pre-wrap" color={mutedColor} fontFamily="mono">
            {artifact.conversation_text}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Zone 3 — Artifacts
// ---------------------------------------------------------------------------

function ArtifactsZone({ initiativeId }: { initiativeId: string }) {
  const { data: artifacts, isLoading } = useRadarArtifacts(initiativeId);
  const { mutate: addDocLink, isPending: addingDoc } = useCreateRadarDocLink(initiativeId);
  const { mutate: importConv, isPending: importing } = useImportRadarConversation(initiativeId);

  const [showDocForm, setShowDocForm] = useState(false);
  const [docLabel, setDocLabel] = useState("");
  const [docPath, setDocPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const handleAddDoc = () => {
    if (!docLabel.trim() || !docPath.trim()) return;
    addDocLink(
      { label: docLabel.trim(), doc_path: docPath.trim() },
      {
        onSuccess: () => {
          setDocLabel("");
          setDocPath("");
          setShowDocForm(false);
        },
      },
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importConv(file, {
      onSuccess: () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <Box className="riw-artifacts-zone">
      <HStack justify="space-between" mb={2}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color={mutedColor}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          Artifacts
        </Text>
        <HStack gap={2}>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={() => setShowDocForm((v) => !v)}
          >
            Link doc
          </Button>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            loading={importing}
          >
            Import conversation
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </HStack>
      </HStack>

      {showDocForm && (
        <Box mb={3}>
          <VStack gap={2} align="stretch">
            <Input
              placeholder="Label (e.g. Weave Pilot)"
              value={docLabel}
              onChange={(e) => setDocLabel(e.target.value)}
              size="sm"
              autoFocus
            />
            <Input
              placeholder="Doc path (e.g. pilots/weave-pilot.md)"
              value={docPath}
              onChange={(e) => setDocPath(e.target.value)}
              size="sm"
            />
            <HStack gap={2} justify="flex-end">
              <Button size="xs" variant="ghost" onClick={() => setShowDocForm(false)}>
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={handleAddDoc}
                disabled={!docLabel.trim() || !docPath.trim() || addingDoc}
                loading={addingDoc}
              >
                Add
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {isLoading && <Skeleton height="48px" borderRadius="md" />}

      {artifacts && artifacts.length === 0 && !showDocForm && (
        <Text fontSize="sm" color={mutedColor} fontStyle="italic">
          No artifacts yet. Link a doc or import a conversation.
        </Text>
      )}

      {artifacts && artifacts.length > 0 && (
        <VStack gap={2} align="stretch">
          {artifacts.map((artifact) => (
            <ArtifactRow key={artifact.id} artifact={artifact} initiativeId={initiativeId} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Zone 4 — Meta
// ---------------------------------------------------------------------------

function MetaZone({
  initiative,
  initiativeId,
}: {
  initiative: RadarInitiative;
  initiativeId: string;
}) {
  const { mutate: update } = useUpdateRadarInitiative(initiativeId);
  const { mutate: archive, isPending: archiving } = useArchiveRadarInitiative();
  const router = useRouter();

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.800");

  const isActive = initiative.status === "active";
  const isPaused = initiative.status === "paused";

  const handleArchive = () => {
    archive(initiativeId, { onSuccess: () => router.push("/radar/my") });
  };

  return (
    <Box
      className="riw-meta-zone"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
      p={3}
    >
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color={mutedColor}
        textTransform="uppercase"
        letterSpacing="wide"
        mb={3}
      >
        Meta
      </Text>
      <VStack gap={3} align="stretch">
        <HStack gap={2}>
          <Text fontSize="sm" color={mutedColor} w="80px" flexShrink={0}>
            Status
          </Text>
          <HStack gap={2}>
            <Button
              size="xs"
              variant={isActive ? "solid" : "outline"}
              onClick={() => update({ status: "active" })}
            >
              Active
            </Button>
            <Button
              size="xs"
              variant={isPaused ? "solid" : "outline"}
              onClick={() => update({ status: "paused" })}
            >
              Paused
            </Button>
          </HStack>
        </HStack>

        <HStack gap={2}>
          <Text fontSize="sm" color={mutedColor} w="80px" flexShrink={0}>
            Created
          </Text>
          <Text fontSize="sm">{formatDate(initiative.created_at)}</Text>
        </HStack>

        <HStack gap={2} pt={1} borderTop="1px solid" borderColor={borderColor}>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={handleArchive}
            disabled={archiving}
            loading={archiving}
          >
            Archive initiative
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// RadarWorkspacePage
// ---------------------------------------------------------------------------

export default function RadarWorkspacePage({
  params,
}: {
  params: Promise<{ initiativeId: string }>;
}) {
  const { initiativeId } = use(params);
  const { data: initiative, isLoading, error } = useRadarInitiative(initiativeId);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  if (isLoading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Container maxW="2xl" py={8}>
          <VStack gap={4} align="stretch">
            <Skeleton height="32px" w="240px" />
            <Skeleton height="80px" borderRadius="lg" />
            <Skeleton height="80px" borderRadius="lg" />
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error || !initiative) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Container maxW="2xl" py={8}>
          <Text color="red.400" fontSize="sm">Initiative not found.</Text>
          <Link href="/radar/my" fontSize="sm" color={mutedColor} mt={2} display="block">
            ← Back to radar
          </Link>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="riw-root" bg={bgColor} minH="100vh">
      <Container maxW="2xl" py={8}>

        {/* Header */}
        <Box className="riw-header" mb={8}>
          <Link href="/radar/my" fontSize="sm" color={mutedColor} mb={3} display="block">
            ← Radar
          </Link>
          <HStack gap={3} align="center">
            <Heading size="lg">{initiative.title}</Heading>
            <Badge
              colorPalette={initiative.status === "active" ? "green" : "gray"}
              variant="subtle"
            >
              {initiative.status}
            </Badge>
          </HStack>
          {initiative.direction && (
            <Text fontSize="sm" color={mutedColor} mt={1}>
              {initiative.direction}
            </Text>
          )}
        </Box>

        {/* Zones */}
        <VStack className="riw-zones" gap={8} align="stretch">
          <NarrativeZone initiative={initiative} initiativeId={initiativeId} />
          <LastSessionZone initiative={initiative} initiativeId={initiativeId} />
          <ArtifactsZone initiativeId={initiativeId} />
          <MetaZone initiative={initiative} initiativeId={initiativeId} />
        </VStack>

      </Container>
    </Box>
  );
}
