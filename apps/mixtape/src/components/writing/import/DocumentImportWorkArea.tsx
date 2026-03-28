"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconFileImport,
  IconFileText,
  IconRefresh,
  IconUpload,
} from "@tabler/icons-react";
import {
  confirmDocumentImportBatch,
  createWritingSeries,
  fetchWritingSeries,
  previewDocumentImportBatch,
} from "@mixtape/api/clients/writing/writingApi";
import type {
  DocumentImportConfirmItem,
  DocumentImportConfirmResult,
  DocumentImportPreviewItem,
  WritingKind,
} from "@mixtape/core/types/writingTypes";
import {
  TipTapRenderer,
  type TipTapDocument,
  type TipTapRenderIssue,
} from "@/components/tiptap/TipTapRenderer";

interface DocumentImportWorkAreaProps {
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

type ImportDraftRow = DocumentImportPreviewItem & {
  include: boolean;
  replace_existing: boolean;
  title: string;
  excerpt: string;
  writing_kind: WritingKind;
  addressed_to: string;
  enable_outline: boolean;
  source_url: string;
  phase_num: number | null;
  series_order: number | null;
};

type ApiError = { response?: { data?: { error?: string } } };

const WRITING_KIND_OPTIONS: { value: WritingKind; label: string }[] = [
  { value: "dispatch", label: "Dispatch" },
  { value: "article", label: "Article" },
  { value: "post", label: "Post" },
  { value: "announcement", label: "Announcement" },
  { value: "almanac", label: "Almanac" },
  { value: "page", label: "Page" },
];

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const apiError = err as ApiError;
    const apiMessage = apiError.response?.data?.error;
    if (apiMessage) return apiMessage;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

function toDraftRow(item: DocumentImportPreviewItem): ImportDraftRow {
  return {
    ...item,
    include: !item.error,
    replace_existing: false,
    title: item.title || item.original_filename.replace(/\.[^.]+$/, ""),
    excerpt: item.excerpt || "",
    writing_kind: (item.writing_kind as WritingKind) || "article",
    addressed_to: item.addressed_to || "public",
    enable_outline: Boolean(item.enable_outline),
    source_url: item.source_url || "",
    phase_num: item.phase_num ?? null,
    series_order: item.series_order ?? null,
  };
}

export default function DocumentImportWorkArea({
  sponsor,
  onImported,
  onBack,
}: DocumentImportWorkAreaProps) {
  const [phase, setPhase] = useState<Phase>("select");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<ImportDraftRow[]>([]);
  const [activeTempId, setActiveTempId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<DocumentImportConfirmResult | null>(null);
  // Tracks render issues per file (temp_id → issues) detected during preview
  const [renderIssues, setRenderIssues] = useState<Record<string, TipTapRenderIssue[]>>({});

  // Series creation state
  const [missingPhaseNums, setMissingPhaseNums] = useState<number[]>([]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesSubtitle, setSeriesSubtitle] = useState('');
  const [seriesFormOpen, setSeriesFormOpen] = useState(false);
  const [seriesCreating, setSeriesCreating] = useState(false);
  const [seriesCreateError, setSeriesCreateError] = useState<string | null>(null);

  const activeRow = useMemo(
    () => rows.find((row) => row.temp_id === activeTempId) || rows[0] || null,
    [rows, activeTempId]
  );
  const activePreviewDocument = useMemo<TipTapDocument>(
    () => (activeRow?.body_json as TipTapDocument) || { type: "doc", content: [] },
    [activeRow]
  );

  const includedRows = useMemo(
    () => rows.filter((row) => row.include && !row.error && row.file_type !== "unknown"),
    [rows]
  );

  const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setUploadError(null);
  }, []);

