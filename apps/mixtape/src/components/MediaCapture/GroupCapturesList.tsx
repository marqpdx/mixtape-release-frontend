"use client";

import { useState, useEffect } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { IconCheck, IconEdit, IconPlayerRecord, IconTrash, IconX } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useMediaCapture } from "./MediaCaptureContext";
import { ScreencastCaptureButton } from "./ScreencastCaptureButton";
import { useAuth } from "@/lib/auth/AuthContext";
import { useGroupPermissions } from "@mixtape/api/hooks/groups/useGroupSectionPermissions";

interface CaptureRow {
  capture_id: string;
  title: string;
  status: string;
  source_type: string;
  created_at: string;
  duration_seconds: number | null;
  has_transcript: boolean;
  stackroom_ingested: boolean;
}

interface CaptureDetailResponse {
  capture_id: string;
  title: string;
  purpose: string;
  status: string;
  video_url?: string | null;
  transcript?: { id: string; raw_text: string; stackroom_ingested_at: string | null };
}

function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    axiosInstance
      .get(videoUrl, { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => setLoadError(true));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoUrl]);

  if (loadError) return <Text fontSize="sm" color="red.500">Video unavailable.</Text>;
  if (!blobUrl) return (
    <HStack gap={2} py={4} justify="center" color="fg.muted">
      <Spinner size="sm" />
      <Text fontSize="sm">Loading video…</Text>
    </HStack>
  );
  return (
    <Box borderRadius="md" overflow="hidden" bg="black">
      <video controls style={{ width: "100%", maxHeight: "360px", display: "block" }}>
        <source src={blobUrl} type="video/webm" />
        <source src={blobUrl} type="video/mp4" />
      </video>
    </Box>
  );
}

function StatusBadge({ status }: { status: string }) {
  const palette =
    status === "ready"
      ? "green"
      : status === "failed"
      ? "red"
      : status === "transcribing"
      ? "blue"
      : "gray";
  return (
    <Badge colorPalette={palette} size="sm">
      {status}
    </Badge>
  );
}

function CaptureRow({
  capture,
  selected,
  onSelect,
}: {
  capture: CaptureRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      px={4}
      py={3}
      bg={selected ? "bg.subtle" : "transparent"}
      borderBottomWidth="1px"
      borderColor="border.muted"
      _hover={{ bg: "bg.subtle" }}
      onClick={onSelect}
      className="mc-capture-row"
    >
      <HStack justify="space-between" gap={3}>
        <VStack align="start" gap={0.5} flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="medium" truncate>
            {capture.title || "Untitled screencast"}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {formatDistanceToNow(new Date(capture.created_at), { addSuffix: true })}
            {capture.duration_seconds
              ? ` · ${Math.round(capture.duration_seconds / 60)}m`
              : ""}
          </Text>
        </VStack>
        <VStack align="end" gap={1} flexShrink={0}>
          <StatusBadge status={capture.status} />
          {capture.stackroom_ingested && (
            <HStack gap={1} color="green.600">
              <IconCheck size={11} />
              <Text fontSize="xs">Stackroom</Text>
            </HStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}

function TranscriptPanel({
  captureId,
  onDeleted,
}: {
  captureId: string;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<CaptureDetailResponse>({
    queryKey: ["media-capture-detail", captureId],
    queryFn: () =>
      axiosInstance.get(`/api/media-capture/${captureId}`).then((r) => r.data),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "ready" || s === "failed" ? false : 5000;
    },
  });

  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [purposeDraft, setPurposeDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (data) {
      setTitleDraft(data.title || "");
      setPurposeDraft(data.purpose || "");
    }
  }, [data]);

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/api/media-capture/${captureId}`, {
        title: titleDraft,
        purpose: purposeDraft,
      });
      queryClient.invalidateQueries({ queryKey: ["media-capture-detail", captureId] });
      queryClient.invalidateQueries({ queryKey: ["media-captures"] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this screencast? This removes the video, transcript, and Stackroom entry permanently.")) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/api/media-capture/${captureId}`);
      queryClient.invalidateQueries({ queryKey: ["media-captures"] });
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  if (isLoading) return <Spinner size="sm" />;
  if (!data) return null;

  return (
    <VStack align="stretch" gap={4} className="mc-transcript-panel">
      {/* Header row */}
      <HStack justify="space-between" align="start">
        <StatusBadge status={data.status} />
        <HStack gap={1}>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setEditing((e) => !e)}
            aria-label="Edit metadata"
          >
            <IconEdit size={13} />
            Edit
          </Button>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={handleDelete}
            loading={deleting}
            aria-label="Delete screencast"
          >
            <IconTrash size={13} />
            Delete
          </Button>
        </HStack>
      </HStack>

      {/* Metadata — view or edit */}
      {editing ? (
        <VStack align="stretch" gap={2}>
          <Box>
            <Text fontSize="xs" color="fg.muted" mb={1}>Title</Text>
            <Input
              size="sm"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
            />
          </Box>
          <Box>
            <Text fontSize="xs" color="fg.muted" mb={1}>Purpose</Text>
            <Textarea
              size="sm"
              rows={3}
              placeholder="What is this screencast for? What does it demonstrate?"
              value={purposeDraft}
              onChange={(e) => setPurposeDraft(e.target.value)}
            />
          </Box>
          <HStack gap={2} justify="flex-end">
            <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="xs" colorPalette="green" onClick={handleSaveMeta} loading={saving}>Save</Button>
          </HStack>
        </VStack>
      ) : (
        <VStack align="start" gap={1}>
          <Heading size="sm">{data.title || "Untitled"}</Heading>
          {data.purpose && (
            <Text fontSize="sm" color="fg.muted">{data.purpose}</Text>
          )}
        </VStack>
      )}

      {data.video_url && <VideoPlayer videoUrl={data.video_url} />}

      {data.status !== "ready" && (
        <HStack gap={2} color="fg.muted">
          {data.status === "transcribing" || data.status === "uploaded" ? (
            <>
              <Spinner size="xs" />
              <Text fontSize="sm">Transcription in progress…</Text>
            </>
          ) : data.status === "failed" ? (
            <>
              <IconX size={14} color="red" />
              <Text fontSize="sm" color="red.500">Transcription failed.</Text>
            </>
          ) : null}
        </HStack>
      )}

      {data.transcript?.raw_text && (
        <Box>
          <Text fontSize="xs" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="wide">
            Transcript
          </Text>
          <Box
            bg="bg.subtle"
            borderRadius="md"
            p={4}
            maxH="60vh"
            overflowY="auto"
            fontSize="sm"
            lineHeight="tall"
            whiteSpace="pre-wrap"
          >
            {data.transcript.raw_text}
          </Box>
          {data.transcript.stackroom_ingested_at ? (
            <HStack gap={1} mt={2} color="green.600">
              <IconCheck size={13} />
              <Text fontSize="xs">
                Ingested into Stackroom{" "}
                {formatDistanceToNow(new Date(data.transcript.stackroom_ingested_at), {
                  addSuffix: true,
                })}
              </Text>
            </HStack>
          ) : (
            <Text fontSize="xs" color="fg.muted" mt={2}>
              Stackroom ingestion pending…
            </Text>
          )}
        </Box>
      )}
    </VStack>
  );
}

