// apps/mixtape/src/components/writing/dissolve-surface/WritingReception.tsx
//
// Writing Reception — decisions/writing-surface-adr (WR-3/WR-4/WR-5). The
// landing inside the Writing Dissolve Surface pilot. Layout follows the
// CTO's "sectors of visual affordance" direction (2026-10-15): a compact
// search + New Doc + Solo/Collab + Sort toolbar (matching
// WritingListWrapper's own chrome, reused via <DraftFilterToolbar>), a flat
// recency list (no accordion) with an inline Issue pill per row instead of
// parent/child folders, the 2 most recent as content-preview cards and the
// next 3 as single-line titles, then Just published and (superuser-gated)
// Open Issues below. Reads WritingListWrapper's and Editor's Desk's
// existing data layers directly (useWriting, useIssues, listIssueGrouping,
// extractDisplayTextFromProseMirror) — no new query layer.

"use client";

import { useMemo, useState } from "react";
import { Badge, Box, Button, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { IconClock, IconSearch } from "@tabler/icons-react";
import { ReceptionLink } from "@mixtape/ui/reception";
import { useWriting } from "@hooks/useWriting";
import { useIssues } from "@mixtape/api/hooks/useIssueBoard";
import { listIssueGrouping } from "@mixtape/api/clients/writing/issueBoardApi";
import type { IssueGrouping, WorkingDocument } from "@mixtape/core/types/writingTypes";
import { extractDisplayTextFromProseMirror } from "@/components/writing/WritingListWrapper";
import { DraftFilterToolbar } from "@/components/writing/DraftFilterToolbar";

const ACCENT_COLOR = "amber";
const RECENT_RICH_COUNT = 2;
const RECENT_TOTAL = 5;

type SortField = "recent" | "created";
type SortOrder = "asc" | "desc";

interface ReceptionSponsor {
  type: "group" | "member";
  id: string;
  slug: string;
  displayName: string;
}

interface WritingReceptionProps {
  sponsor: ReceptionSponsor;
  canCreatePost: boolean;
  /** Issues are an Editor's Desk / superuser concern today — same gate as the rim position itself. */
  showOpenIssues: boolean;
  onOpenPiece: (pieceId?: string) => void;
  onGoToIssues: () => void;
}

function draftExcerpt(draft: WorkingDocument): string {
  if (draft.excerpt) return draft.excerpt;
  if (draft.body_preview) return draft.body_preview;
  if (draft.body_json?.content) {
    const text = extractDisplayTextFromProseMirror(draft.body_json as Parameters<typeof extractDisplayTextFromProseMirror>[0]);
    if (text) return text;
  }
  return "";
}

function IssuePill({ issueTitle }: { issueTitle: string | null }) {
  return (
    <Badge size="sm" variant="outline" colorScheme={issueTitle ? "purple" : "gray"} flexShrink={0}>
      {issueTitle ? `Issue: ${issueTitle}` : "No Issue"}
    </Badge>
  );
}

function ReceptionSection({
  title,
  action,
  emptyLabel,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  emptyLabel: string;
  children: React.ReactNode[];
}) {
  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          {title}
        </Text>
        {action}
      </HStack>
      {children.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyLabel}
        </Text>
      ) : (
        <VStack align="stretch" gap={1}>
          {children}
        </VStack>
      )}
    </Box>
  );
}

function ReceptionRow({ title, meta, onClick }: { title: string; meta?: React.ReactNode; onClick: () => void }) {
  return (
    <HStack justify="space-between" px={2} py={1.5} borderRadius="md" cursor="pointer" _hover={{ bg: "theme.surface" }} onClick={onClick}>
      <Text fontSize="sm" lineClamp={1}>
        {title}
      </Text>
      {typeof meta === "string" ? (
        <Text fontSize="xs" color="fg.muted" flexShrink={0}>
          {meta}
        </Text>
      ) : (
        meta
      )}
    </HStack>
  );
}

