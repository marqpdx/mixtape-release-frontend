"use client";

// components/initiatives/ImportSessionPanel.tsx
//
// Three-phase import flow:
//   upload  → preview (review/edit detected artifacts) → done

import { useRef, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  createListCollection,
  Field,
  Heading,
  HStack,
  Input,
  Portal,
  Select,
  Separator,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  IconArrowLeft,
  IconCheck,
  IconFileImport,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import {
  confirmInitiativeImport,
  previewInitiativeImport,
} from "@mixtape/api/clients/initiatives/initiativesApi";
import type {
  ImportArtifactSpec,
  ImportConfirmResponse,
  ImportPreviewResponse,
  SessionResponse,
  SourceFormat,
} from "@mixtape/api/clients/initiatives/initiativesApi";

// ============================================================================
// Constants
// ============================================================================

const KIND_COLORS: Record<string, string> = {
  decision: "green",
  question: "blue",
  action: "orange",
  annotation: "purple",
  document: "gray",
};

const artifactKindCollection = createListCollection({
  items: [
    { label: "Decision", value: "decision" },
    { label: "Question", value: "question" },
    { label: "Action", value: "action" },
    { label: "Annotation", value: "annotation" },
    { label: "Document", value: "document" },
  ],
});

const formatCollection = createListCollection({
  items: [
    { label: "Auto-detect", value: "auto" },
    { label: "Claude web chat", value: "claude" },
    { label: "ChatGPT web chat", value: "chatgpt" },
    { label: "Freeform / other", value: "freeform" },
  ],
});

type FormatOption = SourceFormat | "auto";

function getErrorDetail(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "detail" in error.response.data &&
    typeof error.response.data.detail === "string"
  ) {
    return error.response.data.detail;
  }

  return fallback;
}

// ============================================================================
// Props
// ============================================================================

interface ImportSessionPanelProps {
  groupSlug: string;
  initiativeId: string;
  onDone: (result: { session: SessionResponse; artifactsCreated: number }) => void;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

type Phase = "upload" | "preview" | "done";

export default function ImportSessionPanel({
  groupSlug,
  initiativeId,
  onDone,
  onCancel,
}: ImportSessionPanelProps) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportConfirmResponse | null>(null);

  if (phase === "upload" || !preview) {
    return (
      <UploadPhase
        groupSlug={groupSlug}
        initiativeId={initiativeId}
        onPreview={(p) => {
          setPreview(p);
          setPhase("preview");
        }}
        onCancel={onCancel}
      />
    );
  }

  if (phase === "preview") {
    return (
      <PreviewPhase
        groupSlug={groupSlug}
        initiativeId={initiativeId}
        preview={preview}
        onBack={() => setPhase("upload")}
        onDone={(r) => {
          setResult(r);
          setPhase("done");
        }}
      />
    );
  }

  // done
  return (
    <DonePhase
      result={result!}
      onFinish={() =>
        onDone({
          session: result!.session,
          artifactsCreated: result!.artifacts_created,
        })
      }
    />
  );
}

// ============================================================================
// Upload phase
// ============================================================================

