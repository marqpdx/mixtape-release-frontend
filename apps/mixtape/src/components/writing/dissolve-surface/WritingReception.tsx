// apps/mixtape/src/components/writing/dissolve-surface/WritingReception.tsx
//
// Writing Reception — decisions/writing-surface-adr (WR-3/WR-4/WR-5). The
// landing inside the Writing Dissolve Surface pilot: recent work, just
// published, open Issues, plus New/Resume. Reads WritingListWrapper's and
// Editor's Desk's existing data layers (useWriting, useIssues) directly —
// no new query layer, per the ADR's reuse-don't-fork constraint.

"use client";

import { useMemo } from "react";
import { Badge, Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { ReceptionLink } from "@mixtape/ui/reception";
import { useWriting } from "@hooks/useWriting";
import { useIssues } from "@mixtape/api/hooks/useIssueBoard";

const ACCENT_COLOR = "amber";

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

export function WritingReception({ sponsor, showOpenIssues, onOpenPiece, onGoToIssues }: WritingReceptionProps) {
  const { drafts, placements } = useWriting(sponsor.type, sponsor.slug);
  const { issues } = useIssues({ type: sponsor.type, slug: sponsor.slug });

  // Same recency fallback chain as WritingListWrapper's "recent" sort —
  // last_saved_at, then piece.updated_at, then piece.created_at.
  const recentWork = useMemo(() => {
    const time = (d: (typeof drafts)[number]) =>
      new Date(d.last_saved_at || d.piece.updated_at || d.piece.created_at).getTime();
    return drafts.slice().sort((a, b) => time(b) - time(a)).slice(0, 5);
  }, [drafts]);

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

  const mostRecentPieceId = recentWork[0]?.piece?.id ? String(recentWork[0].piece.id) : undefined;

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
        <Button size="sm" variant="outline" disabled={!mostRecentPieceId} onClick={() => onOpenPiece(mostRecentPieceId)}>
          Resume
        </Button>
      </HStack>

      <VStack align="stretch" gap={6}>
        <ReceptionSection title="Recent work" emptyLabel="No drafts yet.">
          {recentWork.map((d) => (
            <ReceptionRow
              key={d.piece.id}
              title={d.piece.title || "Untitled"}
              meta={formatDistanceToNow(new Date(d.last_saved_at || d.piece.updated_at), { addSuffix: true })}
              onClick={() => onOpenPiece(String(d.piece.id))}
            />
          ))}
        </ReceptionSection>

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
