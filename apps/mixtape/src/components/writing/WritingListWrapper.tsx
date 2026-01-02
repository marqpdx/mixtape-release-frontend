// src/components/writing/WritingListWrapper.tsx
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
  Button,
  Input,
  Tabs,
  Avatar
} from "@chakra-ui/react";
import { Tooltip } from "@components/ui/tooltip";
import { useCallback, useState, useEffect } from "react";
import {
  IconSearch,
  IconClock,
  IconEdit,
  IconPlus,
  IconArticle,
  IconFileText,
  IconUsers,
  IconUsersGroup,
  IconUser,
} from "@tabler/icons-react";
import { DraftFilterToolbar } from "./DraftFilterToolbar";
import { useColorModeValue } from "@components/ui/color-mode";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { formatDistanceToNow } from "date-fns";
import { useWriting } from "@hooks/useWriting";
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
  onNavigateToDetail: (pieceSlug: string) => void;
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
 *   onNavigateToDetail={(slug) => router.push(`/groups/my-group/writing/${slug}`)}
 * />
 *
 * // For a member
 * <WritingListWrapper
 *   sponsor={{ type: 'member', slug: 'username', displayName: 'John Doe' }}
 *   canCreatePost={true}
 *   canManagePosts={true}
 *   onNavigateToEditor={(slug) => router.push(`/writing/edit/${slug || 'new'}`)}
 *   onNavigateToDetail={(slug) => router.push(`/writing/${slug}`)}
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

  // Load persisted tab from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedTab = window.localStorage.getItem("writing_active_tab");
      if (savedTab && (savedTab === "published" || savedTab === "drafts")) {
        setActiveTab(savedTab);
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
    setShowCollab
  } = useWriting(sponsor.type, sponsor.slug);

  console.log("WritingListWrapper - placements:", placements);
  console.log("WritingListWrapper - drafts:", drafts);


  // Ensure placements is always an array to prevent .filter() errors
  const typedPlacements = (Array.isArray(placements) ? placements : []) as FlattenedPlacement[];

  const handleRowClick = (placement: FlattenedPlacement) => {
    onNavigateToDetail(placement.piece_slug);
  };

  const handleDraftClick = useCallback(
    (draft: WritingWorkingCopy) => {
      onNavigateToEditor(draft.piece.id);
    },
    [onNavigateToEditor]
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

        {/* Only show collaborator count badge for collaborative docs */}
        {isCollab && draft.collaborator_count > 0 && (
          <Badge size="sm" colorScheme="purple" px={2} py={1} rounded="full">
            {draft.collaborator_count} collaborator{draft.collaborator_count !== 1 ? 's' : ''}
          </Badge>
        )}
      </HStack>
    );
  };

  const renderDraftDescription = (draft: WritingWorkingCopy) => {
    const excerpt = draft.excerpt;

    if (!excerpt) {
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

        {/* Collaborator Avatars */}
        {draft.is_collaborative &&
          draft.collaborators &&
          draft.collaborators.length > 0 && (
            <HStack gap={2}>
              <IconUsers size={14} color="gray" />
              <HStack gap={-2}>
                {draft.collaborators.slice(0, 4).map((collab) => {
                  const displayName = getCollaboratorDisplayName(collab);
                  const initials = getInitialsFromName(displayName);

                  return (
                    <Tooltip
                      key={collab.id}
                      content={`${displayName} (@${collab.user.username}) - ${collab.role}`}
                    >
                      <Avatar.Root
                        size="xs"
                        colorPalette={collab.role === "editor" ? "blue" : "purple"}
                      >
                        {/* If you later wire up avatar URLs, drop an Avatar.Image here */}
                        {/* <Avatar.Image src={collab.user.profile?.avatar} alt={displayName} /> */}

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
            </HStack>
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

        {/* Search (only for published tab, drafts have toolbar) */}
        {activeTab === "published" && (
          <HStack justify="space-between" mb={6}>
            <HStack flex={1} maxW="400px">
              <IconSearch size={16} color="gray" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                variant="subtle"
              />
            </HStack>

            {canCreatePost && (
              <Button colorScheme="green" size="sm" onClick={handleStartWriting} gap={2}>
                <IconPlus size={16} />
                New Writing
              </Button>
            )}
          </HStack>
        )}

        {/* Search for drafts tab */}
        {activeTab === "drafts" && (
          <HStack flex={1} maxW="400px" mb={4}>
            <IconSearch size={16} color="gray" />
            <Input
              placeholder="Search drafts..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="subtle"
            />
          </HStack>
        )}

        {/* Tab Content */}
        <Tabs.Content value="published">
          <UniversalDataTable<FlattenedPlacement>
            data={processedPieces}
            title=""
            isLoading={placementsLoading}
            error={placementsError ? "Failed to load writing" : null}
            columns={postsColumns(handleRowClick)}
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
        </Tabs.Content>

        <Tabs.Content value="drafts">
          {/* Compact Filter Toolbar */}
          <DraftFilterToolbar
            showSolo={showSolo}
            showCollab={showCollab}
            onToggleShowSolo={() => setShowSolo(!showSolo)}
            onToggleShowCollab={() => setShowCollab(!showCollab)}
            onShowAll={() => {
              setShowSolo(true);
              setShowCollab(true);
            }}
            onCreateNew={handleStartWriting}
            canCreate={canCreatePost}
          />

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
                ? "Click 'All' or select 'Mine' or 'Collab' to view your drafts"
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
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