/** One of the 2 richest recent-work rows: title + Draft badge + Issue pill, excerpt, last-saved. */
function RecentCard({ draft, issueTitle, onClick }: { draft: WorkingDocument; issueTitle: string | null; onClick: () => void }) {
  const excerpt = draftExcerpt(draft);
  const lastSaved = new Date(draft.last_saved_at || draft.piece.updated_at || draft.piece.created_at);
  return (
    <Box
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      p={3}
      cursor="pointer"
      _hover={{ borderColor: `${ACCENT_COLOR}.400` }}
      onClick={onClick}
    >
      <HStack gap={2} mb={1} wrap="wrap">
        <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
          {draft.piece.title || "Untitled Draft"}
        </Text>
        <Badge size="sm" variant="subtle" flexShrink={0}>
          Draft
        </Badge>
        <IssuePill issueTitle={issueTitle} />
      </HStack>
      <Text fontSize="sm" color="fg.muted" lineClamp={2} mb={1} fontStyle={excerpt ? "normal" : "italic"}>
        {excerpt || "No content yet..."}
      </Text>
      <HStack gap={1} color="fg.muted" fontSize="xs">
        <IconClock size={12} />
        <Text>Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</Text>
      </HStack>
    </Box>
  );
}

/** The next 3 recent-work rows: a single line naming the piece — no content. */
function RecentTitleRow({ draft, issueTitle, onClick }: { draft: WorkingDocument; issueTitle: string | null; onClick: () => void }) {
  const lastSaved = new Date(draft.last_saved_at || draft.piece.updated_at || draft.piece.created_at);
  return (
    <HStack justify="space-between" px={2} py={1.5} borderRadius="md" cursor="pointer" _hover={{ bg: "theme.surface" }} onClick={onClick}>
      <HStack gap={2} minW={0}>
        <Text fontSize="sm" lineClamp={1}>
          {draft.piece.title || "Untitled Draft"}
        </Text>
        <Badge size="sm" variant="subtle" flexShrink={0}>
          Draft
        </Badge>
        <IssuePill issueTitle={issueTitle} />
      </HStack>
      <HStack gap={1} flexShrink={0} color="fg.muted" fontSize="xs">
        <IconClock size={12} />
        <Text>{formatDistanceToNow(lastSaved, { addSuffix: true })}</Text>
      </HStack>
    </HStack>
  );
}

