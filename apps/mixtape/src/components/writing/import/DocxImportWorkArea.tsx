// apps/mixtape/src/components/writing/import/DocxImportWorkArea.tsx

"use client";

import { useState, useRef, useCallback } from "react";
import {
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Button,
  Input,
  Card,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import {
  IconUpload,
  IconArrowLeft,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
  IconList,
  IconRefresh,
  IconCopy,
  IconExternalLink,
} from "@tabler/icons-react";
import { previewDocxImport, confirmDocxImport } from "@mixtape/api/clients/writing/api";
import type { DocxPreviewResult, DocxImportResult, WritingKind } from "@mixtape/core/types/writingTypes";
import TipTapEditor from "@/components/editor/TipTapEditor";

interface DocxImportWorkAreaProps {
  sponsor: {
    type: "group" | "member";
    id: string;
    slug: string;
    displayName: string;
  };
  onImported?: (piece: { id: string; slug: string; title: string }) => void;
  onBack?: () => void;
}

type Phase = "select" | "preview" | "success";
type ApiError = { response?: { data?: { error?: string } } };

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const apiError = err as ApiError;
    const apiMessage = apiError.response?.data?.error;
    if (apiMessage) return apiMessage;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

const WRITING_KIND_OPTIONS: { value: WritingKind; label: string }[] = [
  { value: "dispatch", label: "Dispatch" },
  { value: "article", label: "Article" },
  { value: "post", label: "Post" },
  { value: "announcement", label: "Announcement" },
  { value: "almanac", label: "Almanac" },
  { value: "page", label: "Page" },
];

export default function DocxImportWorkArea({
  sponsor,
  onImported,
  onBack,
}: DocxImportWorkAreaProps) {
  const [phase, setPhase] = useState<Phase>("select");

  // Phase 1 state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Phase 2 state
  const [preview, setPreview] = useState<DocxPreviewResult | null>(null);
  const [title, setTitle] = useState("");
  const [writingKind, setWritingKind] = useState<WritingKind>("dispatch");
  const [enableOutline, setEnableOutline] = useState(false);
  const [addressedTo, setAddressedTo] = useState<string>("public");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Phase 3 state
  const [importResult, setImportResult] = useState<DocxImportResult | null>(null);

  // Phase 1: Upload & Preview
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  }, []);

  const handleUploadAndPreview = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const result = await previewDocxImport(selectedFile);
      setPreview(result);
      setTitle(result.title || selectedFile.name.replace(/\.docx$/i, ""));
      setPhase("preview");
    } catch (err: unknown) {
      setUploadError(getErrorMessage(err, "Failed to parse document"));
    } finally {
      setUploading(false);
    }
  }, [selectedFile]);

  // Phase 2: Confirm Import (supports mode: "new" | "replace")
  const handleConfirmImport = useCallback(async (mode: "new" | "replace") => {
    if (!preview) return;

    setImporting(true);
    setImportError(null);

    try {
      const result = await confirmDocxImport({
        body_json: preview.body_json,
        title,
        writing_kind: writingKind,
        sponsor_type: sponsor.type === "member" ? "user" : "group",
        sponsor_id: sponsor.id,
        enable_outline: enableOutline,
        source_url: sourceUrl || undefined,
        file_sha256: preview.file_sha256,
        original_filename: preview.original_filename,
        addressed_to: addressedTo,
        mode,
        force: mode === "new" && !!preview.already_imported,
      });
      setImportResult(result);
      setPhase("success");
    } catch (err: unknown) {
      setImportError(getErrorMessage(err, "Failed to import document"));
    } finally {
      setImporting(false);
    }
  }, [preview, title, writingKind, sponsor, enableOutline, sourceUrl, addressedTo]);

  // Reset to start
  const handleReset = useCallback(() => {
    setPhase("select");
    setSelectedFile(null);
    setSourceUrl("");
    setUploadError(null);
    setPreview(null);
    setTitle("");
    setWritingKind("dispatch");
    setEnableOutline(false);
    setImportError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <VStack align="stretch" gap={6}>
      {/* Header */}
      <Box>
        <HStack mb={2}>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <IconArrowLeft size={16} />
            </Button>
          )}
          <Heading size="lg">Import Document</Heading>
        </HStack>
        <Text color="gray.600">
          Import a .docx file into {sponsor.displayName}
        </Text>
      </Box>

      {/* Phase 1: File Selection */}
      {phase === "select" && (
        <Card.Root>
          <Card.Body>
            <VStack align="stretch" gap={5}>
              {/* File Input */}
              <Box>
                <Text fontWeight="medium" mb={2}>Select File</Text>
                <HStack gap={3}>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                  >
                    <IconUpload size={16} />
                    <Text ml={1}>Browse...</Text>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                  {selectedFile && (
                    <HStack gap={2}>
                      <IconFileText size={16} />
                      <Text fontSize="sm" color="gray.700">
                        {selectedFile.name}{" "}
                        <Text as="span" color="gray.500">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </Text>
                      </Text>
                    </HStack>
                  )}
                  {!selectedFile && (
                    <Text fontSize="sm" color="gray.500">No file selected</Text>
                  )}
                </HStack>
              </Box>

              {/* Source URL (optional) */}
              <Box>
                <Text fontWeight="medium" mb={1}>Source URL (optional)</Text>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Reference link to the original document (e.g. Google Docs URL)
                </Text>
                <Input
                  placeholder="https://docs.google.com/..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  size="sm"
                />
              </Box>

              {/* Error */}
              {uploadError && (
                <HStack p={3} bg="red.50" borderRadius="md" gap={2}>
                  <IconAlertTriangle size={16} color="var(--chakra-colors-red-500)" />
                  <Text color="red.600" fontSize="sm">{uploadError}</Text>
                </HStack>
              )}

              {/* Upload button */}
              <Button
                onClick={handleUploadAndPreview}
                disabled={!selectedFile || uploading}
                colorPalette="blue"
                size="md"
                alignSelf="flex-start"
              >
                {uploading ? (
                  <>
                    <Spinner size="sm" />
                    <Text ml={2}>Parsing document...</Text>
                  </>
                ) : (
                  "Upload & Preview"
                )}
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Phase 2: Preview */}
      {phase === "preview" && preview && (
        <VStack align="stretch" gap={4}>
          {/* Previously imported — three-choice card */}
          {preview.already_imported && (
            <Card.Root variant="outline" borderColor="yellow.300">
              <Card.Body>
                <VStack align="stretch" gap={3}>
                  <HStack gap={2}>
                    <IconAlertTriangle size={18} color="var(--chakra-colors-yellow-600)" />
                    <Text fontWeight="medium" color="yellow.800">
                      Previously Imported
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.700">
                    This file was imported on{" "}
                    {new Date(preview.already_imported.imported_at).toLocaleDateString()}.
                    Choose how to proceed:
                  </Text>
                  <HStack gap={3} flexWrap="wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onImported?.({
                        id: preview.already_imported!.piece_id,
                        slug: "",
                        title: "",
                      })}
                    >
                      <IconExternalLink size={14} />
                      <Text ml={1}>Open Existing</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="blue"
                      disabled={!title.trim() || importing}
                      onClick={() => handleConfirmImport("replace")}
                    >
                      <IconRefresh size={14} />
                      <Text ml={1}>Replace Content</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!title.trim() || importing}
                      onClick={() => handleConfirmImport("new")}
                    >
                      <IconCopy size={14} />
                      <Text ml={1}>Import as New</Text>
                    </Button>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Settings row */}
          <Card.Root>
            <Card.Body>
              <VStack align="stretch" gap={4}>
                {/* Title */}
                <Box>
                  <Text fontWeight="medium" mb={1}>Title</Text>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    size="sm"
                  />
                </Box>

                {/* Writing Kind + Options */}
                <HStack gap={6} flexWrap="wrap">
                  <Box>
                    <Text fontWeight="medium" mb={1}>Type</Text>
                    <select
                      value={writingKind}
                      onChange={(e) => setWritingKind(e.target.value as WritingKind)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #E2E8F0",
                        fontSize: "14px",
                      }}
                    >
                      {WRITING_KIND_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Box>

                  <Box>
                    <Text fontWeight="medium" mb={1}>Audience</Text>
                    <select
                      value={addressedTo}
                      onChange={(e) => setAddressedTo(e.target.value)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #E2E8F0",
                        fontSize: "14px",
                      }}
                    >
                      <option value="public">Public</option>
                      <option value="crossroads">Crossroads</option>
                      <option value="self">Self</option>
                    </select>
                  </Box>

                  <Box>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={enableOutline}
                        onChange={(e) => setEnableOutline(e.target.checked)}
                      />
                      <Text fontWeight="medium" fontSize="sm">Enable Outline</Text>
                    </label>
                  </Box>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Stats */}
          <HStack gap={3} flexWrap="wrap">
            {Object.entries(preview.stats.node_counts).map(([type, count]) => (
              <Badge key={type} variant="outline" size="sm">
                {type}: {count}
              </Badge>
            ))}
            {preview.stats.comment_count > 0 && (
              <Badge colorPalette="yellow" size="sm">
                {preview.stats.comment_count} comments
              </Badge>
            )}
          </HStack>

          {/* Comments panel */}
          {preview.comments.length > 0 && (
            <Card.Root variant="outline">
              <Card.Header py={2} px={4}>
                <HStack>
                  <IconList size={16} />
                  <Text fontWeight="medium" fontSize="sm">
                    Extracted Comments ({preview.comments.length})
                  </Text>
                </HStack>
              </Card.Header>
              <Card.Body py={2} px={4}>
                <VStack align="stretch" gap={2}>
                  {preview.comments.map((comment, i) => (
                    <Box key={comment.id || i} fontSize="sm" p={2} bg="gray.50" borderRadius="sm">
                      <HStack gap={2} mb={1}>
                        <Text fontWeight="medium">{comment.author}</Text>
                        <Text color="gray.500" fontSize="xs">
                          {new Date(comment.date).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <Text color="gray.700">{comment.text}</Text>
                    </Box>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Content Preview */}
          <Card.Root>
            <Card.Header py={2} px={4}>
              <Text fontWeight="medium" fontSize="sm">Content Preview</Text>
            </Card.Header>
            <Card.Body p={4}>
              <Box maxH="500px" overflowY="auto">
                <TipTapEditor
                  initialContent={preview.body_json}
                  editable={false}
                />
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Error */}
          {importError && (
            <HStack p={3} bg="red.50" borderRadius="md" gap={2}>
              <IconAlertTriangle size={16} color="var(--chakra-colors-red-500)" />
              <Text color="red.600" fontSize="sm">{importError}</Text>
            </HStack>
          )}

          {/* Action buttons — only show for first-time imports (no duplicate) */}
          {!preview.already_imported && (
            <HStack gap={3}>
              <Button
                onClick={() => handleConfirmImport("new")}
                disabled={!title.trim() || importing}
                colorPalette="blue"
              >
                {importing ? (
                  <>
                    <Spinner size="sm" />
                    <Text ml={2}>Importing...</Text>
                  </>
                ) : (
                  "Import"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={importing}
              >
                Cancel
              </Button>
            </HStack>
          )}

          {/* Cancel button for duplicate case (import actions are in the card above) */}
          {preview.already_imported && (
            <HStack gap={3}>
              {importing && (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.600">Importing...</Text>
                </HStack>
              )}
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={importing}
              >
                Cancel
              </Button>
            </HStack>
          )}
        </VStack>
      )}

      {/* Phase 3: Success */}
      {phase === "success" && importResult && (
        <Card.Root>
          <Card.Body>
            <VStack align="stretch" gap={4}>
              <HStack gap={2}>
                <IconCheck size={20} color="var(--chakra-colors-green-500)" />
                <Heading size="md">Import Complete</Heading>
              </HStack>

              <Text>{importResult.message}</Text>

              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Title:</Text> {importResult.piece.title}
                </Text>
                {importResult.outline_nodes_created > 0 && (
                  <Text fontSize="sm" mt={1}>
                    <Text as="span" fontWeight="medium">Outline nodes:</Text> {importResult.outline_nodes_created}
                  </Text>
                )}
              </Box>

              <HStack gap={3}>
                <Button
                  colorPalette="blue"
                  onClick={() => onImported?.(importResult.piece)}
                >
                  Open in Editor
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Import Another
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
}
