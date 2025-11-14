"use client";

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Stack,
  Badge,
  Button,
  Input,
  Card,
  Link,
  useDisclosure,
  Portal,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { createStandaloneToast } from "@chakra-ui/toast";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import {
  IconUser,
  IconCalendar,
  IconPin,
  IconSpeakerphone,
  IconArticle,
  IconFilter,
  IconSearch
} from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import AdminModal from "@components/admin/AdminModal";
import { GroupPostForm } from "./GroupPostForm";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { Divider } from "@components/common/Divider";
import CreateGroupPieceModal from "./writing/CreateGroupPieceModal";
import GroupWriteWorkArea from "./writing/GroupWriteWorkArea";

// import CreateGroupPieceModal from './CreateGroupPieceModal';
// import GroupWriteWorkArea from './GroupWriteWorkArea';

const { toast } = createStandaloneToast();

interface GroupPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  author_name: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  frontend_url: string;
  description?: string;
  is_pinned?: boolean;
  is_announcement?: boolean;
  comment_count?: number;
  view_count?: number;
}

interface GroupPostsWorkAreaProps {
  groupSlug: string;
  groupName?: string;
  canCreatePost?: boolean;
  canManagePosts?: boolean;
}

export default function GroupPostsWorkArea({
  groupSlug,
  groupName,
  canCreatePost = true,
  canManagePosts = false
}: GroupPostsWorkAreaProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const { open, onOpen, onClose } = useDisclosure();
  const [selectedPostType, setSelectedPostType] = useState<"post" | "announcement">("post");

  const composerDisclosure = useDisclosure();
  const [composerPieceId, setComposerPieceId] = useState<string | null>(null);


  // Create collections for selects
  const statusCollection = createListCollection({
    items: [
      { label: "All Status", value: "all" },
      { label: "Published", value: "published" },
      { label: "Drafts", value: "draft" },
      { label: "Archived", value: "archived" },
    ]
  });

  const typeCollection = createListCollection({
    items: [
      { label: "All Types", value: "all" },
      { label: "Announcements", value: "announcement" },
      { label: "Regular Posts", value: "post" },
    ]
  });

  const sortCollection = createListCollection({
    items: [
      { label: "Most Recent", value: "recent" },
      { label: "Recently Updated", value: "updated" },
      { label: "Most Viewed", value: "popular" },
      { label: "Most Discussed", value: "discussed" },
    ]
  });

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const statsBg = useColorModeValue("gray.50", "gray.700");

  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<GroupPost[], { message: string }>({
    queryKey: ["groupPosts", groupSlug, statusFilter, typeFilter, sortBy],
    queryFn: () =>
      axiosInstance.get(`/api/groups/${groupSlug}/posts`, {
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          sort: sortBy,
        }
      }).then((res) => res.data),
  });

  // actions
  const createDisclosure = useDisclosure();             // replaces: const { open, onOpen, onClose } = useDisclosure()

  const openComposer = useCallback((pieceId: string) => {
    setComposerPieceId(pieceId);
    composerDisclosure.onOpen();
  }, [composerDisclosure]);

  const handleCreatePost = (type: "post" | "announcement") => {
    setSelectedPostType(type);
    createDisclosure.onOpen();
  };

  const handleRowClick = useCallback((post: GroupPost) => {
    if (canManagePosts) {
      openComposer(post.id);
    } else {
      window.open(post.frontend_url, "_blank");
    }
  }, [canManagePosts, openComposer]);

  // Filter and sort posts
  const processedPosts = posts
    .filter((post: GroupPost) => {
      // Search filter
      const matchesSearch = !searchFilter ||
        post.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        post.author_name?.toLowerCase().includes(searchFilter.toLowerCase());

      return matchesSearch;
    })
    .sort((a: GroupPost, b: GroupPost) => {
      // Pin announcements and pinned posts to top
      if (a.is_pinned && !b.is_pinned) return -1;
      if (b.is_pinned && !a.is_pinned) return 1;
      if (a.is_announcement && !b.is_announcement) return -1;
      if (b.is_announcement && !a.is_announcement) return 1;

      // Then sort by selected criteria
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "popular":
          return (b.view_count || 0) - (a.view_count || 0);
        case "discussed":
          return (b.comment_count || 0) - (a.comment_count || 0);
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    total: posts.length,
    published: posts.filter((p: GroupPost) => p.status === "published").length,
    drafts: posts.filter((p: GroupPost) => p.status === "draft").length,
    announcements: posts.filter((p: GroupPost) => p.is_announcement).length,
  };

  // Create column helper for the table
  const columnHelper = createColumnHelper<GroupPost>();

  // Define custom columns for posts
  const columns: ColumnDef<GroupPost>[] = [
    columnHelper.display({
      id: "post_info",
      header: "Posts & Announcements",
      cell: ({ row }) => {
        const post = row.original;

        return (
          <VStack align="start" gap={2} w="full">
            <HStack gap={2} w="full" align="start">
              {/* Post Type Icons */}
              <Box flexShrink={0} pt={1}>
                {post.is_announcement ? (
                  <IconSpeakerphone size={16} color="orange" />
                ) : (
                  <IconArticle size={16} color="blue" />
                )}
              </Box>

              <VStack align="start" gap={1} flex={1} minW={0}>
                <HStack gap={2} w="full" align="center">
                  <Link
                    href={post.frontend_url}
                    color="blue.600"
                    fontWeight="semibold"
                    fontSize="md"
                    _hover={{ color: "blue.800", textDecoration: "underline" }}
                    flex={1}
                    lineClamp={1}
                  >
                    {post.title}
                  </Link>

                  {post.is_pinned && (
                    <IconPin size={14} color="orange" />
                  )}
                </HStack>

                {post.description && (
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    lineClamp={2}
                    wordBreak="break-word"
                  >
                    {post.description}
                  </Text>
                )}

                <Stack direction="row" align="center" gap={4} flexWrap="wrap">
                  <Badge
                    colorScheme={
                      post.is_announcement ? "orange" :
                      post.status === "published" ? "green" :
                      post.status === "draft" ? "yellow" :
                      post.status === "archived" ? "gray" : "blue"
                    }
                    size="sm"
                  >
                    {post.is_announcement ? "Announcement" : post.status}
                  </Badge>

                  <Text
                    fontSize="xs"
                    color="gray.600"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <IconUser size={12} />
                    {post.author_name}
                  </Text>

                  <Text
                    fontSize="xs"
                    color="gray.500"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <IconCalendar size={12} />
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>

                  {(post.comment_count || post.view_count) && (
                    <HStack gap={3}>
                      {post.view_count && (
                        <Text fontSize="xs" color="gray.500">
                          {post.view_count} views
                        </Text>
                      )}
                      {post.comment_count && (
                        <Text fontSize="xs" color="gray.500">
                          {post.comment_count} comments
                        </Text>
                      )}
                    </HStack>
                  )}
                </Stack>
              </VStack>
            </HStack>
          </VStack>
        );
      },
    }),
  ];

  // const handleCreatePost = (type: "post" | "announcement") => {
  //   setSelectedPostType(type);
  //   onOpen();
  // };

  return (
    <Box>
      {/* Header with Stats */}
      <VStack align="stretch" gap={6} mb={8}>
        <Box>
          <Heading size="xl" color="green.600" mb={2}>
            Posts & Announcements
          </Heading>
          {groupName && (
            <Text color="gray.600" fontSize="lg">
              {groupName}
            </Text>
          )}
        </Box>

        {/* Stats Cards */}
        <Stack direction={{ base: "column", md: "row" }} gap={4}>
          <Card.Root bg={statsBg} p={4} flex={1}>
            <Card.Body>
              <VStack gap={1}>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {stats.total}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Posts</Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={statsBg} p={4} flex={1}>
            <Card.Body>
              <VStack gap={1}>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {stats.published}
                </Text>
                <Text fontSize="sm" color="gray.600">Published</Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={statsBg} p={4} flex={1}>
            <Card.Body>
              <VStack gap={1}>
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {stats.announcements}
                </Text>
                <Text fontSize="sm" color="gray.600">Announcements</Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={statsBg} p={4} flex={1}>
            <Card.Body>
              <VStack gap={1}>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
                  {stats.drafts}
                </Text>
                <Text fontSize="sm" color="gray.600">Drafts</Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Stack>
      </VStack>

      {/* Filters and Actions */}
      <Card.Root bg={cardBg} border="1px solid" borderColor={borderColor} mb={6}>
        <Card.Body>
          <Stack direction={{ base: "column", lg: "row" }} gap={4} align="center">
            {/* Search */}
            <HStack flex={1}>
              <IconSearch size={16} color="gray" />
              <Input
                placeholder="Search posts and announcements..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                variant="subtle"
              />
            </HStack>

            {/* Filters */}
            <HStack gap={2} flexShrink={0}>
              <IconFilter size={16} color="gray" />

              <Select.Root
                value={[statusFilter]}
                onValueChange={({ value }) => {
                  setStatusFilter(value[0]);
                }}
                collection={statusCollection}
                size="sm"
              >
                <Select.Control minW="120px">
                  <Select.Trigger>
                    <Select.ValueText placeholder="All Status" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {statusCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>

              <Select.Root
                value={[typeFilter]}
                onValueChange={({ value }) => {
                  setTypeFilter(value[0]);
                }}
                collection={typeCollection}
                size="sm"
              >
                <Select.Control minW="140px">
                  <Select.Trigger>
                    <Select.ValueText placeholder="All Types" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {typeCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>

              <Select.Root
                value={[sortBy]}
                onValueChange={({ value }) => {
                  setSortBy(value[0]);
                }}
                collection={sortCollection}
                size="sm"
              >
                <Select.Control minW="120px">
                  <Select.Trigger>
                    <Select.ValueText placeholder="Sort By" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {sortCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </HStack>

            {/* Create Actions */}
            {canCreatePost && (
              <HStack gap={2} flexShrink={0}>
                <Button
                  colorScheme="orange"
                  size="sm"
                  onClick={() => handleCreatePost("announcement")}
                >
                  <IconSpeakerphone size={16} />
                  New Announcement
                </Button>
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={() => handleCreatePost("post")}
                >
                  <IconArticle size={16} />
                  New Post
                </Button>
              </HStack>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>

      <Box mb={6}>
        <Divider />
      </Box>

      {/* Posts Table */}
      <UniversalDataTable<GroupPost>
        data={processedPosts}
        title=""
        isLoading={isLoading}
        error={error?.message || null}
        columns={columns}
        showAvatar={false}
        emptyStateMessage="No posts found"
        emptyStateSubtitle={
          searchFilter || statusFilter !== "all" || typeFilter !== "all"
            ? "Try adjusting your filters to see more results"
            : "Create your first post or announcement to get started"
        }
        showCreateButton={false} // We have custom create buttons above
        onRowClick={handleRowClick}
        canView={() => true}
        canEdit={(post) => canManagePosts || post.author_id === "current_user_id"} // Adjust based on your auth
        pageSize={25}
        defaultSort={{ field: "post_info", order: "desc" }}
        actions={canManagePosts ? [
          {
            label: "Pin Post",
            icon: <IconPin size={14} />,
            onClick: (post) => {
              // TODO: PATCH /writing/pieces/:id/pin
              console.log("Toggle pin for post:", post.id);
            },
            variant: "ghost",
            colorScheme: "orange",
            showIf: (post) => !post.is_pinned
          }
        ] : []}
      />

      {/* Create Piece Modal (uses new WritingPiece flow) */}
      <AdminModal
        title={`Create New ${selectedPostType === "announcement" ? "Announcement" : "Post"}`}
        isOpen={createDisclosure.open}
        onClose={createDisclosure.onClose}
      >
        <CreateGroupPieceModal
          groupSlug={groupSlug}
          defaultKind={selectedPostType}
          onCreated={(pieceId) => {
            createDisclosure.onClose();
            openComposer(pieceId);         // open composer after create
            refetch();
            toast({ title: "Draft created", status: "success" });
          }}
        />
      </AdminModal>

      {/* Composer Modal */}
      <AdminModal
        title="Compose"
        isOpen={composerDisclosure.open}
        onClose={composerDisclosure.onClose}
        size="6xl"
      >
        {composerPieceId && (
          <GroupWriteWorkArea
            pieceId={composerPieceId}
            groupSlug={groupSlug}
            onClose={composerDisclosure.onClose}
          />
        )}
      </AdminModal>

    </Box>
  );
}