export function WritingReception({ sponsor, canCreatePost, showOpenIssues, onOpenPiece, onGoToIssues }: WritingReceptionProps) {
  const { drafts, placements, showSolo, showCollab, setShowSolo, setShowCollab } = useWriting(sponsor.type, sponsor.slug);
  const { issues } = useIssues({ type: sponsor.type, slug: sponsor.slug });

  // Same queryKey WritingListWrapper uses for Issue grouping — shares cache, no second fetch.
  const { data: issueGrouping = [] } = useQuery<IssueGrouping[]>({
    queryKey: ["writing", "issues", "grouping", sponsor.type, sponsor.slug],
    queryFn: () => listIssueGrouping({ type: sponsor.type, slug: sponsor.slug }),
    enabled: !!sponsor.slug,
  });

  const [search, setSearch] = useState("");
  // Session-only state, deliberately not sharing WritingListWrapper's
  // persisted writing_date_sort_* localStorage keys — changing sort here
  // shouldn't silently change the classic Drafts tab's remembered state.
  const [sortField, setSortField] = useState<SortField>("recent");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const issueTitleByPieceId = useMemo(() => {
    const map = new Map<string, string>();
    issueGrouping.forEach((issue) => issue.piece_ids.forEach((id) => map.set(id, issue.title)));
    return map;
  }, [issueGrouping]);

  const recentDrafts = useMemo(() => {
    const time = (d: WorkingDocument) =>
      sortField === "created"
        ? new Date(d.piece.created_at).getTime()
        : new Date(d.last_saved_at || d.piece.updated_at || d.piece.created_at).getTime();
    const needle = search.trim().toLowerCase();
    const filtered = needle ? drafts.filter((d) => (d.piece.title || "").toLowerCase().includes(needle)) : drafts;
    return filtered.slice().sort((a, b) => (sortOrder === "desc" ? time(b) - time(a) : time(a) - time(b))).slice(0, RECENT_TOTAL);
  }, [drafts, search, sortField, sortOrder]);

  const justPublished = useMemo(() => {
    const time = (p: (typeof placements)[number]) =>
      new Date(p.published_at || p.updated_at || p.created_at).getTime();
    return placements.slice().sort((a, b) => time(b) - time(a)).slice(0, 5);
  }, [placements]);

  const openIssues = useMemo(() => {
    return issues
      .filter((i) => i.status === "draft")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [issues]);

  return (
    <Box className="wrcp-root">
      <HStack justify="space-between" mb={3}>
        <Heading size="md">Writing Reception</Heading>
        <ReceptionLink href={`/groups/${sponsor.slug}/reception`} />
      </HStack>

      <Box
        mb={5}
        display="grid"
        gridTemplateColumns={{ base: "1fr", md: "minmax(0, 40%) minmax(0, 60%)" }}
        columnGap={6}
        rowGap={3}
        alignItems="center"
      >
        <HStack>
          <IconSearch size={16} color="gray" />
          <Input
            placeholder="Search recent work..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="subtle"
            size="sm"
          />
        </HStack>

        <HStack gap={3} wrap="wrap" justify="flex-end">
          <DraftFilterToolbar
            showSolo={showSolo}
            showCollab={showCollab}
            onToggleShowSolo={() => setShowSolo(!showSolo)}
            onToggleShowCollab={() => setShowCollab(!showCollab)}
            onShowAll={() => {}}
            onCreateNew={() => onOpenPiece(undefined)}
            canCreate={canCreatePost}
            showSoloCollab
            showAllButton={false}
          />
          <Button size="xs" variant="outline" onClick={() => setSortField((f) => (f === "recent" ? "created" : "recent"))}>
            {sortField === "recent" ? "Sort: Recent activity" : "Sort: Creation date"}
          </Button>
          <Button size="xs" variant="outline" onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}>
            {sortOrder === "desc" ? "Newest first" : "Oldest first"}
          </Button>
        </HStack>
      </Box>

      <VStack align="stretch" gap={6}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb={2}>
            Recent work
          </Text>
          {recentDrafts.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              {search ? "No drafts match your search." : "No drafts yet."}
            </Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {recentDrafts.slice(0, RECENT_RICH_COUNT).map((d) => (
                <RecentCard
                  key={d.piece.id}
                  draft={d}
                  issueTitle={issueTitleByPieceId.get(d.piece.id) ?? null}
                  onClick={() => onOpenPiece(String(d.piece.id))}
                />
              ))}
              {recentDrafts.length > RECENT_RICH_COUNT && (
                <VStack align="stretch" gap={0} borderWidth="1px" borderColor="border.muted" borderRadius="md" overflow="hidden">
                  {recentDrafts.slice(RECENT_RICH_COUNT).map((d) => (
                    <RecentTitleRow
                      key={d.piece.id}
                      draft={d}
                      issueTitle={issueTitleByPieceId.get(d.piece.id) ?? null}
                      onClick={() => onOpenPiece(String(d.piece.id))}
                    />
                  ))}
                </VStack>
              )}
            </VStack>
          )}
        </Box>

        <ReceptionSection title="Just published" emptyLabel="Nothing published yet.">
          {justPublished.map((p) => (
            <ReceptionRow
              key={p.id}
              title={p.piece_title || "Untitled"}
              meta={p.published_at ? formatDistanceToNow(new Date(p.published_at), { addSuffix: true }) : undefined}
              onClick={() => onOpenPiece(String(p.piece_id))}
            />
          ))}
        </ReceptionSection>

        {showOpenIssues && (
          <ReceptionSection
            title="Open Issues"
            emptyLabel="No open Issues."
            action={
              <Button size="xs" variant="ghost" onClick={onGoToIssues}>
                Editor's Desk →
              </Button>
            }
          >
            {openIssues.map((i) => (
              <ReceptionRow
                key={i.id}
                title={i.title}
                meta={
                  <Badge size="sm" colorScheme="yellow">
                    draft
                  </Badge>
                }
                onClick={onGoToIssues}
              />
            ))}
          </ReceptionSection>
        )}
      </VStack>
    </Box>
  );
}

export default WritingReception;
