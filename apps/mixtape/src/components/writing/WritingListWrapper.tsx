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
} from "@chakra-ui/react";
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
} from "@tabler/icons-react";
import { DraftFilterToolbar } from "./DraftFilterToolbar";
import { useColorModeValue } from "@components/ui/color-mode";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { formatDistanceToNow } from "date-fns";
import { useWriting, useWritingMutations } from "@hooks/useWriting";
import { FlattenedPlacement, WritingWorkingCopy } from "@mixtape/core/types/writingTypes";
import { postsColumns } from "../groups/tabs/columns/postsColumns";
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
  const [groupByTags, setGroupByTags] = useState(false);

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
        setGroupByTags(true);
      }
    } catch (error) {
      console.warn("Failed to load saved writing tab:", error);
    }
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

  const handleToggleGroupByTags = useCallback(() => {
    setGroupByTags((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("writing_group_by_tags", String(next));
        } catch (error) {
          console.warn("Failed to save tag grouping:", error);
        }
      }
      return next;
    });
  }, []);

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
    (draft: WritingWorkingCopy) => {
      onNavigateToEditor(draft.piece.id);
    },
    [onNavigateToEditor]
  );

  const handleDeleteDraft = useCallback(
    (draft: WritingWorkingCopy) => {
      const title = draft.title || "Untitled draft";
      if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
      deleteDraft.mutate(draft.id as string);
    },
    [deleteDraft]
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
  const searchInDraft = (draft: WritingWorkingCopy, searchTerm: string): boolean => {
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


  const processedPieces = typedPlacements
    .filter((p: FlattenedPlacement) => p.piece_status === 'published')
    .sort((a: FlattenedPlacement, b: FlattenedPlacement) => {
      if (a.pinned_at && !b.pinned_at) return -1;
      if (b.pinned_at && !a.pinned_at) return 1;
      if (a.is_announcement && !b.is_announcement) return -1;
      if (b.is_announcement && !a.is_announcement) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

  const processedDrafts = (Array.isArray(drafts) ? drafts : [])
    .filter((draft: WritingWorkingCopy) => {
      // If both filters are off, show nothing
      if (!showSolo && !showCollab) return false;

      const isCollab = draft.is_collaborative;
      if (showSolo && !showCollab && isCollab) return false;
      if (!showSolo && showCollab && !isCollab) return false;

      // Otherwise, apply search filter
      return searchInDraft(draft, searchFilter);
    })
    .sort((a: WritingWorkingCopy, b: WritingWorkingCopy) => {
      return new Date(b.last_saved_at).getTime() - new Date(a.last_saved_at).getTime();
    });

  // Custom renderers for drafts
  const renderDraftTitle = (draft: WritingWorkingCopy) => {
    const displayTitle = draft.title || "Untitled Draft";
    const isCollab = draft.is_collaborative;

    return (
      <HStack gap={2} align="center" wrap="wrap">
        {/* Icon: Different for solo vs collab */}
        {isCollab ? (
          <IconUsersGroup size={18} color="purple" />
        ) : (
          <IconUser size={18} color="gray" />
        )}

        <Text fontWeight="semibold" fontSize="md" color="gray.900" _dark={{ color: "white" }} lineClamp={1}>
          {displayTitle}
        </Text>

        <Badge size="sm" bg={badgeBg} color={badgeColor} px={2} py={1} rounded="full">
          Draft
        </Badge>

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

  const renderDraftDescription = (draft: WritingWorkingCopy) => {
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

  const renderDraftMetadata = (draft: WritingWorkingCopy) => {
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

  const filteredPublishedPieces = processedPieces.filter(matchesPublishedSearch);

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
        .sort((a, b) => (a.piece_title || "").localeCompare(b.piece_title || "")),
      defaultOpen: entries[0]?.tag ?? null,
    };
  }, [filteredPublishedPieces]);

  const getDraftTags = useCallback((draft: WritingWorkingCopy) => {
    return (
      (draft as { tags_list?: string[] }).tags_list ||
      ((draft as { piece?: { tags_list?: string[] } }).piece?.tags_list ?? [])
    );
  }, []);

  const draftTagGroups = useMemo(() => {
    const groups = new Map<string, WritingWorkingCopy[]>();
    const untagged: WritingWorkingCopy[] = [];

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
        .sort((a, b) => (a.title || "").localeCompare(b.title || "")),
      defaultOpen: entries[0]?.tag ?? null,
    };
  }, [processedDrafts, getDraftTags]);

  return (
    <Box>
      {/* Header */}
      <VStack align="stretch" gap={6} mb={4}>
        <Box>
          <Heading size="xl" color="green.600" mb={2}>
            Writing & Content
          </Heading>
          {/* {sponsor.displayName && <Text color={textSecondary}>{sponsor.displayName}</Text>} */}
        </Box>
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
            <DraftFilterToolbar
              showSolo={showSolo}
              showCollab={showCollab}
              onToggleShowSolo={() => setShowSolo(!showSolo)}
              onToggleShowCollab={() => setShowCollab(!showCollab)}
              onShowAll={() => {}}
              onCreateNew={handleStartWriting}
              canCreate={canCreatePost}
              showGroupByTags={groupByTags}
              onToggleGroupByTags={handleToggleGroupByTags}
              showSoloCollab={true}
              showAllButton={false}
              groupByTagsWidth="140px"
            />
          </Box>
        </Box>

        {/* Tab Content */}
        <Tabs.Content value="published">
          {groupByTags ? (
            <>
              <Heading size="md" color={textSecondary} mb={3}>
                By Tag
              </Heading>
              <Accordion.Root
                collapsible
                multiple
                defaultValue={tagGroups.defaultOpen ? [tagGroups.defaultOpen] : []}
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
                            canManagePosts ? handlePublishedEdit : undefined
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
                      canManagePosts ? handlePublishedEdit : undefined
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
          ) : (
            <UniversalDataTable<FlattenedPlacement>
              data={filteredPublishedPieces}
              title=""
              isLoading={placementsLoading}
              error={placementsError ? "Failed to load writing" : null}
              columns={postsColumns(
                handleRowClick,
                canManagePosts ? handlePublishedEdit : undefined
              )}
              showAvatar={false}
              emptyStateMessage="No published content found"
              emptyStateSubtitle={
                searchFilter ? "Try adjusting your search to see more results" : "Create your first post to get started"
              }
              showCreateButton={false}
              onRowClick={handleRowClick}
              canView={() => true}
              canEdit={() => canManagePosts}
              pageSize={25}
              defaultSort={{ field: "post_info", order: "desc" }}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="drafts">
          {groupByTags ? (
            <>
              <Heading size="md" color={textSecondary} mb={3}>
                By Tag
              </Heading>
              <Accordion.Root
                collapsible
                multiple
                defaultValue={draftTagGroups.defaultOpen ? [draftTagGroups.defaultOpen] : []}
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
                        <UniversalDataTable<WritingWorkingCopy>
                          data={group.items}
                          title=""
                          isLoading={draftsLoading}
                          error={null}
                          showAvatar={true}
                          renderAvatar={(draft: WritingWorkingCopy) => (
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
                  <UniversalDataTable<WritingWorkingCopy>
                    data={draftTagGroups.untagged}
                    title="Untagged"
                    isLoading={draftsLoading}
                    error={null}
                    showAvatar={true}
                    renderAvatar={(draft: WritingWorkingCopy) => (
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
              )}
            </>
          ) : (
            <UniversalDataTable<WritingWorkingCopy>
              data={processedDrafts}
              title=""
              isLoading={draftsLoading}
              error={null}
              showAvatar={true}
              renderAvatar={(draft: WritingWorkingCopy) => (
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
              emptyStateMessage={
                !showSolo && !showCollab
                  ? "All documents hidden"
                  : showSolo && !showCollab
                  ? "No solo drafts found"
                  : !showSolo && showCollab
                  ? "No collaborative drafts found"
                  : "No drafts found"
              }
              emptyStateSubtitle={
                !showSolo && !showCollab
                  ? "Click 'All' or select 'Solo' or 'Collab' to view your drafts"
                  : showSolo && !showCollab
                  ? "Start writing to create your first solo draft"
                  : !showSolo && showCollab
                  ? "Enable collaboration on a draft or join a collaborative writing session"
                  : "Create a draft to get started"
              }
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
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