  const handlePreviewBatch = useCallback(async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setUploadError(null);

    try {
      const result = await previewDocumentImportBatch(selectedFiles, {
        sponsor_type: sponsor.type,
        sponsor_slug: sponsor.slug,
      });
      const nextRows = result.items.map(toDraftRow);
      setRows(nextRows);
      setActiveTempId(nextRows[0]?.temp_id || null);
      setPhase("preview");

      // Check if any items reference a phase_num that doesn't have a series yet
      if (sponsor.type === 'group') {
        const phaseNumsInBatch = [
          ...new Set(nextRows.map(r => r.phase_num).filter((n): n is number => n != null))
        ];
        if (phaseNumsInBatch.length > 0) {
          try {
            const existing = await fetchWritingSeries(sponsor.slug);
            const existingPhases = new Set(existing.map(s => s.phase_num).filter((n): n is number => n != null));
            const missing = phaseNumsInBatch.filter(n => !existingPhases.has(n)).sort((a, b) => a - b);
            if (missing.length > 0) {
              setMissingPhaseNums(missing);
              setSeriesTitle(`Phase ${missing[0]}`);
            }
          } catch {
            // Non-fatal — import will surface the error if series is missing
          }
        }
      }
    } catch (err: unknown) {
      setUploadError(getErrorMessage(err, "Failed to parse selected files"));
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, sponsor.slug, sponsor.type]);

  const updateRow = useCallback((tempId: string, patch: Partial<ImportDraftRow>) => {
    setRows((current) => current.map((row) => (row.temp_id === tempId ? { ...row, ...patch } : row)));
  }, []);

  const handleImport = useCallback(async () => {
    if (!includedRows.length) return;
    setImporting(true);
    setImportError(null);

    try {
      const items: DocumentImportConfirmItem[] = includedRows.map((row) => ({
        temp_id: row.temp_id,
        file_type: row.file_type as "docx" | "md",
        file_sha256: row.file_sha256 || "",
        original_filename: row.original_filename,
        title: row.title,
        excerpt: row.excerpt,
        body_json: row.body_json || {},
        writing_kind: row.writing_kind,
        addressed_to: row.addressed_to,
        enable_outline: row.enable_outline,
        source_url: row.source_url || undefined,
        replace_existing: row.replace_existing,
        phase_num: row.phase_num ?? undefined,
        series_order: row.series_order ?? undefined,
        import_notes: {
          frontmatter: row.frontmatter || {},
          ...row.metadata_notes,
        },
      }));

      const result = await confirmDocumentImportBatch({
        sponsor_type: sponsor.type === "member" ? "user" : sponsor.type,
        sponsor_id: sponsor.id,
        sponsor_slug: sponsor.slug,
        items,
      });
      setImportResult(result);
      setPhase("success");
    } catch (err: unknown) {
      setImportError(getErrorMessage(err, "Failed to import selected files"));
    } finally {
      setImporting(false);
    }
  }, [includedRows, sponsor.id, sponsor.slug, sponsor.type]);

  const handleTreatAsStandalone = useCallback(() => {
    setRows(prev => prev.map(row => ({ ...row, phase_num: null, series_order: null })));
    setMissingPhaseNums([]);
    setSeriesFormOpen(false);
  }, []);

  const handleCreateSeries = useCallback(async () => {
    const phaseNum = missingPhaseNums[0];
    if (phaseNum == null) return;

    const title = seriesTitle.trim() || `Phase ${phaseNum}`;
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    setSeriesCreating(true);
    setSeriesCreateError(null);
    try {
      await createWritingSeries({
        title,
        slug,
        phase_num: phaseNum,
        subtitle: seriesSubtitle.trim() || undefined,
        group: sponsor.id,
      });
      // Move to next missing phase, or clear if done
      const remaining = missingPhaseNums.slice(1);
      setMissingPhaseNums(remaining);
      if (remaining.length > 0) {
        setSeriesTitle(`Phase ${remaining[0]}`);
        setSeriesSubtitle('');
      } else {
        setSeriesFormOpen(false);
      }
    } catch (err: unknown) {
      setSeriesCreateError(getErrorMessage(err, 'Failed to create series'));
    } finally {
      setSeriesCreating(false);
    }
  }, [missingPhaseNums, seriesTitle, seriesSubtitle, sponsor.id]);

