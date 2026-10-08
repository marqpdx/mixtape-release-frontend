"use client";

import { useEffect, useState } from "react";
import { Box, Button, Checkbox, HStack, Text, Textarea, VStack } from "@chakra-ui/react";
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogCloseTrigger } from "@components/ui/dialog";
import { IconCopy } from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { distributePiece, fetchDistributionSources } from "@mixtape/api/clients/distribution/distributionApi";
import type { Issue } from "@mixtape/core/types/writingTypes";

type SummaryPacket = {
  public_synopsis: { text: string; confirmed: boolean };
  linkedin_introduction: { text: string; confirmed: boolean };
};

type PrepRow = {
  id: string;
  title: string;
  selected: boolean;
  introduction: string;
  description: string;
  shareUrl?: string;
  error?: string;
  loadFailed?: boolean;
};

export function IssueLinkedInPrep({ issue, groupSlug, onClose }: {
  issue: Issue;
  groupSlug: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<PrepRow[]>([]);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setMessage("");
      try {
        const [sources, publicIssue] = await Promise.all([
          fetchDistributionSources(groupSlug),
          axiosInstance.get<{ pieces: { id: string }[] }>(`/api/public/groups/${groupSlug}/writing/issues/${issue.slug}`),
        ]);
        const linkedin = sources.find((source) => source.kind === "linkedin");
        const publiclyReadable = new Set(publicIssue.data.pieces.map((piece) => piece.id));
        const published = issue.placements
          .filter((placement) => placement.piece_status === "published")
          .sort((a, b) => a.order_index - b.order_index);
        const loaded = await Promise.all(published.map(async (placement): Promise<PrepRow> => {
          try {
            const response = await axiosInstance.get<SummaryPacket>(`/api/atelier/${placement.piece_id}/summaries/`);
            return {
              id: placement.piece_id,
              title: placement.piece_title,
              selected: false,
              introduction: response.data.linkedin_introduction.text || "",
              description: response.data.public_synopsis.text || "",
              loadFailed: !publiclyReadable.has(placement.piece_id),
              error: publiclyReadable.has(placement.piece_id) ? undefined : "This piece is not publicly readable in the Issue.",
            };
          } catch {
            return {
              id: placement.piece_id,
              title: placement.piece_title,
              selected: false,
              introduction: "",
              description: "",
              error: "Could not load summaries. Reload before preparing this piece.",
              loadFailed: true,
            };
          }
        }));
        if (!cancelled) {
          setSourceId(linkedin?.id ?? null);
          setRows(loaded);
          if (!linkedin) setMessage("No active LinkedIn distribution source is available for this group.");
        }
      } catch {
        if (!cancelled) setMessage("This Issue is not publicly readable, or LinkedIn distribution settings could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [groupSlug, issue.id, issue.slug, issue.placements]);

  const updateRow = (id: string, change: Partial<PrepRow>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...change } : row));
  };

  const selected = rows.filter((row) => row.selected && !row.shareUrl);
  const canPrepare = Boolean(sourceId && selected.length && selected.every(
    (row) => !row.error && row.introduction.trim() && row.description.trim(),
  ));

  const prepare = async () => {
    if (!sourceId || !canPrepare) return;
    setPreparing(true);
    setMessage("");
    for (const row of selected) {
      try {
        await axiosInstance.patch(`/api/atelier/${row.id}/summaries/`, {
          linkedin_introduction: row.introduction.trim(),
          public_synopsis: row.description.trim(),
        });
        await axiosInstance.post(`/api/atelier/${row.id}/summaries/confirm/`, {
          types: ["linkedin_introduction", "public_synopsis"],
        });
        const result = await distributePiece(row.id, [{
          source_id: sourceId,
          config: { post_copy: row.introduction.trim() },
        }]);
        const share = result.share_records.find((record) => record.source_kind === "linkedin");
        const shareUrl = share?.channel_response?.linkedin_share_url;
        if (share?.status !== "success" || typeof shareUrl !== "string") {
          throw new Error(share?.failure_reason || "No LinkedIn share link was returned.");
        }
        updateRow(row.id, { shareUrl, selected: false, error: undefined });
      } catch (error) {
        updateRow(row.id, {
          error: error instanceof Error ? error.message : "Could not prepare this share.",
          selected: false,
        });
      }
    }
    setPreparing(false);
  };

  return (
    <DialogRoot open onOpenChange={({ open }) => !open && onClose()}>
      <DialogContent className="ilp-dialog" maxW="720px" maxH="90dvh" overflowY="auto">
        <DialogHeader>Prepare LinkedIn shares · {issue.title}</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <Text fontSize="sm" color="theme.textSecondary" mb={4}>
            Choose pieces in Issue order. Review each introduction and link-preview description before creating share links. This emails each piece&apos;s author; it does not post to LinkedIn.
          </Text>
          {message && <Text color="orange.500" mb={4}>{message}</Text>}
          {loading ? <Text>Loading pieces…</Text> : (
            <VStack className="ilp-pieces" align="stretch" gap={5}>
              {rows.map((row, index) => (
                <Box key={row.id} className="ilp-piece" borderTopWidth="1px" borderColor="theme.border" pt={4}>
                  <Checkbox.Root
                    checked={row.selected}
                    disabled={Boolean(row.shareUrl || row.loadFailed) || preparing}
                    onCheckedChange={({ checked }) => updateRow(row.id, { selected: checked === true, error: undefined })}
                  >
                    <Checkbox.HiddenInput />
                    <HStack gap={2} align="center">
                      <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                      <Checkbox.Label fontWeight="semibold">{index + 1}. {row.title}</Checkbox.Label>
                    </HStack>
                  </Checkbox.Root>
                  {row.error && <Text color="red.500" fontSize="sm" mt={2}>{row.error}</Text>}
                  {row.shareUrl ? (
                    <HStack gap={3} mt={2} flexWrap="wrap">
                      <Button size="xs" variant="outline" onClick={() => void navigator.clipboard.writeText(row.introduction)}>
                        <IconCopy size={14} /> Copy introduction
                      </Button>
                      <a href={row.shareUrl} target="_blank" rel="noopener noreferrer">Open LinkedIn</a>
                    </HStack>
                  ) : (
                    <VStack align="stretch" gap={3} mt={3}>
                      <Box>
                        <label htmlFor={`ilp-intro-${row.id}`} style={{ display: "block", fontSize: "0.875rem", fontWeight: 500 }}>LinkedIn post introduction</label>
                        <Textarea id={`ilp-intro-${row.id}`} value={row.introduction} onChange={(event) => updateRow(row.id, { introduction: event.target.value })} rows={4} disabled={preparing || Boolean(row.loadFailed)} />
                      </Box>
                      <Box>
                        <label htmlFor={`ilp-description-${row.id}`} style={{ display: "block", fontSize: "0.875rem", fontWeight: 500 }}>Link-preview description</label>
                        <Textarea id={`ilp-description-${row.id}`} value={row.description} onChange={(event) => updateRow(row.id, { description: event.target.value })} rows={3} disabled={preparing || Boolean(row.loadFailed)} />
                      </Box>
                    </VStack>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={preparing}>Close</Button>
          <Button colorPalette="blue" onClick={prepare} disabled={!canPrepare || preparing || loading}>
            {preparing ? "Preparing…" : `Create ${selected.length} share ${selected.length === 1 ? "link" : "links"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
