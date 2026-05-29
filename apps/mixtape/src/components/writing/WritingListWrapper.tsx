// apps/mixtape/src/components/writing/WritingListWrapper.tsx
/**
 * Generic list view for writing content (published + drafts)
 * Works with both Group and Member sponsors
 * Replaces GroupWritingMainWorkArea with sponsor-agnostic version
 */

"use client";

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Input,
  Tabs,
  Avatar,
  Accordion,
  Wrap,
  WrapItem,
  Button,
} from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@components/ui/dialog";
import { Tooltip } from "@components/ui/tooltip";
import { useCallback, useState, useEffect, useMemo } from "react";
import {
  IconSearch,
  IconClock,
  IconEdit,
  IconArticle,
  IconFileText,
  IconUsersGroup,
  IconUser,
  IconTrash,
  IconMapPin,
  IconBook,
} from "@tabler/icons-react";
import { DraftFilterToolbar } from "./DraftFilterToolbar";
import { SeriesGroupView } from "./SeriesGroupView";
import { PromotionDialog } from "@components/living-book/PromotionDialog";
import { useColorModeValue } from "@components/ui/color-mode";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { formatDistanceToNow } from "date-fns";
import { useWriting, useWritingMutations } from "@hooks/useWriting";
import { useGroupWelcomePin, useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import { FlattenedPlacement, WorkingDocument } from "@mixtape/core/types/writingTypes";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import { postsColumns } from "../groups/tabs/columns/postsColumns";
import NextLink from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as writingApi from "@mixtape/api/clients/writing/writingApi";
import type { WritingSeries } from "@mixtape/core/types/writingTypes";
// import { postsColumns } from "@components/groups/writing/tabs/columns/postsColumns";

type ProseMirrorNode = {
  type?: string;
  text?: string;
  content?: ProseMirrorNode[];
};

type ProseMirrorDoc = {
  content?: ProseMirrorNode[];
};

type CollaboratorUser = {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type Collaborator = {
  id: number | string;
  role?: string;
  user: CollaboratorUser;
};

interface SponsorConfig {
  type: 'group' | 'member';
  id?: string;
  slug: string;
  displayName?: string;
}

interface WritingListWrapperProps {
  sponsor: SponsorConfig;
  canCreatePost?: boolean;
  canManagePosts?: boolean;
  onNavigateToEditor: (pieceSlug?: string) => void;
  onNavigateToDetail: (piece: { id: string; slug: string }) => void;
}

/**
 * Generic writing list component
 *
 * @example
 * // For a group
 * <WritingListWrapper
 *   sponsor={{ type: 'group', slug: 'my-group', displayName: 'My Group' }}
 *   canCreatePost={true}
 *   canManagePosts={isAdmin}
 *   onNavigateToEditor={(slug) => router.push(`/groups/my-group/writing/edit/${slug || 'new'}`)}
 *   onNavigateToDetail={({ slug }) => router.push(`/groups/my-group/writing/${slug}`)}
 * />
 *
 * // For a member
 * <WritingListWrapper
 *   sponsor={{ type: 'member', slug: 'username', displayName: 'John Doe' }}
 *   canCreatePost={true}
 *   canManagePosts={true}
 *   onNavigateToEditor={(slug) => router.push(`/writing/edit/${slug || 'new'}`)}
 *   onNavigateToDetail={({ slug }) => router.push(`/writing/${slug}`)}
 * />
 */
export default function WritingListWrapper({
  sponsor,
  canCreatePost = true,
  canManagePosts = false,
  onNavigateToEditor,
  onNavigateToDetail,
}: WritingListWrapperProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState("published");
  const [groupingMode, setGroupingMode] = useState<"by-list" | "by-tag" | "by-where" | "by-series">("by-list");
  const [dateSortOrder, setDateSortOrder] = useState<"desc" | "asc">("desc");
  const [dateSortField, setDateSortField] = useState<"recent" | "created">("recent");
  const [promotingPiece, setPromotingPiece] = useState<{ slug: string; title: string } | null>(null);
  const [deletingDraft, setDeletingDraft] = useState<WorkingDocument | null>(null);
  // null = not yet loaded from storage (use default); string[] = explicit user state
  const [pubTagAcc, setPubTagAcc] = useState<string[] | null>(null);
  const [pubWhereAcc, setPubWhereAcc] = useState<string[] | null>(null);
  const [draftTagAcc, setDraftTagAcc] = useState<string[] | null>(null);
  const [draftWhereAcc, setDraftWhereAcc] = useState<string[] | null>(null);
  // Phase A: left-rail series filter (undefined=all, null=unassigned, string=seriesId)
  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null | undefined>(undefined);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch series list for the rail + assignment dropdowns (group only)
  const { data: seriesList = [] } = useQuery<WritingSeries[]>({
    queryKey: ['writing', 'series', sponsor.slug],
    queryFn: () => writingApi.fetchWritingSeries(sponsor.slug),
    enabled: sponsor.type === 'group' && groupingMode === 'by-series',
  });

  // Load persisted tab from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedTab = window.localStorage.getItem("writing_active_tab");
      if (savedTab && (savedTab === "published" || savedTab === "drafts")) {
        setActiveTab(savedTab);
      }
      const savedGroupByTags = window.localStorage.getItem("writing_group_by_tags");
      if (savedGroupByTags === "true") {
        setGroupingMode("by-tag");
      }
      const savedDateSortOrder = window.localStorage.getItem("writing_date_sort_order");
      if (savedDateSortOrder === "asc" || savedDateSortOrder === "desc") {
        setDateSortOrder(savedDateSortOrder);
      }
      const savedDateSortField = window.localStorage.getItem("writing_date_sort_field");
      if (savedDateSortField === "recent" || savedDateSortField === "created") {
        setDateSortField(savedDateSortField);
      }
      const savedGroupingMode = window.localStorage.getItem("writing_group_mode");
      if (
        savedGroupingMode === "by-list" ||
        savedGroupingMode === "by-tag" ||
        savedGroupingMode === "by-where" ||
        savedGroupingMode === "by-series"
      ) {
        setGroupingMode(savedGroupingMode);
      }
      const loadAcc = (key: string) => {
        const v = window.localStorage.getItem(key);
        return v ? JSON.parse(v) as string[] : null;
      };
      setPubTagAcc(loadAcc("writing_acc_pub_tag"));
      setPubWhereAcc(loadAcc("writing_acc_pub_where"));
      setDraftTagAcc(loadAcc("writing_acc_draft_tag"));
      setDraftWhereAcc(loadAcc("writing_acc_draft_where"));
    } catch (error) {
      console.warn("Failed to load saved writing tab:", error);
    }
  }, []);

  const saveAcc = useCallback((key: string, value: string[]) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, []);

  // Save tab to localStorage when it changes
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("writing_active_tab", value);
      } catch (error) {
        console.warn("Failed to save writing tab:", error);
      }
    }
  }, []);

  const handleGroupingModeChange = useCallback((mode: "by-list" | "by-tag" | "by-where" | "by-series") => {
    setGroupingMode(mode);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("writing_group_mode", mode);
      } catch (error) {
        console.warn("Failed to save group mode:", error);
      }
    }
  }, []);

  const handleDateSortOrderToggle = useCallback(() => {
    const nextOrder = dateSortOrder === "desc" ? "asc" : "desc";
    setDateSortOrder(nextOrder);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("writing_date_sort_order", nextOrder);
      } catch (error) {
        console.warn("Failed to save date sort order:", error);
      }
    }
  }, [dateSortOrder]);

  const handleDateSortFieldToggle = useCallback(() => {
    const nextField = dateSortField === "recent" ? "created" : "recent";
    setDateSortField(nextField);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("writing_date_sort_field", nextField);
      } catch (error) {
        console.warn("Failed to save date sort field:", error);
      }
    }
  }, [dateSortField]);

  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const badgeBg = useColorModeValue("green.50", "green.900");
  const badgeColor = useColorModeValue("green.700", "green.300");

  // Use the generic hook with show filter support
  const {
    placements,
    drafts,
    isLoading: placementsLoading,
    draftsLoading,
    error: placementsError,
    showSolo,
    showCollab,
    setShowSolo,
    setShowCollab,
    refetch,
  } = useWriting(sponsor.type, sponsor.slug);
  const { deleteDraft } = useWritingMutations(sponsor.type, sponsor.slug);
  const { groups: userGroups = [] } = useUserGroups();
  const groupSlugForWelcomePin = sponsor.type === "group" ? sponsor.slug : null;
  const { pin: welcomePin } = useGroupWelcomePin(groupSlugForWelcomePin);
  const welcomePinnedPieceId = welcomePin?.piece?.id || null;

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem("writing_force_refresh") === "true") {
      window.localStorage.removeItem("writing_force_refresh");
    }
    refetch();
  }, [refetch]);

  console.log("WritingListWrapper - placements:", placements);
  console.log("WritingListWrapper - drafts:", drafts);


  // Ensure placements is always an array to prevent .filter() errors
  const typedPlacements = (Array.isArray(placements) ? placements : []) as FlattenedPlacement[];

  const handleRowClick = (placement: FlattenedPlacement) => {
    onNavigateToDetail({ id: placement.piece_id, slug: placement.piece_slug });
  };

  const handlePublishedEdit = useCallback(
    (placement: FlattenedPlacement) => {
      onNavigateToEditor(placement.piece_id);
    },
    [onNavigateToEditor]
  );

  const handleDraftClick = useCallback(
    (draft: WorkingDocument) => {
      onNavigateToEditor(draft.piece.id);
    },
    [onNavigateToEditor]
  );

  const handleDeleteDraft = useCallback(
    (draft: WorkingDocument) => { setDeletingDraft(draft); },
    []
  );

  const handleStartWriting = useCallback(() => {
    onNavigateToEditor();
  }, [onNavigateToEditor]);

  // Helper function to extract text from ProseMirror JSON
  const extractTextFromProseMirror = (bodyJson: ProseMirrorDoc | null): string => {
    if (!bodyJson?.content) return "";

    const extractText = (node: ProseMirrorNode): string => {
      if (node.type === "text") {
        return node.text || "";
      }

      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(" ");
      }

      return "";
    };

    const fullText = bodyJson.content.map(extractText).join(" ").trim();
    return fullText;
  };

  // Helper function for displaying excerpts (truncated)
  const extractDisplayTextFromProseMirror = (bodyJson: ProseMirrorDoc | null): string => {
    const fullText = extractTextFromProseMirror(bodyJson);
    return fullText.length > 150 ? fullText.substring(0, 150) + "..." : fullText;
  };

  // Enhanced search function for drafts
  const searchInDraft = (draft: WorkingDocument, searchTerm: string): boolean => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    if (draft.title?.toLowerCase().includes(term)) return true;
    if (draft.excerpt?.toLowerCase().includes(term)) return true;

    if (draft.body_json?.content) {
      const bodyText = extractTextFromProseMirror(draft.body_json as ProseMirrorDoc);
      if (bodyText.toLowerCase().includes(term)) return true;
    }

    return false;
  };


  // Adjust types as needed
  const getCollaboratorDisplayName = (collab: Collaborator) => {
    const first = collab.user.first_name || "";
    const lastOrUsername = collab.user.last_name || collab.user.username || "";
    return `${first} ${lastOrUsername}`.trim();
  };

  const getInitialsFromName = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  type SponsorMeta = {
    key: string;
    label: string;
    imageUrl?: string;
  };

  const groupById = useMemo(() => {
    const map = new Map<string, (typeof userGroups)[number]>();
    userGroups.forEach((group) => map.set(group.id, group));
    return map;
  }, [userGroups]);

  const personalSponsorMeta = useMemo<SponsorMeta>(
    () => ({
      key: "member:self",
      label: "Personal",
      imageUrl: user?.profile?.avatar_url?.trim() || undefined,
    }),
    [user]
  );

  const getPlacementSponsorMeta = useCallback(
    (placement: FlattenedPlacement): SponsorMeta => {
      if (sponsor.type === "group") {
        return {
          key: `group:${sponsor.slug}`,
          label: sponsor.displayName || sponsor.slug,
        };
      }

      const sourceType = placement.sponsor_content_type;
      const sourceId = placement.sponsor_object_id;
      if (sourceType === "group" && sourceId) {
        const group = groupById.get(sourceId);
        const imageUrl =
          getBestEmblemUrl(group?.emblem, 48) ||
          group?.profile_image_url ||
          group?.profile_image ||
          undefined;
        return {
          key: `group:${sourceId}`,
          label: group?.title || "Group",
          imageUrl,
        };
      }
      return personalSponsorMeta;
    },
    [groupById, personalSponsorMeta, sponsor.displayName, sponsor.slug, sponsor.type]
  );

  const getDraftSponsorMeta = useCallback(
    (draft: WorkingDocument): SponsorMeta => {
      if (sponsor.type === "group") {
        return {
          key: `group:${sponsor.slug}`,
          label: sponsor.displayName || sponsor.slug,
        };
      }

      const pieceUnknown = draft.piece as unknown as {
        sponsor_content_type?: string;
        sponsor_object_id?: string;
      };
      if (pieceUnknown.sponsor_content_type === "group" && pieceUnknown.sponsor_object_id) {
        const group = groupById.get(pieceUnknown.sponsor_object_id);
        const imageUrl =
          getBestEmblemUrl(group?.emblem, 48) ||
          group?.profile_image_url ||
          group?.profile_image ||
          undefined;
        return {
          key: `group:${pieceUnknown.sponsor_object_id}`,
          label: group?.title || "Group",
          imageUrl,
        };
      }
      return personalSponsorMeta;
    },
    [groupById, personalSponsorMeta, sponsor.displayName, sponsor.slug, sponsor.type]
  );

  const renderSponsorSquare = useCallback((meta: SponsorMeta) => {
    if (meta.imageUrl) {
      return (
        <Box
          w="24px"
          h="24px"
          borderRadius="sm"
          overflow="hidden"
          borderWidth="1px"
          borderColor="gray.200"
          flexShrink={0}
        >
          <Image
            src={meta.imageUrl}
            alt={meta.label}
            width={24}
            height={24}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Box>
      );
    }

    return (
      <Box
        w="24px"
        h="24px"
        borderRadius="sm"
        bg="gray.100"
        borderWidth="1px"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="gray.500"
        flexShrink={0}
      >
        <IconMapPin size={14} />
      </Box>
    );
  }, []);


  const processedPieces = typedPlacements
    .filter((p: FlattenedPlacement) => p.piece_status === 'published')
    .sort((a: FlattenedPlacement, b: FlattenedPlacement) => {
      // Member view: newest updates first.
      if (sponsor.type === "member") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }

      // Group view: preserve pin + announcement prioritization.
      if (a.pinned_at && !b.pinned_at) return -1;
      if (b.pinned_at && !a.pinned_at) return 1;
      if (a.is_announcement && !b.is_announcement) return -1;
      if (b.is_announcement && !a.is_announcement) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

  const processedDrafts = (Array.isArray(drafts) ? drafts : [])
    .filter((draft: WorkingDocument) => {
      // If both filters are off, show nothing
      if (!showSolo && !showCollab) return false;

      const isCollab = draft.is_collaborative;
      if (showSolo && !showCollab && isCollab) return false;
      if (!showSolo && showCollab && !isCollab) return false;

      // Otherwise, apply search filter
      return searchInDraft(draft, searchFilter);
    })
    .sort((a: WorkingDocument, b: WorkingDocument) => {
      return new Date(b.last_saved_at).getTime() - new Date(a.last_saved_at).getTime();
    });

  // Custom renderers for drafts
  const renderDraftTitle = (draft: WorkingDocument) => {
    const displayTitle = draft.title || "Untitled Draft";
    const isCollab = draft.is_collaborative;
    const sponsorMeta = getDraftSponsorMeta(draft);

    return (
      <HStack gap={2} align="center" wrap="wrap">
        {(groupingMode === "by-tag" || groupingMode === "by-where") && renderSponsorSquare(sponsorMeta)}
        {/* Icon: Different for solo vs collab */}
        {isCollab ? (
          <IconUsersGroup size={18} color="purple" />
        ) : (
          <IconUser size={18} color="gray" />
        )}

        {/* LB eligibility indicator (group only) */}
        {sponsor.type === "group" && (
          <IconBook
            size={16}
            color={isCollab ? "#3182ce" : "#CBD5E0"}
            style={{ flexShrink: 0 }}
          />
        )}

        <Text fontWeight="semibold" fontSize="md" color="gray.900" _dark={{ color: "white" }} lineClamp={1}>
          {displayTitle}
        </Text>

        <Badge size="sm" bg={badgeBg} color={badgeColor} px={2} py={1} rounded="full">
          Draft
        </Badge>
        {welcomePinnedPieceId && draft.piece.id === welcomePinnedPieceId && (
          <Badge size="sm" colorScheme="orange" px={2} py={1} rounded="full">
            Welcome pin
          </Badge>
        )}

        {/* Collaborator Avatars (replace count badge) */}
        {isCollab &&
          draft.collaborators &&
          draft.collaborators.length > 0 && (
            <HStack gap={-2}>
              {draft.collaborators.slice(0, 4).map((collab) => {
                const displayName = getCollaboratorDisplayName(collab);
                const initials = getInitialsFromName(displayName);

                return (
                  <Tooltip
                    key={collab.id}
                    content={`${displayName} (@${collab.user.username}) - ${collab.role}`}
                    portalled={false}
                    positioning={{ placement: "top" }}
                  >
                    <Avatar.Root
                      size="xs"
                      colorPalette={collab.role === "editor" ? "blue" : "purple"}
                    >
                      <Avatar.Fallback>{initials}</Avatar.Fallback>
                    </Avatar.Root>
                  </Tooltip>
                );
              })}

              {draft.collaborators.length > 4 && (
                <Badge size="xs" variant="subtle" colorScheme="gray">
                  +{draft.collaborators.length - 4}
                </Badge>
              )}
            </HStack>
          )}
      </HStack>
    );
  };

  const renderDraftDescription = (draft: WorkingDocument) => {
    const excerpt = draft.excerpt;

    if (!excerpt) {
      // Use body_preview (lightweight server-side extract) or fall back to body_json
      const preview = (draft as unknown as { body_preview?: string }).body_preview;
      if (preview) {
        return (
          <Text fontSize="sm" color={textSecondary} lineClamp={2} wordBreak="break-word">
            {preview}
          </Text>
        );
      }
      if (draft.body_json?.content) {
        const textContent = extractDisplayTextFromProseMirror(draft.body_json as ProseMirrorDoc);
        if (textContent) {
          return (
            <Text fontSize="sm" color={textSecondary} lineClamp={2} wordBreak="break-word">
              {textContent}
            </Text>
          );
        }
      }
      return (
        <Text fontSize="sm" color={textSecondary} fontStyle="italic">
          No content yet...
        </Text>
      );
    }

    return (
      <Text fontSize="sm" color={textSecondary} lineClamp={2} wordBreak="break-word">
        {excerpt}
      </Text>
    );
  };

  const renderDraftMetadata = (draft: WorkingDocument) => {
    const lastSaved = new Date(draft.last_saved_at);
    const autoSaveText =
      draft.auto_save_count > 0 ? `Autosaved ${draft.auto_save_count} times` : "Not yet saved";
    const draftTags =
      (draft as { tags_list?: string[] }).tags_list ||
      ((draft as { piece?: { tags_list?: string[] } }).piece?.tags_list ?? []);

    return (
      <VStack align="stretch" gap={2} mt={1}>
        <HStack gap={4} fontSize="xs" color="gray.400">
          <HStack gap={1}>
            <IconClock size={12} />
            <Text>Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</Text>
          </HStack>
          <Text>•</Text>
          <Text>{autoSaveText}</Text>
        </HStack>

        {draftTags.length > 0 && (
          <Wrap gap={2}>
            {draftTags.map((tag) => (
              <WrapItem key={tag}>
                <Badge size="xs" variant="subtle" colorScheme="gray">
                  {tag}
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        )}

        {/* {draft.is_collaborative && draft.collaborators && draft.collaborators.length > 0 && (
          <HStack gap={2}>
            <IconUsers size={14} color="gray" />
            <HStack gap={-2}>
              {draft.collaborators.slice(0, 4).map((collab) => (
                <Tooltip
                  key={collab.id}
                  content={`${collab.user.first_name || ''} ${collab.user.last_name || ''} (@${collab.user.username}) - ${collab.role}`}
                >
                  <Avatar
                    name={`${collab.user.first_name || ''} ${collab.user.last_name || collab.user.username}`}
                    size="xs"
                    colorPalette={collab.role === 'editor' ? 'blue' : 'purple'}
                  />
                </Tooltip>
              ))}
              {draft.collaborators.length > 4 && (
                <Badge size="xs" variant="subtle" colorScheme="gray">
                  +{draft.collaborators.length - 4}
                </Badge>
              )}
            </HStack>
          </HStack>
        )} */}
      </VStack>
    );
  };

  const matchesPublishedSearch = useCallback(
    (placement: FlattenedPlacement) => {
      if (!searchFilter) return true;
      const needle = searchFilter.toLowerCase();
      const title = placement.piece_title?.toLowerCase() || "";
      const excerpt = placement.display?.excerpt?.toLowerCase() || "";
      return title.includes(needle) || excerpt.includes(needle);
    },
    [searchFilter]
  );

  const filteredPublishedPieces = processedPieces
    .filter(matchesPublishedSearch)
    .map((placement) => {
      const sponsorMeta = getPlacementSponsorMeta(placement);
      return {
        ...placement,
        sponsor_label: sponsorMeta.label,
        sponsor_image_url: sponsorMeta.imageUrl || null,
      };
    });

  const listPublishedPieces = useMemo(() => {
    const sorted = filteredPublishedPieces.slice().sort((a, b) => {
      const aTime =
        dateSortField === "created"
          ? new Date(a.created_at).getTime()
          : new Date(a.updated_at || a.published_at || a.created_at).getTime();
      const bTime =
        dateSortField === "created"
          ? new Date(b.created_at).getTime()
          : new Date(b.updated_at || b.published_at || b.created_at).getTime();
      return dateSortOrder === "desc" ? bTime - aTime : aTime - bTime;
    });
    return sorted;
  }, [filteredPublishedPieces, dateSortField, dateSortOrder]);

  const listDrafts = useMemo(() => {
    const sorted = processedDrafts.slice().sort((a, b) => {
      const aTime =
        dateSortField === "created"
          ? new Date(a.piece.created_at).getTime()
          : new Date(a.last_saved_at || a.piece.updated_at || a.piece.created_at).getTime();
      const bTime =
        dateSortField === "created"
          ? new Date(b.piece.created_at).getTime()
          : new Date(b.last_saved_at || b.piece.updated_at || b.piece.created_at).getTime();
      return dateSortOrder === "desc" ? bTime - aTime : aTime - bTime;
    });
    return sorted;
  }, [processedDrafts, dateSortField, dateSortOrder]);

  const tagGroups = useMemo(() => {
    const groups = new Map<string, FlattenedPlacement[]>();
    const untagged: FlattenedPlacement[] = [];

    filteredPublishedPieces.forEach((placement) => {
      const tags = placement.tags || [];
      if (tags.length === 0) {
        untagged.push(placement);
        return;
      }
      tags.forEach((tag) => {
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push(placement);
      });
    });

    const entries = Array.from(groups.entries())
      .map(([tag, items]) => {
        const onlyCount = items.filter(
          (item) => (item.tags || []).length === 1 && item.tags?.[0] === tag
        ).length;
        return { tag, items, onlyCount, totalCount: items.length };
      })
      .sort((a, b) => a.tag.localeCompare(b.tag));

    return {
      groups: entries,
      untagged: untagged
        .slice()
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
      defaultOpen: entries[0]?.tag ?? null,
    };
  }, [filteredPublishedPieces]);

  const getDraftTags = useCallback((draft: WorkingDocument) => {
    return (
      (draft as { tags_list?: string[] }).tags_list ||
      ((draft as { piece?: { tags_list?: string[] } }).piece?.tags_list ?? [])
    );
  }, []);

  const draftTagGroups = useMemo(() => {
    const groups = new Map<string, WorkingDocument[]>();
    const untagged: WorkingDocument[] = [];

    processedDrafts.forEach((draft) => {
      const tags = getDraftTags(draft);
      if (!tags || tags.length === 0) {
        untagged.push(draft);
        return;
      }
      tags.forEach((tag) => {
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push(draft);
      });
    });

    const entries = Array.from(groups.entries())
      .map(([tag, items]) => {
        const onlyCount = items.filter((item) => {
          const tags = getDraftTags(item);
          return tags.length === 1 && tags[0] === tag;
        }).length;
        return { tag, items, onlyCount, totalCount: items.length };
      })
      .sort((a, b) => a.tag.localeCompare(b.tag));

    return {
      groups: entries,
      untagged: untagged
        .slice()
        .sort((a, b) => new Date(b.last_saved_at).getTime() - new Date(a.last_saved_at).getTime()),
      defaultOpen: entries[0]?.tag ?? null,
    };
  }, [processedDrafts, getDraftTags]);

  const publishedWhereGroups = useMemo(() => {
    const groups = new Map<string, { sponsor: SponsorMeta; items: FlattenedPlacement[] }>();
    filteredPublishedPieces.forEach((item) => {
      const sponsorMeta = getPlacementSponsorMeta(item);
      if (!groups.has(sponsorMeta.key)) {
        groups.set(sponsorMeta.key, { sponsor: sponsorMeta, items: [] });
      }
      groups.get(sponsorMeta.key)!.items.push(item);
    });
    return Array.from(groups.values())
      .map((entry) => ({
        ...entry,
        items: entry.items.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ),
      }))
      .sort((a, b) => a.sponsor.label.localeCompare(b.sponsor.label));
  }, [filteredPublishedPieces, getPlacementSponsorMeta]);

  const draftWhereGroups = useMemo(() => {
    const groups = new Map<string, { sponsor: SponsorMeta; items: WorkingDocument[] }>();
    processedDrafts.forEach((item) => {
      const sponsorMeta = getDraftSponsorMeta(item);
      if (!groups.has(sponsorMeta.key)) {
        groups.set(sponsorMeta.key, { sponsor: sponsorMeta, items: [] });
      }
      groups.get(sponsorMeta.key)!.items.push(item);
    });
    return Array.from(groups.values())
      .map((entry) => ({
        ...entry,
        items: entry.items.sort(
          (a, b) => new Date(b.last_saved_at).getTime() - new Date(a.last_saved_at).getTime()
        ),
      }))
      .sort((a, b) => a.sponsor.label.localeCompare(b.sponsor.label));
  }, [processedDrafts, getDraftSponsorMeta]);

  return (
    <Box>
      {/* Header */}
      <VStack align="stretch" gap={6} mb={4}>
        <HStack justify="space-between" align="center" wrap="wrap" gap={3}>
          <Box>
            <Heading size="xl" color="green.600" mb={2}>
              Writing & Content
            </Heading>
            {/* {sponsor.displayName && <Text color={textSecondary}>{sponsor.displayName}</Text>} */}
          </Box>
          {sponsor.type === "member" && (
            <Button asChild size="sm" variant="outline">
              <NextLink href={`/members/${sponsor.slug}/library`}>View Public Library</NextLink>
            </Button>
          )}
        </HStack>
      </VStack>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={(value) => handleTabChange(value.value)}>
        <Tabs.List mb={6}>
          <Tabs.Trigger value="published">
            <IconArticle size={16} />
            Published ({processedPieces.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="drafts">
            <IconFileText size={16} />
            Drafts ({processedDrafts.length})
          </Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        {/* Search + toolbar row */}
        <Box
          mb={4}
          w="full"
          display="grid"
          gridTemplateColumns="minmax(0, 40%) minmax(0, 60%)"
          columnGap={6}
          alignItems="center"
        >
          <HStack>
            <IconSearch size={16} color="gray" />
            <Input
              placeholder={activeTab === "drafts" ? "Search drafts..." : "Search published..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="subtle"
            />
          </HStack>

          <Box display="flex" justifyContent="flex-end" minW={0}>
            <HStack gap={3} wrap="wrap" justify="flex-end" w="full">
              <DraftFilterToolbar
                showSolo={showSolo}
                showCollab={showCollab}
                onToggleShowSolo={() => setShowSolo(!showSolo)}
                onToggleShowCollab={() => setShowCollab(!showCollab)}
                onShowAll={() => {}}
                onCreateNew={handleStartWriting}
                canCreate={canCreatePost}
                showSoloCollab={true}
                showAllButton={false}
              />
              <Tabs.Root
                value={groupingMode}
                onValueChange={(value) =>
                  handleGroupingModeChange(value.value as "by-list" | "by-tag" | "by-where" | "by-series")
                }
              >
                <Tabs.List>
                  <Tabs.Trigger value="by-list">List</Tabs.Trigger>
                  <Tabs.Trigger value="by-tag">By Tag</Tabs.Trigger>
                  <Tabs.Trigger value="by-where">By Where</Tabs.Trigger>
                  {sponsor.type === "group" && (
                    <Tabs.Trigger value="by-series">By Series</Tabs.Trigger>
                  )}
                  <Tabs.Indicator />
                </Tabs.List>
              </Tabs.Root>
              {groupingMode === "by-list" && (
                <>
                  <Button size="sm" variant="outline" onClick={handleDateSortFieldToggle}>
                    {dateSortField === "recent" ? "Sort: Recent activity" : "Sort: Creation date"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDateSortOrderToggle}>
                    {dateSortOrder === "desc" ? "Newest first" : "Oldest first"}
                  </Button>
                </>
              )}
            </HStack>
          </Box>
        </Box>

        {/* Tab Content */}
        <Tabs.Content value="published">
          {groupingMode === "by-list" ? (
            <UniversalDataTable<FlattenedPlacement>
              data={listPublishedPieces}
              title=""
              isLoading={placementsLoading}
              error={placementsError ? "Failed to load writing" : null}
              columns={postsColumns(
                handleRowClick,
                canManagePosts ? handlePublishedEdit : undefined,
                welcomePinnedPieceId
              )}
              showAvatar={false}
              emptyStateMessage="No published content found"
              showCreateButton={false}
              onRowClick={handleRowClick}
              canView={() => true}
              canEdit={() => canManagePosts}
              pageSize={25}
              defaultSort={{ field: "post_info", order: "desc" }}
            />
          ) : groupingMode === "by-tag" ? (
            <>
              <Heading size="md" color={textSecondary} mb={3}>
                By Tag
              </Heading>
              <Accordion.Root
                collapsible
                multiple
                value={pubTagAcc ?? (tagGroups.defaultOpen ? [tagGroups.defaultOpen] : [])}
                onValueChange={(e) => { setPubTagAcc(e.value); saveAcc("writing_acc_pub_tag", e.value); }}
              >
                {tagGroups.groups.map((group) => (
                  <Accordion.Item key={group.tag} value={group.tag}>
                    <Accordion.ItemTrigger>
                      <HStack justify="space-between" w="full">
                        <HStack gap={3}>
                          <Text fontWeight="semibold"> 🏷️ {group.tag}</Text>
                          <HStack gap={1} fontSize="xs" color="gray.500">
                            <Tooltip content={`${group.onlyCount} pieces have only this tag`}>
                              <Text>({group.onlyCount}</Text>
                            </Tooltip>
                            <Text>/</Text>
                            <Tooltip content={`${group.totalCount} pieces include this tag`}>
                              <Text>{group.totalCount})</Text>
                            </Tooltip>
                          </HStack>
                        </HStack>
                        <Accordion.ItemIndicator />
                      </HStack>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      <Box pt={4}>
                        <UniversalDataTable<FlattenedPlacement>
                          data={group.items}
                          title=""
                          isLoading={placementsLoading}
                          error={placementsError ? "Failed to load writing" : null}
                          columns={postsColumns(
                            handleRowClick,
                            canManagePosts ? handlePublishedEdit : undefined,
                            welcomePinnedPieceId
                          )}
                          showAvatar={false}
                          emptyStateMessage="No published content found"
                          showCreateButton={false}
                          onRowClick={handleRowClick}
                          canView={() => true}
                          canEdit={() => canManagePosts}
                          pageSize={25}
                          defaultSort={{ field: "post_info", order: "desc" }}
                        />
                      </Box>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
              {tagGroups.untagged.length > 0 && (
                <Box mt={6}>
                  <UniversalDataTable<FlattenedPlacement>
                    data={tagGroups.untagged}
                    title="Untagged"
                    isLoading={placementsLoading}
                    error={placementsError ? "Failed to load writing" : null}
                    columns={postsColumns(
                      handleRowClick,
                      canManagePosts ? handlePublishedEdit : undefined,
                      welcomePinnedPieceId
                    )}
                    showAvatar={false}
                    emptyStateMessage="No untagged content found"
                    showCreateButton={false}
                    onRowClick={handleRowClick}
                    canView={() => true}
                    canEdit={() => canManagePosts}
                    pageSize={25}
                    defaultSort={{ field: "post_info", order: "desc" }}
                  />
                </Box>
              )}
            </>
          ) : groupingMode === "by-where" ? (
            <Box maxH="62vh" overflowY="auto" pr={1}>
              <Heading size="md" color={textSecondary} mb={3}>
                By Where
              </Heading>
              <Accordion.Root
                collapsible
                multiple
                value={pubWhereAcc ?? (publishedWhereGroups[0] ? [publishedWhereGroups[0].sponsor.key] : [])}
                onValueChange={(e) => { setPubWhereAcc(e.value); saveAcc("writing_acc_pub_where", e.value); }}
              >
                {publishedWhereGroups.map((group) => (
                  <Accordion.Item key={group.sponsor.key} value={group.sponsor.key}>
                    <Accordion.ItemTrigger>
                      <HStack justify="space-between" w="full">
                        <HStack gap={3}>
                          {renderSponsorSquare(group.sponsor)}
                          <Text fontWeight="semibold">{group.sponsor.label}</Text>
                          <Badge size="sm" variant="subtle">{group.items.length}</Badge>
                        </HStack>
                        <Accordion.ItemIndicator />
                      </HStack>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      <Box pt={4}>
                        <UniversalDataTable<FlattenedPlacement>
                          data={group.items}
                          title=""
                          isLoading={placementsLoading}
                          error={placementsError ? "Failed to load writing" : null}
                          columns={postsColumns(
                            handleRowClick,
                            canManagePosts ? handlePublishedEdit : undefined,
                            welcomePinnedPieceId
                          )}
                          showAvatar={false}
                          emptyStateMessage="No published content found"
                          showCreateButton={false}
                          onRowClick={handleRowClick}
                          canView={() => true}
                          canEdit={() => canManagePosts}
                          pageSize={25}
                          defaultSort={{ field: "post_info", order: "desc" }}
                        />
                      </Box>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </Box>
          ) : groupingMode === "by-series" ? (
            <HStack align="start" gap={0}>
              {/* Phase A — Series left rail */}
              <Box
                w="180px"
                flexShrink={0}
                borderRightWidth="1px"
                borderColor="gray.200"
                pr={3}
                mr={4}
              >
                <VStack align="stretch" gap={0}>
                  {/* All */}
                  <Box
                    px={2}
                    py={2}
                    borderRadius="md"
                    cursor="pointer"
                    bg={selectedSeriesKey === undefined ? 'blue.50' : undefined}
                    fontWeight={selectedSeriesKey === undefined ? 'semibold' : 'normal'}
                    fontSize="sm"
                    onClick={() => setSelectedSeriesKey(undefined)}
                    _hover={{ bg: 'gray.50' }}
                  >
                    All pieces
                  </Box>

                  {/* Named series */}
                  {seriesList.map(s => {
                    const count = [...(Array.isArray(drafts) ? drafts : [])].filter(
                      d => d.piece.series_id === s.id
                    ).length + typedPlacements.filter(p => p.series_id === s.id).length
                    return (
                      <Box
                        key={s.id}
                        px={2}
                        py={2}
                        borderRadius="md"
                        cursor="pointer"
                        bg={selectedSeriesKey === s.id ? 'blue.50' : undefined}
                        fontWeight={selectedSeriesKey === s.id ? 'semibold' : 'normal'}
                        fontSize="sm"
                        onClick={() => setSelectedSeriesKey(s.id)}
                        _hover={{ bg: 'gray.50' }}
                      >
                        <HStack justify="space-between">
                          <Text lineClamp={1}>{s.title}</Text>
                          <Badge size="xs" colorPalette="gray" variant="subtle">{count}</Badge>
                        </HStack>
                      </Box>
                    )
                  })}

                  {/* Unassigned */}
                  <Box
                    px={2}
                    py={2}
                    borderRadius="md"
                    cursor="pointer"
                    bg={selectedSeriesKey === null ? 'blue.50' : undefined}
                    fontWeight={selectedSeriesKey === null ? 'semibold' : 'normal'}
                    fontSize="sm"
                    color="gray.500"
                    onClick={() => setSelectedSeriesKey(null)}
                    _hover={{ bg: 'gray.50' }}
                  >
                    Unassigned
                  </Box>
                </VStack>
              </Box>

              {/* Series group view */}
              <Box flex={1} minW={0}>
                <SeriesGroupView
                  placements={typedPlacements}
                  drafts={Array.isArray(drafts) ? drafts : []}
                  onEdit={onNavigateToEditor}
                  onDetail={(slug: string) => onNavigateToDetail({ id: '', slug })}
                  groupId={sponsor.id}
                  allSeries={seriesList}
                  filterSeriesKey={selectedSeriesKey}
                  onSeriesCreated={() => {
                    void queryClient.invalidateQueries({ queryKey: ['writing', 'series', sponsor.slug] })
                  }}
                  onRefresh={() => {
                    void queryClient.invalidateQueries({ queryKey: ['writing', 'placements', sponsor.type, sponsor.slug] })
                    void queryClient.invalidateQueries({ queryKey: ['writing', 'drafts', sponsor.type, sponsor.slug] })
                  }}
                />
              </Box>
            </HStack>
          ) : null}
        </Tabs.Content>

        <Tabs.Content value="drafts">
          {groupingMode === "by-list" ? (
            <UniversalDataTable<WorkingDocument>
              data={listDrafts}
              title=""
              isLoading={draftsLoading}
              error={null}
              showAvatar={true}
              renderAvatar={(draft: WorkingDocument) => (
                <Avatar.Root size="lg" bg={draft.is_collaborative ? "purple.100" : "gray.100"}>
                  <Avatar.Fallback>
                    {draft.is_collaborative ? (
                      <IconUsersGroup size={20} color="purple" />
                    ) : (
                      <IconUser size={20} color="gray" />
                    )}
                  </Avatar.Fallback>
                </Avatar.Root>
              )}
              emptyStateMessage="No drafts found"
              emptyStateSubtitle="Create a draft to get started"
              actions={[
                {
                  label: "Edit Draft",
                  icon: <IconEdit size={16} />,
                  onClick: handleDraftClick as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                  variant: "ghost",
                  colorScheme: "green",
                },
                {
                  label: "Delete Draft",
                  icon: <IconTrash size={16} />,
                  onClick: handleDeleteDraft as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                  variant: "ghost",
                  colorScheme: "red",
                },
              ]}
              onRowClick={handleDraftClick as any} // eslint-disable-line @typescript-eslint/no-explicit-any
              showCreateButton={false}
              canEdit={() => true}
              canView={() => true}
              renderTitle={renderDraftTitle}
              renderDescription={renderDraftDescription}
              renderMetadata={renderDraftMetadata}
              defaultSort={{ field: "item_info", order: "desc" }}
            />
          ) : groupingMode === "by-tag" ? (
            <>
              <Heading size="md" color={textSecondary} mb={3}>
                By Tag
              </Heading>
              <Accordion.Root
                collapsible
                multiple
                value={draftTagAcc ?? (draftTagGroups.defaultOpen ? [draftTagGroups.defaultOpen] : [])}
                onValueChange={(e) => { setDraftTagAcc(e.value); saveAcc("writing_acc_draft_tag", e.value); }}
              >
                {draftTagGroups.groups.map((group) => (
                  <Accordion.Item key={group.tag} value={group.tag}>
                    <Accordion.ItemTrigger>
                      <HStack justify="space-between" w="full">
                        <HStack gap={3}>
                          <Text fontWeight="semibold"> 🏷️ {group.tag}</Text>
                          <HStack gap={1} fontSize="xs" color="gray.500">
                            <Tooltip content={`${group.onlyCount} pieces have only this tag`}>
                              <Text>({group.onlyCount}</Text>
                            </Tooltip>
                            <Text>/</Text>
                            <Tooltip content={`${group.totalCount} pieces include this tag`}>
                              <Text>{group.totalCount})</Text>
                            </Tooltip>
                          </HStack>
                        </HStack>
                        <Accordion.ItemIndicator />
                      </HStack>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      <Box pt={4}>
                        <UniversalDataTable<WorkingDocument>
                          data={group.items}
                          title=""
                          isLoading={draftsLoading}
                          error={null}
                          showAvatar={true}
                          renderAvatar={(draft: WorkingDocument) => (
                            <Avatar.Root size="lg" bg={draft.is_collaborative ? "purple.100" : "gray.100"}>
                              <Avatar.Fallback>
                                {draft.is_collaborative ? (
                                  <IconUsersGroup size={20} color="purple" />
                                ) : (
                                  <IconUser size={20} color="gray" />
                                )}
                              </Avatar.Fallback>
                            </Avatar.Root>
                          )}
                          emptyStateMessage="No drafts found"
                          emptyStateSubtitle="Create a draft to get started"
                          actions={[
                            {
                              label: "Edit Draft",
                              icon: <IconEdit size={16} />,
                              onClick: handleDraftClick as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                              variant: "ghost",
                              colorScheme: "green",
                            },
                                        {
                              label: "Delete Draft",
                              icon: <IconTrash size={16} />,
                              onClick: handleDeleteDraft as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                              variant: "ghost",
                              colorScheme: "red",
                            },
                          ]}
                          onRowClick={handleDraftClick as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                          showCreateButton={false}
                          canEdit={() => true}
                          canView={() => true}
                          renderTitle={renderDraftTitle}
                          renderDescription={renderDraftDescription}
                          renderMetadata={renderDraftMetadata}
                          defaultSort={{ field: "item_info", order: "desc" }}
                        />
                      </Box>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
              {draftTagGroups.untagged.length > 0 && (
                <Box mt={6}>
                  <UniversalDataTable<WorkingDocument>
                    data={draftTagGroups.untagged}
                    title="Untagged"
                    isLoading={draftsLoading}
                    error={null}
                    showAvatar={true}
                    renderAvatar={(draft: WorkingDocument) => (
                      <Avatar.Root size="lg" bg={draft.is_collaborative ? "purple.100" : "gray.100"}>
                        <Avatar.Fallback>
                          {draft.is_collaborative ? (
                            <IconUsersGroup size={20} color="purple" />
                          ) : (
                            <IconUser size={20} color="gray" />
                          )}
                        </Avatar.Fallback>
                      </Avatar.Root>
                    )}
                    emptyStateMessage="No untagged drafts found"
                    emptyStateSubtitle="Add tags to organize your drafts"
                    actions={[
                      {
                        label: "Edit Draft",
                        icon: <IconEdit size={16} />,
                        onClick: handleDraftClick as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                        variant: "ghost" as const,
                        colorScheme: "green",
                      },
                      ...(sponsor.type === "group" ? [{
                        label: "Make Living Book",
                        icon: <IconBook size={16} />,
                        onClick: ((draft: WorkingDocument) => setPromotingPiece({ slug: draft.piece.slug, title: draft.title || draft.piece.title || "Untitled" })) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                        variant: "ghost" as const,
                        colorScheme: "blue",
                      }] : []),
                      {
                        label: "Delete Draft",
                        icon: <IconTrash size={16} />,
                        onClick: handleDeleteDraft as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                        variant: "ghost" as const,
                        colorScheme: "red",
                      },
                    ]}
                    onRowClick={handleDraftClick as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                    showCreateButton={false}
                    canEdit={() => true}
                    canView={() => true}
                    renderTitle={renderDraftTitle}
                    renderDescription={renderDraftDescription}
                    renderMetadata={renderDraftMetadata}
                    defaultSort={{ field: "item_info", order: "desc" }}
                  />
                </Box>
              )}
            </>
          ) : (
            <Box maxH="62vh" overflowY="auto" pr={1}>
              <Heading size="md" color={textSecondary} mb={3}>
                By Where
              </Heading>
              <Accordion.Root
                collapsible
                multiple
                value={draftWhereAcc ?? (draftWhereGroups[0] ? [draftWhereGroups[0].sponsor.key] : [])}
                onValueChange={(e) => { setDraftWhereAcc(e.value); saveAcc("writing_acc_draft_where", e.value); }}
              >
                {draftWhereGroups.map((group) => (
                  <Accordion.Item key={group.sponsor.key} value={group.sponsor.key}>
                    <Accordion.ItemTrigger>
                      <HStack justify="space-between" w="full">
                        <HStack gap={3}>
                          {renderSponsorSquare(group.sponsor)}
                          <Text fontWeight="semibold">{group.sponsor.label}</Text>
                          <Badge size="sm" variant="subtle">{group.items.length}</Badge>
                        </HStack>
                        <Accordion.ItemIndicator />
                      </HStack>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      <Box pt={4}>
                        <UniversalDataTable<WorkingDocument>
                          data={group.items}
                          title=""
                          isLoading={draftsLoading}
                          error={null}
                          showAvatar={true}
                          renderAvatar={(draft: WorkingDocument) => (
                            <Avatar.Root size="lg" bg={draft.is_collaborative ? "purple.100" : "gray.100"}>
                              <Avatar.Fallback>
                                {draft.is_collaborative ? (
                                  <IconUsersGroup size={20} color="purple" />
                                ) : (
                                  <IconUser size={20} color="gray" />
                                )}
                              </Avatar.Fallback>
                            </Avatar.Root>
                          )}
                          emptyStateMessage="No drafts found"
                          emptyStateSubtitle="Create a draft to get started"
                          actions={[
                            {
                              label: "Edit Draft",
                              icon: <IconEdit size={16} />,
                              onClick: handleDraftClick as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                              variant: "ghost",
                              colorScheme: "green",
                            },
                                        {
                              label: "Delete Draft",
                              icon: <IconTrash size={16} />,
                              onClick: handleDeleteDraft as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                              variant: "ghost",
                              colorScheme: "red",
                            },
                          ]}
                          onRowClick={handleDraftClick as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                          showCreateButton={false}
                          canEdit={() => true}
                          canView={() => true}
                          renderTitle={renderDraftTitle}
                          renderDescription={renderDraftDescription}
                          renderMetadata={renderDraftMetadata}
                          defaultSort={{ field: "item_info", order: "desc" }}
                        />
                      </Box>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </Box>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <DialogRoot open={!!deletingDraft} onOpenChange={({ open: o }) => !o && setDeletingDraft(null)}>
        <DialogContent>
          <DialogHeader>Delete draft?</DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <Text>
              Delete &ldquo;{deletingDraft?.title || "Untitled draft"}&rdquo;? This action cannot be undone.
            </Text>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingDraft(null)}>Cancel</Button>
            <Button
              colorPalette="red"
              onClick={() => {
                if (deletingDraft) deleteDraft.mutate(deletingDraft.id as string);
                setDeletingDraft(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {sponsor.type === "group" && (
        <PromotionDialog
          pieceSlug={promotingPiece?.slug ?? ""}
          pieceTitle={promotingPiece?.title ?? ""}
          open={!!promotingPiece}
          onClose={() => setPromotingPiece(null)}
          groupSlug={sponsor.slug}
        />
      )}

    </Box>
  );
}