  const handleReset = useCallback(() => {
    setPhase("select");
    setSelectedFiles([]);
    setRows([]);
    setActiveTempId(null);
    setUploadError(null);
    setImportError(null);
    setImportResult(null);
    setRenderIssues({});
    setMissingPhaseNums([]);
    setSeriesTitle('');
    setSeriesSubtitle('');
    setSeriesFormOpen(false);
    setSeriesCreating(false);
    setSeriesCreateError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const firstImportedPiece = useMemo(() => {
    const successful = importResult?.results.find((result) => result.piece && result.status !== "error");
    return successful?.piece || null;
  }, [importResult]);

  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <HStack mb={2}>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <IconArrowLeft size={16} />
            </Button>
          )}
          <Heading size="lg">Import Documents</Heading>
        </HStack>
        <Text color="gray.600">
          Import multiple <Text as="span" fontWeight="medium">.docx</Text> and <Text as="span" fontWeight="medium">.md</Text> files into {sponsor.displayName}
        </Text>
      </Box>

      {phase === "select" && (
        <Card.Root>
          <Card.Body>
            <VStack align="stretch" gap={5}>
              <Box>
                <Text fontWeight="medium" mb={2}>Select Files</Text>
                <HStack gap={3} align="center" flexWrap="wrap">
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                    <IconUpload size={16} />
                    <Text ml={1}>Browse...</Text>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".docx,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
                    style={{ display: "none" }}
                    onChange={handleFilesChange}
                  />
                  <Text fontSize="sm" color="gray.600">
                    {selectedFiles.length ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected` : "No files selected"}
                  </Text>
                </HStack>
              </Box>

              {selectedFiles.length > 0 && (
                <VStack align="stretch" gap={2}>
                  {selectedFiles.map((file) => (
                    <HStack key={`${file.name}-${file.size}`} gap={2}>
                      <IconFileText size={15} />
                      <Text fontSize="sm">{file.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}

              {uploadError && (
                <HStack p={3} bg="red.50" borderRadius="md" gap={2}>
                  <IconAlertTriangle size={16} color="var(--chakra-colors-red-500)" />
                  <Text color="red.600" fontSize="sm">{uploadError}</Text>
                </HStack>
              )}

              <Button
                onClick={handlePreviewBatch}
                disabled={!selectedFiles.length || uploading}
                colorPalette="blue"
                size="md"
                alignSelf="flex-start"
              >
                {uploading ? (
                  <>
                    <Spinner size="sm" />
                    <Text ml={2}>Parsing files...</Text>
                  </>
                ) : (
                  "Preview Batch"
                )}
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {phase === "preview" && (
        <HStack align="start" gap={6}>
          <VStack align="stretch" gap={3} flex="0 0 420px">

            {/* Missing series banner */}
            {missingPhaseNums.length > 0 && (
              <Box p={4} bg="yellow.50" borderWidth="1px" borderColor="yellow.300" borderRadius="md">
                <Text fontWeight="semibold" fontSize="sm" mb={1}>
                  Phase {missingPhaseNums[0]} series not found in {sponsor.displayName}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Would you like to create a series for {missingPhaseNums.length > 1 ? `these ${missingPhaseNums.length} phases` : 'these articles'}?
                </Text>

                {!seriesFormOpen ? (
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={() => setSeriesFormOpen(true)}
                    >
                      Yes, create series
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleTreatAsStandalone}>
                      No, import as standalone
                    </Button>
                  </HStack>
                ) : (
                  <VStack align="stretch" gap={2}>
                    <Input
                      size="sm"
                      value={seriesTitle}
                      onChange={e => setSeriesTitle(e.target.value)}
                      placeholder={`Phase ${missingPhaseNums[0]}`}
                    />
                    <Input
                      size="sm"
                      value={seriesSubtitle}
                      onChange={e => setSeriesSubtitle(e.target.value)}
                      placeholder="Subtitle (optional)"
                    />
                    {seriesCreateError && (
                      <Text fontSize="xs" color="red.600">{seriesCreateError}</Text>
                    )}
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={handleCreateSeries}
                        disabled={seriesCreating}
                      >
                        {seriesCreating ? <Spinner size="xs" /> : 'Create'}
                        {missingPhaseNums.length > 1 && !seriesCreating
                          ? ` (${missingPhaseNums.length} remaining)`
                          : ''}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSeriesFormOpen(false)}>
                        Back
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </Box>
            )}

            <Text fontWeight="medium">
              Files ready: {includedRows.length} / {rows.length}
            </Text>
            {rows.map((row) => {
              const isActive = row.temp_id === activeTempId;
              return (
                <Card.Root
                  key={row.temp_id}
                  variant="outline"
                  borderColor={isActive ? "blue.400" : row.error ? "red.300" : "gray.200"}
                  cursor="pointer"
                  onClick={() => setActiveTempId(row.temp_id)}
                >
                  <Card.Body>
                    <VStack align="stretch" gap={3}>
                      <HStack justify="space-between" align="start">
                        <HStack align="start" gap={2}>
                          <input
                            type="checkbox"
                            checked={row.include}
                            disabled={!!row.error || row.file_type === "unknown"}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateRow(row.temp_id, { include: e.target.checked });
                            }}
                          />
                          <Box>
                            <Text fontWeight="medium" fontSize="sm">{row.original_filename}</Text>
                            <HStack gap={2} mt={1} flexWrap="wrap">
                              <Badge variant="outline">{row.file_type}</Badge>
                              {row.phase_num != null && (
                                <Badge variant="outline" colorPalette="blue">Phase {row.phase_num}</Badge>
                              )}
                              {row.already_imported && <Badge colorPalette="yellow">duplicate</Badge>}
                              {row.error && <Badge colorPalette="red">error</Badge>}
                              {renderIssues[row.temp_id]?.length > 0 && (
                                <Badge colorPalette="orange" title={renderIssues[row.temp_id].map(i => i.detail).join(", ")}>
                                  {renderIssues[row.temp_id].length} render warning{renderIssues[row.temp_id].length > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </HStack>
                          </Box>
                        </HStack>
                      </HStack>

                      <Input
                        size="sm"
                        value={row.title}
                        onChange={(e) => updateRow(row.temp_id, { title: e.target.value })}
                        placeholder="Title"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <Input
                        size="sm"
                        value={row.excerpt}
                        onChange={(e) => updateRow(row.temp_id, { excerpt: e.target.value })}
                        placeholder="Excerpt"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <Input
                        size="sm"
                        value={row.source_url}
                        onChange={(e) => updateRow(row.temp_id, { source_url: e.target.value })}
                        placeholder="Source URL (optional)"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <HStack gap={3} align="center" flexWrap="wrap">
                        <select
                          value={row.writing_kind}
                          onChange={(e) => updateRow(row.temp_id, { writing_kind: e.target.value as WritingKind })}
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "14px" }}
                        >
                          {WRITING_KIND_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={row.addressed_to}
                          onChange={(e) => updateRow(row.temp_id, { addressed_to: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "14px" }}
                        >
                          <option value="public">Public</option>
                          <option value="crossroads">Crossroads</option>
                          <option value="self">Self</option>
                        </select>
                      </HStack>

                      <HStack gap={4} flexWrap="wrap">
                        <label
                          style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={row.enable_outline}
                            onChange={(e) => updateRow(row.temp_id, { enable_outline: e.target.checked })}
                          />
                          <Text fontSize="sm">Outline</Text>
                        </label>

                        {row.already_imported && (
                          <label
                            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={row.replace_existing}
                              onChange={(e) => updateRow(row.temp_id, { replace_existing: e.target.checked })}
                            />
                            <Text fontSize="sm">Replace existing</Text>
                          </label>
                        )}
                      </HStack>

                      {(row.warnings || []).length > 0 && (
                        <VStack align="stretch" gap={1}>
                          {(row.warnings || []).map((warning) => (
                            <Text key={warning} fontSize="xs" color="orange.700">
                              {warning}
                            </Text>
                          ))}
                        </VStack>
                      )}

                      {row.error && (
                        <Text fontSize="sm" color="red.600">{row.error}</Text>
                      )}
                    </VStack>
                  </Card.Body>
                </Card.Root>
              );
            })}

            {importError && (
              <HStack p={3} bg="red.50" borderRadius="md" gap={2}>
                <IconAlertTriangle size={16} color="var(--chakra-colors-red-500)" />
                <Text color="red.600" fontSize="sm">{importError}</Text>
              </HStack>
            )}

            <HStack gap={3}>
              <Button
                onClick={handleImport}
                disabled={!includedRows.length || importing}
                colorPalette="blue"
              >
                {importing ? (
                  <>
                    <Spinner size="sm" />
                    <Text ml={2}>Importing...</Text>
                  </>
                ) : (
                  <>
                    <IconFileImport size={16} />
                    <Text ml={2}>Import Selected</Text>
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={importing}>
                Cancel
              </Button>
            </HStack>
          </VStack>

          <Box flex="1" minW={0}>
            {activeRow ? (
              <Card.Root>
                <Card.Header>
                  <VStack align="stretch" gap={1}>
                    <Heading size="sm">{activeRow.title || activeRow.original_filename}</Heading>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge variant="outline">{activeRow.file_type}</Badge>
                      {activeRow.stats?.word_count !== undefined && (
                        <Badge variant="outline">{activeRow.stats.word_count} words</Badge>
                      )}
                      {activeRow.stats?.heading_count !== undefined && (
                        <Badge variant="outline">{activeRow.stats.heading_count} headings</Badge>
                      )}
                    </HStack>
                  </VStack>
                </Card.Header>
                <Card.Body>
                  <Box maxH="640px" overflowY="auto">
                    <TipTapRenderer
                      content={activePreviewDocument}
                      showNodeWarnings
                      onRenderIssues={(issues) =>
                        setRenderIssues((prev) => ({ ...prev, [activeRow.temp_id]: issues }))
                      }
                    />
                  </Box>
                </Card.Body>
              </Card.Root>
            ) : (
              <Card.Root>
                <Card.Body>
                  <Text color="gray.600">Select a file to preview its content.</Text>
                </Card.Body>
              </Card.Root>
            )}
          </Box>
        </HStack>
      )}

      {phase === "success" && importResult && (
        <Card.Root>
          <Card.Body>
            <VStack align="stretch" gap={4}>
              <HStack gap={2}>
                <IconCheck size={20} color="var(--chakra-colors-green-500)" />
                <Heading size="md">Import Complete</Heading>
              </HStack>

              <VStack align="stretch" gap={2}>
                {importResult.results.map((result) => (
                  <HStack key={result.temp_id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <VStack align="start" gap={0}>
                      <Text fontWeight="medium">{result.piece?.title || result.temp_id}</Text>
                      {result.error && <Text fontSize="sm" color="red.600">{result.error}</Text>}
                    </VStack>
                    <Badge colorPalette={result.status === "error" ? "red" : result.status === "skipped_duplicate" ? "yellow" : "green"}>
                      {result.status}
                    </Badge>
                  </HStack>
                ))}
              </VStack>

              <HStack gap={3}>
                {firstImportedPiece && onImported && (
                  <Button
                    colorPalette="blue"
                    onClick={() =>
                      onImported({
                        id: firstImportedPiece.id,
                        slug: firstImportedPiece.slug,
                        title: firstImportedPiece.title,
                      })
                    }
                  >
                    Open First Imported Draft
                  </Button>
                )}
                <Button variant="outline" onClick={handleReset}>
                  <IconRefresh size={16} />
                  <Text ml={2}>Import More</Text>
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
}
