// apps/mixtape/src/components/writing/dissolve-surface/WritingReception.tsx
//
// Writing Reception — decisions/writing-surface-adr (WR-3/WR-4/WR-5). The
// landing inside the Writing Dissolve Surface pilot: the 3 most recent
// drafts (grouped by Issue, same as WritingListWrapper's Drafts tab), just
// published, and open Issues, plus New. Reads WritingListWrapper's and
// Editor's Desk's existing data layers (useWriting, useIssues,
// listIssueGrouping, groupItemsByIssue) directly — no new query layer, per
// the ADR's reuse-don't-fork constraint. No separate "Resume": the top row
// of Recent work is always the most recently saved draft, so it already is
// Resume (CTO, 2026-10-15).

"use client";

import { useMemo } from "react";
import { Accordion, Badge, Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { IconClock } from "@tabler/icons-react";
import { ReceptionLink } from "@mixtape/ui/reception";
import { useWriting } from "@hooks/useWriting";
import { useIssues } from "@mixtape/api/hooks/useIssueBoard";
import { listIssueGrouping } from "@mixtape/api/clients/writing/issueBoardApi";
import type { IssueGrouping, WorkingDocument } from "@mixtape/core/types/writingTypes";
import { groupItemsByIssue } from "@/components/writing/WritingListWrapper";

const ACCENT_COLOR = "amber";
const RECENT_DRAFTS_LIMIT = 3;

interface ReceptionSponsor {
  type: "group" | "member";
  id: string;
  slug: string;
  displayName: string;
}

interface WritingReceptionProps {
  sponsor: ReceptionSponsor;
  /** Issues are an Editor's Desk / superuser concern today — same gate as the rim position itself. */
  showOpenIssues: boolean;
  onOpenPiece: (pieceId?: string) => void;
  onGoToIssues: () => void;
}

interface DraftIssueSection {
  key: string;
  title: string;
  status: string | null;
  items: WorkingDocument[];
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

function ReceptionRow({
  title,
  meta,
  onClick,
}: {
  title: string;
  meta?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <HStack
      justify="space-between"
      px={2}
      py={1.5}
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: "theme.surface" }}
      onClick={onClick}
    >
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

/** One draft row inside a Recent-work Issue group: Title + Draft badge + last-saved, one line. No tags, no autosave count — trimmed deliberately for the landing (CTO, 2026-10-15). */
function RecentDraftRow({ draft, onClick }: { draft: WorkingDocument; onClick: () => void }) {
  const lastSaved = new Date(draft.last_saved_at || draft.piece.updated_at || draft.piece.created_at);
  return (
    <HStack
      justify="space-between"
      px={2}
      py={1.5}
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: "theme.surface" }}
      onClick={onClick}
    >
      <HStack gap={2} minW={0}>
        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
          {draft.piece.title || "Untitled Draft"}
        </Text>
        <Badge size="sm" variant="subtle" flexShrink={0}>
          Draft
        </Badge>
      </HStack>
      <HStack gap={1} flexShrink={0} color="fg.muted" fontSize="xs">
        <IconClock size={12} />
        <Text>{formatDistanceToNow(lastSaved, { addSuffix: true })}</Text>
      </HStack>
    </HStack>
  );
}

export function WritingReception({ sponsor, showOpenIssues, onOpenPiece, onGoToIssues }: WritingReceptionProps) {
  const { drafts, placements } = useWriting(sponsor.type, sponsor.slug);
  const { issues } = useIssues({ type: sponsor.type, slug: sponsor.slug });

  // Same queryKey WritingListWrapper uses for Issue grouping — shares cache, no second fetch.
  const { data: issueGrouping = [] } = useQuery<IssueGrouping[]>({
    queryKey: ["writing", "issues", "grouping", sponsor.type, sponsor.slug],
    queryFn: () => listIssueGrouping({ type: sponsor.type, slug: sponsor.slug }),
    enabled: !!sponsor.slug,
  });

  // Same recency fallback chain as WritingListWrapper's "recent" sort —
  // last_saved_at, then piece.updated_at, then piece.created_at.
  const recentDrafts = useMemo(() => {
    const time = (d: (typeof drafts)[number]) =>
      new Date(d.last_saved_at || d.piece.updated_at || d.piece.created_at).getTime();
    return drafts.slice().sort((a, b) => time(b) - time(a)).slice(0, RECENT_DRAFTS_LIMIT);
  }, [drafts]);

  // Same grouping helper WritingListWrapper's Drafts-by-Issue view uses,
  // scoped to just the 3 most recent drafts — groups with none of those 3
  // simply don't appear here (full history stays one click away in Writing).
  const draftSections: DraftIssueSection[] = useMemo(() => {
    const { groups, unassigned } = groupItemsByIssue(recentDrafts, issueGrouping, (d) => d.piece.id);
    const sections: DraftIssueSection[] = groups.map(({ issue, items }) => ({
      key: issue.id,
      title: issue.title,
      status: issue.status,
      items,
    }));
    if (unassigned.length > 0) {
      sections.push({ key: "no-issue", title: "No Issue", status: null, items: unassigned });
    }
    return sections;
  }, [recentDrafts, issueGrouping]);

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
      <HStack justify="space-between" mb={1}>
        <Heading size="md">Writing Reception</Heading>
        <ReceptionLink href={`/groups/${sponsor.slug}/reception`} />
      </HStack>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {sponsor.displayName} — recent work, what's just published, and open Issues.
      </Text>

      <HStack gap={3} mb={6}>
        <Button size="sm" colorScheme={ACCENT_COLOR} onClick={() => onOpenPiece(undefined)}>
          New
        </Button>
      </HStack>

      <VStack align="stretch" gap={6}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb={2}>
            Recent work
          </Text>
          {draftSections.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              No drafts yet.
            </Text>
          ) : (
            <Accordion.Root className="wrcp-recent-issues" collapsible multiple defaultValue={[draftSections[0].key]}>
              {draftSections.map((section) => (
                <Accordion.Item className="wrcp-recent-issue" key={section.key} value={section.key}>
                  <Accordion.ItemTrigger>
                    <HStack justify="space-between" w="full">
                      <HStack gap={2} minW={0}>
                        <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                          {section.title}
                        </Text>
                        {section.status && (
                          <Badge size="sm" variant="subtle">
                            {section.status}
                          </Badge>
                        )}
                      </HStack>
                      <Accordion.ItemIndicator />
                    </HStack>
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <VStack align="stretch" gap={1} pt={1}>
                      {section.items.map((draft) => (
                        <RecentDraftRow key={draft.piece.id} draft={draft} onClick={() => onOpenPiece(String(draft.piece.id))} />
                      ))}
                    </VStack>
                  </Accordion.ItemContent>
                </Accordion.Item>
              ))}
            </Accordion.Root>
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