export function GroupCapturesList({ groupSlug }: { groupSlug: string }) {
  const { user } = useAuth();
  const groupPerms = useGroupPermissions(groupSlug);
  const canRecord =
    !!user?.is_superuser ||
    groupPerms.isAdmin ||
    groupPerms.hasDecorator("can__ManageWriting");

  const { pipelineState } = useMediaCapture();

  const { data: captures = [], isLoading } = useQuery<CaptureRow[]>({
    queryKey: ["media-captures"],
    queryFn: () => axiosInstance.get("/api/media-capture/").then((r) => r.data),
    refetchInterval:
      pipelineState === "processing" || pipelineState === "uploading" ? 5000 : false,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = captures.find((c) => c.capture_id === selectedId) ?? null;

  return (
    <Box className="mc-captures-root">
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="green.600">
          Screencasts
        </Heading>
        {canRecord && <ScreencastCaptureButton groupSlug={groupSlug} />}
      </HStack>

      {isLoading ? (
        <HStack gap={2} justify="center" py={12}>
          <Spinner />
          <Text color="fg.muted">Loading…</Text>
        </HStack>
      ) : captures.length === 0 ? (
        <VStack gap={3} py={16} align="center" color="fg.muted">
          <IconPlayerRecord size={32} />
          <Text>No screencasts yet.</Text>
          {canRecord && (
            <Text fontSize="sm">
              Click <strong>Record</strong> to capture your first product walkthrough.
            </Text>
          )}
        </VStack>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={selected ? "280px 1fr" : "1fr"}
          gap={6}
          alignItems="start"
          className="mc-captures-grid"
        >
          {/* List */}
          <Box borderWidth="1px" borderColor="border" borderRadius="lg" overflow="hidden">
            {captures.map((c) => (
              <CaptureRow
                key={c.capture_id}
                capture={c}
                selected={c.capture_id === selectedId}
                onSelect={() =>
                  setSelectedId(c.capture_id === selectedId ? null : c.capture_id)
                }
              />
            ))}
          </Box>

          {/* Detail / transcript panel */}
          {selected && (
            <Box
              borderWidth="1px"
              borderColor="border"
              borderRadius="lg"
              p={4}
              className="mc-capture-detail"
            >
              <TranscriptPanel
                captureId={selected.capture_id}
                onDeleted={() => setSelectedId(null)}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