function UploadPhase({
  groupSlug,
  initiativeId,
  onPreview,
  onCancel,
}: {
  groupSlug: string;
  initiativeId: string;
  onPreview: (p: ImportPreviewResponse) => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<FormatOption>("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await previewInitiativeImport(
        groupSlug,
        initiativeId,
        file,
        format === "auto" ? undefined : format,
      );
      onPreview(result);
    } catch (error: unknown) {
      setError(
        getErrorDetail(
          error,
          "Could not parse this file. Check the format and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between">
        <Heading size="sm">Import Conversation</Heading>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </HStack>

      <Text fontSize="sm" color="gray.500">
        Upload an exported JSON file from Claude or ChatGPT. The conversation becomes a Session on this
        initiative, and detected artifacts are surfaced for review.
      </Text>

      <Field.Root>
        <Field.Label>Format</Field.Label>
        <Select.Root
          collection={formatCollection}
          value={[format]}
          onValueChange={({ value }) => setFormat((value[0] || "auto") as FormatOption)}
          size="sm"
        >
          <Select.HiddenSelect />
          <Select.Control maxW="280px">
            <Select.Trigger>
              <Select.ValueText placeholder="Auto-detect" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {formatCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Field.Root>

      <Field.Root>
        <Field.Label>JSON file</Field.Label>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <HStack>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <IconUpload size={14} />
            {file ? "Change file" : "Choose file"}
          </Button>
          {file && (
            <Text fontSize="sm" color="gray.600" truncate maxW="240px">
              {file.name}
            </Text>
          )}
        </HStack>
      </Field.Root>

      {error && (
        <Alert.Root status="error" size="sm">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      <HStack justify="end">
        <Button
          colorPalette="blue"
          disabled={!file || loading}
          loading={loading}
          onClick={handlePreview}
        >
          <IconFileImport size={16} />
          Preview Import
        </Button>
      </HStack>
    </VStack>
  );
}

// ============================================================================
// Preview phase
// ============================================================================

function PreviewPhase({
  groupSlug,
  initiativeId,
  preview,
  onBack,
  onDone,
}: {
  groupSlug: string;
  initiativeId: string;
  preview: ImportPreviewResponse;
  onBack: () => void;
  onDone: (r: ImportConfirmResponse) => void;
}) {
  const [artifacts, setArtifacts] = useState<ImportArtifactSpec[]>(
    preview.detected_artifacts,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateArtifact(idx: number, patch: Partial<ImportArtifactSpec>) {
    setArtifacts((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    );
  }

  function removeArtifact(idx: number) {
    setArtifacts((prev) => prev.filter((_, i) => i !== idx));
  }

  function addArtifact() {
    setArtifacts((prev) => [
      ...prev,
      { kind: "annotation", title: "", body: "" },
    ]);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await confirmInitiativeImport(groupSlug, initiativeId, {
        turns: preview.turns,
        artifacts: artifacts.filter((a) => a.title.trim()),
      });
      onDone(result);
    } catch (error: unknown) {
      setError(
        getErrorDetail(
          error,
          "Failed to confirm import. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const formatLabel =
    formatCollection.items.find((f) => f.value === preview.source_format)?.label ??
    preview.source_format;

  return (
    <VStack align="stretch" gap={5}>
      {/* Header */}
      <HStack>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft size={14} />
          Back
        </Button>
        <Heading size="sm" flex={1}>
          Review Import
        </Heading>
      </HStack>

      {/* Conversation summary */}
      <Card.Root size="sm" variant="outline">
        <Card.Body>
          <VStack align="stretch" gap={1}>
            <HStack gap={2}>
              <Badge size="sm" colorPalette="blue">
                {formatLabel}
              </Badge>
              <Text fontSize="sm" fontWeight="medium">
                {preview.conversation_title}
              </Text>
            </HStack>
            <HStack gap={4} color="gray.500" fontSize="xs">
              <Text>{preview.stats.turn_count} turns</Text>
              <Text>{preview.stats.word_count.toLocaleString()} words</Text>
              {preview.stats.human_turns !== undefined && (
                <Text>
                  {preview.stats.human_turns}↑ / {preview.stats.assistant_turns}↓
                </Text>
              )}
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Artifacts */}
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between">
          <Heading size="xs" color="gray.600">
            Detected Artifacts ({artifacts.length})
          </Heading>
          <Button variant="ghost" size="xs" onClick={addArtifact}>
            <IconPlus size={12} />
            Add
          </Button>
        </HStack>

        {artifacts.length === 0 && (
          <Text fontSize="sm" color="gray.400">
            No artifacts detected. You can add them manually or import as transcript only.
          </Text>
        )}

        {artifacts.map((artifact, idx) => (
          <ArtifactRow
            key={idx}
            artifact={artifact}
            onChange={(patch) => updateArtifact(idx, patch)}
            onRemove={() => removeArtifact(idx)}
          />
        ))}
      </VStack>

      <Separator />

      {error && (
        <Alert.Root status="error" size="sm">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      <HStack justify="end" gap={2}>
        <Text fontSize="xs" color="gray.400">
          {artifacts.filter((a) => a.title.trim()).length} artifact
          {artifacts.filter((a) => a.title.trim()).length !== 1 ? "s" : ""} will be created
        </Text>
        <Button
          colorPalette="green"
          loading={submitting}
          onClick={handleConfirm}
        >
          <IconCheck size={16} />
          Confirm Import
        </Button>
      </HStack>
    </VStack>
  );
}

// ============================================================================
// Artifact row
// ============================================================================

function ArtifactRow({
  artifact,
  onChange,
  onRemove,
}: {
  artifact: ImportArtifactSpec;
  onChange: (patch: Partial<ImportArtifactSpec>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card.Root size="sm" variant="outline">
      <Card.Body>
        <VStack align="stretch" gap={2}>
          <HStack gap={2}>
            <Select.Root
              collection={artifactKindCollection}
              value={[artifact.kind]}
              onValueChange={({ value }) =>
                onChange({ kind: (value[0] || "annotation") as ImportArtifactSpec["kind"] })
              }
              size="xs"
            >
              <Select.HiddenSelect />
              <Select.Control maxW="130px">
                <Select.Trigger>
                  <Badge colorPalette={KIND_COLORS[artifact.kind] || "gray"} size="sm">
                    {artifactKindCollection.items.find((o) => o.value === artifact.kind)?.label ?? artifact.kind}
                  </Badge>
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {artifactKindCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>

            <Input
              size="xs"
              flex={1}
              placeholder="Title"
              value={artifact.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Less" : "Body"}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              colorPalette="red"
              onClick={onRemove}
            >
              <IconTrash size={12} />
            </Button>
          </HStack>

          {expanded && (
            <Textarea
              size="xs"
              placeholder="Body (optional)"
              value={artifact.body}
              onChange={(e) => onChange({ body: e.target.value })}
              rows={3}
            />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================================================
// Done phase
// ============================================================================

function DonePhase({
  result,
  onFinish,
}: {
  result: ImportConfirmResponse;
  onFinish: () => void;
}) {
  return (
    <VStack align="stretch" gap={4} py={4} textAlign="center">
      <Box color="green.500">
        <IconCheck size={40} style={{ margin: "0 auto" }} />
      </Box>
      <Heading size="sm">Import Complete</Heading>
      <VStack gap={1} color="gray.500" fontSize="sm">
        <Text>Session created with {result.session.raw_transcript?.length ?? 0} turns.</Text>
        <Text>{result.artifacts_created} artifact{result.artifacts_created !== 1 ? "s" : ""} created.</Text>
        <Text>Rolling summary update queued.</Text>
      </VStack>
      <Button colorPalette="blue" onClick={onFinish}>
        View Session
      </Button>
    </VStack>
  );
}
