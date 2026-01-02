// src/components/threadworks/ConversationCard.tsx

"use client"

import React, { useState, useMemo } from "react";
import {
  Box,
  Heading,
  Textarea,
  Button,
  VStack,
  Text,
  HStack,
  Avatar,
  Badge,
  Flex,
  Input,
  InputGroup
} from "@chakra-ui/react";
import { Divider } from "@components/common/Divider";
import {
  IconMessageCircle,
  IconClock,
  IconUser,
  IconPin,
  IconLock,
  IconSearch,
  IconChevronDown,
  IconChevronUp
} from "@tabler/icons-react";
import { toaster } from "@mixtape/core/lib/toaster";

// -----------------------------
// Types
// -----------------------------

interface User {
  id: string;
  name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  author: User;
  content: string;
  created_at: string;
  parent?: string | null;
  replies?: Post[];
}

interface Topic {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  last_posted_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  author: User;
  post_count: number;
  posts?: Post[];
  last_post?: {
    author: User;
    created_at: string;
  };
}

interface ConversationCardProps {
  topic: Topic;
  onReply?: (topicSlug: string, content: string, parentPostId?: string) => Promise<void>;
  searchTerm?: string;
}

// -----------------------------
// Helper Functions
// -----------------------------

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};

const getDisplayName = (user: User): string => {
  if (user.name) return user.name;
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.username || 'Unknown User';
};

const getTotalReplies = (posts: Post[]): number => {
  return posts.length - 1; // Subtract 1 for the main post
};

const getRecentParticipants = (posts: Post[], limit: number = 10): User[] => {
  const participantMap = new Map<string, { user: User; lastActivity: string }>();

  // Find the conversation starter (author of the first post)
  const conversationStarter = posts[0]?.author;

  posts.forEach(post => {
    const existing = participantMap.get(post.author.id);
    if (!existing || new Date(post.created_at) > new Date(existing.lastActivity)) {
      participantMap.set(post.author.id, {
        user: post.author,
        lastActivity: post.created_at
      });
    }
  });

  const allParticipants = Array.from(participantMap.values())
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .map(p => p.user);

  // Put conversation starter first, then others
  const starterFirst = conversationStarter
    ? [conversationStarter, ...allParticipants.filter(p => p.id !== conversationStarter.id)]
    : allParticipants;

  return starterFirst.slice(0, limit);
};

interface PostWithChildren extends Post {
  children: PostWithChildren[];
}

const ThreadedPostTree = ({
  post,
  level = 0,
  searchTerm = "",
  onReplyToPost,
  maxLevel = 3
}: {
  post: PostWithChildren;
  level?: number;
  searchTerm?: string;
  onReplyToPost?: (postId: string) => void;
  maxLevel?: number;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasChildren = post.children.length > 0;
  const shouldFlatten = level >= maxLevel;

  return (
    <Box>
      {/* Main post */}
      <Box
        pl={level * 4}
        borderLeft={level > 0 ? "2px solid" : undefined}
        borderLeftColor={level > 0 ? "blue.100" : undefined}
        position="relative"
      >
        {/* Connection line for nested posts */}
        {level > 0 && (
          <Box
            position="absolute"
            left={`${level * 16 - 16}px`}
            top="20px"
            width="16px"
            height="2px"
            bg="blue.100"
          />
        )}

        <Box py={2}>
          <HStack gap={3} align="start">
            <Avatar.Root size="sm" flexShrink={0}>
              {post.author.avatar_url && <Avatar.Image src={post.author.avatar_url} />}
              <Avatar.Fallback>{getDisplayName(post.author).charAt(0)}</Avatar.Fallback>
            </Avatar.Root>

            <Box flex={1}>
              <HStack gap={2} align="center" mb={1}>
                <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                  {getDisplayName(post.author)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatTimeAgo(post.created_at)}
                </Text>
                {level > 0 && (
                  <Badge size="sm" colorScheme="blue" variant="subtle">
                    Reply
                  </Badge>
                )}
                {hasChildren && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    fontSize="xs"
                  >
                    {isCollapsed ? `+${post.children.length}` : `−${post.children.length}`}
                  </Button>
                )}
              </HStack>

              <Text fontSize="sm" lineHeight="1.5" color="gray.800" mb={2}>
                {searchTerm ? highlightSearchTerm(post.content, searchTerm) : post.content}
              </Text>

              {onReplyToPost && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onReplyToPost(post.id)}
                  fontSize="xs"
                >
                  ↩️ Reply
                </Button>
              )}
            </Box>
          </HStack>
        </Box>
      </Box>

      {/* Children posts */}
      {hasChildren && !isCollapsed && (
        <Box>
          {shouldFlatten ? (
            // Flatten deeply nested replies
            <Box pl={level * 4} borderLeft="1px dashed" borderLeftColor="gray.300">
              <Text fontSize="xs" color="gray.500" py={2} fontStyle="italic">
                {post.children.length} more replies (flattened)
              </Text>
              {post.children.map(child => (
                <PostThread
                  key={child.id}
                  post={child}
                  isReply={true}
                  searchTerm={searchTerm}
                  onReplyToPost={onReplyToPost}
                />
              ))}
            </Box>
          ) : (
            // Normal threaded display
            post.children.map(child => (
              <ThreadedPostTree
                key={child.id}
                post={child}
                level={level + 1}
                searchTerm={searchTerm}
                onReplyToPost={onReplyToPost}
                maxLevel={maxLevel}
              />
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

// Helper function for search highlighting (moved up to be available for both components)
const highlightSearchTerm = (text: string, term: string) => {
  if (!term || term.length < 2) return text;

  const regex = new RegExp(`(${term})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <Text
          key={index}
          as="span"
          bg="yellow.200"
          px={1}
          borderRadius="sm"
        >
          {part}
        </Text>
      );
    }
    return part;
  });
};

const PostThread = ({
  post,
  isReply = false,
  isVisible = true,
  searchTerm = "",
  onReplyToPost,
  parentPost // Add this to show which post this is replying to
}: {
  post: Post;
  isReply?: boolean;
  isVisible?: boolean;
  searchTerm?: string;
  onReplyToPost?: (postId: string) => void;
  parentPost?: Post; // The post this is replying to
}) => {
  if (!isVisible) return null;

  // Function to highlight search terms
  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || term.length < 2) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <Text
            key={index}
            as="span"
            bg="yellow.200"
            px={1}
            borderRadius="sm"
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <Box
      id={`post-${post.id}`}
      pl={isReply ? 6 : 0}
      mt={isReply ? 3 : 0}
      borderLeft={isReply ? "2px solid" : undefined}
      borderLeftColor={isReply ? "blue.200" : undefined} // Make it more obvious
      transition="background-color 0.3s ease"
      position="relative"
    >
      {/* Reply indicator line connecting to parent */}
      {isReply && (
        <Box
          position="absolute"
          left="24px"
          top="-12px"
          width="20px"
          height="12px"
          borderLeft="2px solid"
          borderBottom="2px solid"
          borderColor="blue.200"
          borderBottomLeftRadius="8px"
        />
      )}

      <HStack gap={3} align="start">
        <Avatar.Root size="sm" flexShrink={0}>
          {post.author.avatar_url && <Avatar.Image src={post.author.avatar_url} />}
          <Avatar.Fallback>{getDisplayName(post.author).charAt(0)}</Avatar.Fallback>
        </Avatar.Root>
        <Box flex={1}>
          {/* Show who this is replying to */}
          {parentPost && (
            <Box mb={1}>
              <Text fontSize="xs" color="blue.600" fontStyle="italic">
                💬 Replying to {getDisplayName(parentPost.author)}
              </Text>
              <Box
                bg="gray.50"
                p={2}
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="blue.200"
                mb={2}
              >
                <Text fontSize="xs" color="gray.600" lineHeight="1.4" lineClamp={2}>
                  "{parentPost.content}"
                </Text>
              </Box>
            </Box>
          )}

          <HStack gap={2} align="center" mb={1}>
            <Text fontWeight="semibold" fontSize="sm" color="gray.700">
              {getDisplayName(post.author)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {formatTimeAgo(post.created_at)}
            </Text>
            {/* Visual indicator for replies */}
            {isReply && (
              <Badge size="sm" colorScheme="blue" variant="subtle">
                Reply
              </Badge>
            )}
          </HStack>

          <Text fontSize="sm" lineHeight="1.5" color="gray.800" mb={2}>
            {searchTerm ? highlightSearchTerm(post.content, searchTerm) : post.content}
          </Text>

          {/* Reply button for individual posts */}
          {onReplyToPost && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onReplyToPost(post.id)}
              fontSize="xs"
            >
              ↩️ Reply
            </Button>
          )}
        </Box>
      </HStack>
    </Box>
  );
};

// -----------------------------
// Main Component
// -----------------------------

const ConversationCard: React.FC<ConversationCardProps> = ({
  topic,
  onReply,
  searchTerm: globalSearchTerm = ""
}) => {
  const [localSearchFilter, setLocalSearchFilter] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [viewMode, setViewMode] = useState<'linear' | 'threaded'>('linear');

  const posts = topic.posts || [];
  const totalReplies = getTotalReplies(posts);
  const recentParticipants = getRecentParticipants(posts);

  // Combine global and local search terms
  const effectiveSearchTerm = globalSearchTerm || localSearchFilter;

  // Smart default view mode based on conversation complexity
  useMemo(() => {
    if (posts.length === 0) return;

    const hasThreadedReplies = posts.some(post => post.parent);
    const shouldUseThreaded = posts.length > 10 && hasThreadedReplies;

    setViewMode(shouldUseThreaded ? 'threaded' : 'linear');
  }, [posts.length]);

  // Build threaded structure from flat posts array
  const buildThreadedPosts = (posts: Post[]): PostWithChildren[] => {
    const postMap = new Map<string, PostWithChildren>();
    const rootPosts: PostWithChildren[] = [];

    // First pass: create map of all posts with children arrays
    posts.forEach(post => {
      postMap.set(post.id, { ...post, children: [] });
    });

    // Second pass: organize into tree structure
    posts.forEach(post => {
      const postWithChildren = postMap.get(post.id)!;

      if (post.parent) {
        const parent = postMap.get(post.parent);
        if (parent) {
          parent.children.push(postWithChildren);
        } else {
          // Parent not found, treat as root
          rootPosts.push(postWithChildren);
        }
      } else {
        rootPosts.push(postWithChildren);
      }
    });

    return rootPosts;
  };

  const threadedPosts = buildThreadedPosts(posts);

  // Filter posts based on search and view mode
  const getFilteredPosts = () => {
    if (!effectiveSearchTerm) {
      return viewMode === 'threaded' ? threadedPosts : posts;
    }

    const filter = effectiveSearchTerm.toLowerCase();
    if (viewMode === 'threaded') {
      // For threaded view, filter the tree structure
      const filterThreaded = (posts: PostWithChildren[]): PostWithChildren[] => {
        return posts.filter(post => {
          const matchesPost = getDisplayName(post.author).toLowerCase().includes(filter) ||
                            post.content.toLowerCase().includes(filter);
          const matchesChildren = post.children.some(child =>
            getDisplayName(child.author).toLowerCase().includes(filter) ||
            child.content.toLowerCase().includes(filter)
          );
          return matchesPost || matchesChildren;
        }).map(post => ({
          ...post,
          children: post.children.filter(child =>
            getDisplayName(child.author).toLowerCase().includes(filter) ||
            child.content.toLowerCase().includes(filter)
          )
        }));
      };
      return filterThreaded(threadedPosts);
    } else {
      // Linear view filtering (existing logic)
      return posts.filter(post =>
        getDisplayName(post.author).toLowerCase().includes(filter) ||
        post.content.toLowerCase().includes(filter)
      );
    }
  };

  const filteredContent = getFilteredPosts();

  const maxVisiblePosts = 15;
  const getDisplayedContent = (): PostWithChildren[] | Post[] => {
    if (viewMode === 'threaded') {
      return isExpanded ? (filteredContent as PostWithChildren[]) : (filteredContent as PostWithChildren[]).slice(0, maxVisiblePosts);
    } else {
      return isExpanded ? (filteredContent as Post[]) : (filteredContent as Post[]).slice(0, maxVisiblePosts);
    }
  };

  const displayedContent = getDisplayedContent();
  const totalFilteredCount = viewMode === 'threaded'
    ? (filteredContent as PostWithChildren[]).reduce((acc, post) => acc + 1 + post.children.length, 0)
    : (filteredContent as Post[]).length;
  const hasMorePosts = totalFilteredCount > maxVisiblePosts;

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;

    setIsReplying(true);
    try {
      await onReply(topic.slug, replyContent.trim(), replyingToPostId || undefined);
      setReplyContent("");
      setReplyingToPostId(null);
      setShowReplyBox(false); // Always hide the reply box after successful post
      toaster.create({
        title: "Success",
        description: "Reply posted successfully!",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: "Error",
        description: "Failed to post reply.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsReplying(false);
    }
  };

  const handleReplyToPost = (postId: string) => {
    setReplyingToPostId(postId);
    setShowReplyBox(true);
    setReplyContent("");
  };

  const handleCancelReply = () => {
    setReplyingToPostId(null);
    setShowReplyBox(false);
    setReplyContent("");
  };

  // Parse quoted search for participant filtering (simplified version)
  const parseQuotedSearch = (searchText: string): { quotedTerms: string[]; freeText: string } => {
    const quotedTerms: string[] = [];
    let freeText = searchText;

    const quoteMatches = searchText.match(/"([^"]*)"/g);
    if (quoteMatches) {
      quoteMatches.forEach(match => {
        const term = match.slice(1, -1);
        if (term.trim()) {
          quotedTerms.push(term.trim());
        }
        freeText = freeText.replace(match, '').trim();
      });
    }

    return { quotedTerms, freeText };
  };

  const toggleParticipant = (participantId: string, participantName: string) => {
    const isCurrentlySelected = selectedParticipants.includes(participantId);
    let newSelectedParticipants: string[];

    if (isCurrentlySelected) {
      newSelectedParticipants = selectedParticipants.filter(id => id !== participantId);
    } else {
      newSelectedParticipants = [...selectedParticipants, participantId];
    }

    setSelectedParticipants(newSelectedParticipants);

    // Update search filter to include quoted names
    const selectedNames = newSelectedParticipants
      .map(id => recentParticipants.find(p => p.id === id)?.name)
      .filter(Boolean)
      .map(name => `"${name}"`);

    const nonQuotedSearch = localSearchFilter.replace(/"[^"]*"/g, '').trim();
    const newSearchFilter = [...selectedNames, nonQuotedSearch].filter(Boolean).join(' ');

    setLocalSearchFilter(newSearchFilter);
  };

  const clearAllFilters = () => {
    setLocalSearchFilter("");
    setSelectedParticipants([]);
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchFilter(value);

    // Update selected participants based on quoted names in search
    const { quotedTerms } = parseQuotedSearch(value);
    const newSelected = recentParticipants
      .filter(p => quotedTerms.some(term => term.toLowerCase() === getDisplayName(p).toLowerCase()))
      .map(p => p.id);

    setSelectedParticipants(newSelected);
  };

  const { freeText } = parseQuotedSearch(effectiveSearchTerm);

  return (
    <Box
      bg="white"
      borderWidth={1}
      borderColor="gray.200"
      borderRadius="xl"
      p={6}
      shadow="sm"
      _hover={{ shadow: "md" }}
      transition="all 0.2s"
    >
      {/* Header */}
      <Flex align="start" justify="space-between" mb={4}>
        <Box flex={1}>
          <HStack gap={2} mb={2}>
            {topic.is_pinned && (
              <Badge colorScheme="blue" variant="subtle" size="sm">
                <IconPin size={12} style={{ marginRight: '4px' }} />
                Pinned
              </Badge>
            )}
            {topic.is_locked && (
              <Badge colorScheme="red" variant="subtle" size="sm">
                <IconLock size={12} style={{ marginRight: '4px' }} />
                Locked
              </Badge>
            )}
          </HStack>

          <Heading size="md" color="gray.800" mb={2} lineHeight="1.3">
            {topic.title}
          </Heading>

          <HStack gap={4} fontSize="sm" color="gray.500">
            <HStack gap={1}>
              <IconUser size={16} />
              <Text>{getDisplayName(topic.author)}</Text>
            </HStack>
            <HStack gap={1}>
              <IconClock size={16} />
              <Text>{formatTimeAgo(topic.created_at)}</Text>
            </HStack>
            {totalReplies > 0 && (
              <HStack gap={1}>
                <IconMessageCircle size={16} />
                <Text>{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</Text>
              </HStack>
            )}
          </HStack>
        </Box>

        {/* View Mode Toggle */}
        {posts.length > 3 && (
          <VStack gap={1} align="end">
            <Text fontSize="xs" color="gray.500">View:</Text>
            <HStack gap={1}>
              <Button
                size="xs"
                variant={viewMode === 'linear' ? 'solid' : 'ghost'}
                // colorScheme={viewMode === 'linear' ? 'blue' : 'gray'}
                onClick={() => setViewMode('linear')}
                fontSize="xs"
              >
                📋 Timeline
              </Button>
              <Button
                size="xs"
                variant={viewMode === 'threaded' ? 'solid' : 'ghost'}
                // colorScheme={viewMode === 'threaded' ? 'blue' : 'gray'}
                onClick={() => setViewMode('threaded')}
                fontSize="xs"
              >
                🧵 Threaded
              </Button>
            </HStack>
          </VStack>
        )}
      </Flex>

      <Box mb={4}>
        <Divider />
      </Box>

      {/* Search and Participant Filters */}
      {totalReplies > 5 && !globalSearchTerm && (
        <Box mb={4} minH="120px">
          <VStack align="stretch" gap={3}>
            <InputGroup startElement={<IconSearch size={16} />}>
              <Input
                placeholder='Search messages... (use "quotes" for exact matches)'
                value={localSearchFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                fontSize="sm"
              />
            </InputGroup>

            {recentParticipants.length > 0 && (
              <HStack align="start" gap={4}>
                <VStack align="start" gap={1} w="140px" flexShrink={0}>
                  <Text fontSize="xs" color="gray.500">Recent:</Text>
                  {localSearchFilter && (
                    <Button size="xs" variant="ghost" onClick={clearAllFilters} h="auto" py={0.5}>
                      Clear all
                    </Button>
                  )}
                </VStack>

                <HStack gap={2} wrap="wrap" flex={1}>
                  {recentParticipants.map((participant, index) => {
                    const isSelected = selectedParticipants.includes(participant.id);

                    return (
                      <React.Fragment key={participant.id}>
                        <Box
                          position="relative"
                          px={2}
                          py={1}
                          borderRadius="md"
                          bg={isSelected ? "blue.50" : "transparent"}
                          border="1px solid"
                          borderColor={isSelected ? "blue.200" : "transparent"}
                          transition="all 0.2s"
                        >
                          <Text
                            fontSize="sm"
                            color={isSelected ? "blue.600" : "gray.700"}
                            fontWeight={isSelected ? "semibold" : "normal"}
                            cursor="pointer"
                            _hover={{
                              color: isSelected ? "blue.700" : "blue.600"
                            }}
                            onClick={() => toggleParticipant(participant.id, getDisplayName(participant))}
                          >
                            {getDisplayName(participant)}
                          </Text>
                        </Box>
                        {index < recentParticipants.length - 1 && (
                          <Text fontSize="sm" color="gray.400">•</Text>
                        )}
                      </React.Fragment>
                    );
                  })}
                </HStack>
              </HStack>
            )}

            <Box minH="20px" />
          </VStack>
        </Box>
      )}

      {/* Posts */}
      <VStack align="stretch" gap={4} maxH={isExpanded ? "none" : "400px"} overflowY="auto">
        {viewMode === 'threaded' ? (
          // Threaded view
          (displayedContent as PostWithChildren[]).map((post) => (
            <ThreadedPostTree
              key={post.id}
              post={post}
              level={0}
              searchTerm={freeText}
              onReplyToPost={handleReplyToPost}
            />
          ))
        ) : (
          // Linear view
          (displayedContent as Post[]).map((post, index) => {
            const parentPost = post.parent
              ? posts.find(p => p.id === post.parent)
              : undefined;

            return (
              <PostThread
                key={post.id}
                post={post}
                isReply={index > 0 || !!post.parent}
                searchTerm={freeText}
                onReplyToPost={handleReplyToPost}
                parentPost={parentPost}
              />
            );
          })
        )}

        {/* Expand/Collapse Controls */}
        {hasMorePosts && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            alignSelf="center"
          >
            Show {totalFilteredCount - maxVisiblePosts} more messages
            <IconChevronDown size={16} style={{ marginLeft: '8px' }} />
          </Button>
        )}

        {isExpanded && hasMorePosts && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            alignSelf="center"
          >
            Show less
            <IconChevronUp size={16} style={{ marginLeft: '8px' }} />
          </Button>
        )}
      </VStack>

      {/* Reply Section */}
      {!topic.is_locked && (
        <Box mt={6} pt={4} borderTop="1px solid" borderTopColor="gray.100">
          {/* Show reply box when replying to specific post or when showReplyBox is true */}
          {(showReplyBox || replyingToPostId) && (
            <VStack align="stretch" gap={3}>
              {replyingToPostId && (
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" color="blue.600">
                    Replying to a specific message
                  </Text>
                  <Button size="xs" variant="ghost" onClick={handleCancelReply}>
                    Cancel
                  </Button>
                </HStack>
              )}

              <Textarea
                placeholder={
                  replyingToPostId
                    ? "Reply to this message..."
                    : "Add your thoughts to this conversation..."
                }
                value={replyContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
                resize="vertical"
                minH="80px"
                fontSize="sm"
                borderColor="gray.300"
                _focus={{
                  borderColor: "blue.400",
                  shadow: "0 0 0 1px var(--chakra-colors-blue-400)"
                }}
              />
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">
                  {replyingToPostId ? "This will be a threaded reply" : "This will be a general reply"}
                </Text>
                <HStack>
                  {replyingToPostId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelReply}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    px={6}
                    fontWeight="medium"
                    onClick={handleReply}
                    disabled={!replyContent.trim() || isReplying}
                    loading={isReplying}
                  >
                    {replyingToPostId ? "Reply to Message" : "Reply to Conversation"}
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          )}

          {/* Show "Reply to Conversation" button ONLY when not showing reply box AND not replying to specific post */}
          {!showReplyBox && !replyingToPostId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyBox(true)}
              w="full"
            >
              Reply to Conversation
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ConversationCard;





// "use client"

// import React, { useState, useMemo } from "react";
// import {
//   Box,
//   Heading,
//   Textarea,
//   Button,
//   VStack,
//   Text,
//   HStack,
//   Avatar,
//   Badge,
//   Flex,
//   Input,
//   InputGroup
// } from "@chakra-ui/react";
// import { Divider } from "@components/common/Divider";
// import {
//   IconMessageCircle,
//   IconClock,
//   IconUser,
//   IconPin,
//   IconLock,
//   IconSearch,
//   IconChevronDown,
//   IconChevronUp
// } from "@tabler/icons-react";
// import { createStandaloneToast } from "@chakra-ui/toast";

// const { toast } = createStandaloneToast();

// // -----------------------------
// // Types
// // -----------------------------

// interface User {
//   id: string;
//   name?: string;
//   username?: string;
//   first_name?: string;
//   last_name?: string;
//   avatar_url?: string;
// }

// interface Post {
//   id: string;
//   author: User;
//   content: string;
//   created_at: string;
//   parent?: string | null;
//   replies?: Post[];
// }

// interface Topic {
//   id: string;
//   title: string;
//   slug: string;
//   created_at: string;
//   last_posted_at: string;
//   is_pinned: boolean;
//   is_locked: boolean;
//   author: User;
//   post_count: number;
//   posts?: Post[];
//   last_post?: {
//     author: User;
//     created_at: string;
//   };
// }

// interface ConversationCardProps {
//   topic: Topic;
//   onReply?: (topicSlug: string, content: string, parentPostId?: string) => Promise<void>;
//   searchTerm?: string;
// }

// // -----------------------------
// // Helper Functions
// // -----------------------------

// const formatTimeAgo = (dateString: string) => {
//   const date = new Date(dateString);
//   const now = new Date();
//   const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

//   if (diffInHours < 1) return "Just now";
//   if (diffInHours < 24) return `${diffInHours}h ago`;
//   if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
//   return date.toLocaleDateString();
// };

// const getDisplayName = (user: User): string => {
//   if (user.name) return user.name;
//   if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
//   if (user.first_name) return user.first_name;
//   return user.username || 'Unknown User';
// };

// const getTotalReplies = (posts: Post[]): number => {
//   return posts.length - 1; // Subtract 1 for the main post
// };

// const getRecentParticipants = (posts: Post[], limit: number = 10): User[] => {
//   const participantMap = new Map<string, { user: User; lastActivity: string }>();

//   // Find the conversation starter (author of the first post)
//   const conversationStarter = posts[0]?.author;

//   posts.forEach(post => {
//     const existing = participantMap.get(post.author.id);
//     if (!existing || new Date(post.created_at) > new Date(existing.lastActivity)) {
//       participantMap.set(post.author.id, {
//         user: post.author,
//         lastActivity: post.created_at
//       });
//     }
//   });

//   const allParticipants = Array.from(participantMap.values())
//     .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
//     .map(p => p.user);

//   // Put conversation starter first, then others
//   const starterFirst = conversationStarter
//     ? [conversationStarter, ...allParticipants.filter(p => p.id !== conversationStarter.id)]
//     : allParticipants;

//   return starterFirst.slice(0, limit);
// };

// // -----------------------------
// // Components
// // -----------------------------

// const PostThread = ({
//   post,
//   isReply = false,
//   isVisible = true,
//   searchTerm = "",
//   onReplyToPost,
//   parentPost // Add this to show which post this is replying to
// }: {
//   post: Post;
//   isReply?: boolean;
//   isVisible?: boolean;
//   searchTerm?: string;
//   onReplyToPost?: (postId: string) => void;
//   parentPost?: Post; // The post this is replying to
// }) => {
//   if (!isVisible) return null;

//   // Function to highlight search terms
//   const highlightSearchTerm = (text: string, term: string) => {
//     if (!term || term.length < 2) return text;

//     const regex = new RegExp(`(${term})`, 'gi');
//     const parts = text.split(regex);

//     return parts.map((part, index) => {
//       if (regex.test(part)) {
//         return (
//           <Text
//             key={index}
//             as="span"
//             bg="yellow.200"
//             px={1}
//             borderRadius="sm"
//           >
//             {part}
//           </Text>
//         );
//       }
//       return part;
//     });
//   };

//   return (
//     <Box
//       id={`post-${post.id}`}
//       pl={isReply ? 6 : 0}
//       mt={isReply ? 3 : 0}
//       borderLeft={isReply ? "2px solid" : undefined}
//       borderLeftColor={isReply ? "blue.200" : undefined} // Make it more obvious
//       transition="background-color 0.3s ease"
//       position="relative"
//     >
//       {/* Reply indicator line connecting to parent */}
//       {isReply && (
//         <Box
//           position="absolute"
//           left="24px"
//           top="-12px"
//           width="20px"
//           height="12px"
//           borderLeft="2px solid"
//           borderBottom="2px solid"
//           borderColor="blue.200"
//           borderBottomLeftRadius="8px"
//         />
//       )}

//       <HStack gap={3} align="start">
//         <Avatar.Root size="sm" flexShrink={0}>
//           {post.author.avatar_url && <Avatar.Image src={post.author.avatar_url} />}
//           <Avatar.Fallback>{getDisplayName(post.author).charAt(0)}</Avatar.Fallback>
//         </Avatar.Root>
//         <Box flex={1}>
//           {/* Show who this is replying to */}
//           {parentPost && (
//             <Box mb={1}>
//               <Text fontSize="xs" color="blue.600" fontStyle="italic">
//                 💬 Replying to {getDisplayName(parentPost.author)}
//               </Text>
//               <Box
//                 bg="gray.50"
//                 p={2}
//                 borderRadius="md"
//                 borderLeft="3px solid"
//                 borderLeftColor="blue.200"
//                 mb={2}
//               >
//                 <Text fontSize="xs" color="gray.600" lineHeight="1.4" noOfLines={2}>
//                   "{parentPost.content}"
//                 </Text>
//               </Box>
//             </Box>
//           )}

//           <HStack gap={2} align="center" mb={1}>
//             <Text fontWeight="semibold" fontSize="sm" color="gray.700">
//               {getDisplayName(post.author)}
//             </Text>
//             <Text fontSize="xs" color="gray.500">
//               {formatTimeAgo(post.created_at)}
//             </Text>
//             {/* Visual indicator for replies */}
//             {isReply && (
//               <Badge size="sm" colorScheme="blue" variant="subtle">
//                 Reply
//               </Badge>
//             )}
//           </HStack>

//           <Text fontSize="sm" lineHeight="1.5" color="gray.800" mb={2}>
//             {searchTerm ? highlightSearchTerm(post.content, searchTerm) : post.content}
//           </Text>

//           {/* Reply button for individual posts */}
//           {onReplyToPost && (
//             <Button
//               size="xs"
//               variant="ghost"
//               colorScheme="blue"
//               onClick={() => onReplyToPost(post.id)}
//               fontSize="xs"
//               leftIcon={<Text fontSize="xs">↩️</Text>}
//             >
//               Reply
//             </Button>
//           )}
//         </Box>
//       </HStack>
//     </Box>
//   );
// };

// // -----------------------------
// // Main Component
// // -----------------------------

// const ConversationCard: React.FC<ConversationCardProps> = ({
//   topic,
//   onReply,
//   searchTerm: globalSearchTerm = ""
// }) => {
//   const [localSearchFilter, setLocalSearchFilter] = useState("");
//   const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [replyContent, setReplyContent] = useState("");
//   const [isReplying, setIsReplying] = useState(false);
//   const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
//   const [showReplyBox, setShowReplyBox] = useState(false);

//   const posts = topic.posts || [];
//   const totalReplies = getTotalReplies(posts);
//   const recentParticipants = getRecentParticipants(posts);

//   // Combine global and local search terms
//   const effectiveSearchTerm = globalSearchTerm || localSearchFilter;

//   // Search and filter logic
//   const filteredPosts = useMemo(() => {
//     if (!effectiveSearchTerm) return posts;

//     const filter = effectiveSearchTerm.toLowerCase();
//     return posts.filter(post =>
//       getDisplayName(post.author).toLowerCase().includes(filter) ||
//       post.content.toLowerCase().includes(filter)
//     );
//   }, [posts, effectiveSearchTerm]);

//   const maxVisiblePosts = 15;
//   const postsToShow = isExpanded ? filteredPosts : filteredPosts.slice(0, maxVisiblePosts);
//   const hasMorePosts = filteredPosts.length > maxVisiblePosts;

//   const handleReply = async () => {
//     if (!replyContent.trim() || !onReply) return;

//     setIsReplying(true);
//     try {
//       await onReply(topic.slug, replyContent.trim(), replyingToPostId || undefined);
//       setReplyContent("");
//       setReplyingToPostId(null);
//       setShowReplyBox(false); // Always hide the reply box after successful post
//       toast({
//         title: "Success",
//         description: "Reply posted successfully!",
//         status: "success",
//         duration: 3000,
//         isClosable: true,
//       });
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to post reply.",
//         status: "error",
//         duration: 5000,
//         isClosable: true,
//       });
//     } finally {
//       setIsReplying(false);
//     }
//   };

//   const handleReplyToPost = (postId: string) => {
//     setReplyingToPostId(postId);
//     setShowReplyBox(true);
//     setReplyContent("");
//   };

//   const handleCancelReply = () => {
//     setReplyingToPostId(null);
//     setShowReplyBox(false);
//     setReplyContent("");
//   };

//   // Parse quoted search for participant filtering (simplified version)
//   const parseQuotedSearch = (searchText: string): { quotedTerms: string[]; freeText: string } => {
//     const quotedTerms: string[] = [];
//     let freeText = searchText;

//     const quoteMatches = searchText.match(/"([^"]*)"/g);
//     if (quoteMatches) {
//       quoteMatches.forEach(match => {
//         const term = match.slice(1, -1);
//         if (term.trim()) {
//           quotedTerms.push(term.trim());
//         }
//         freeText = freeText.replace(match, '').trim();
//       });
//     }

//     return { quotedTerms, freeText };
//   };

//   const toggleParticipant = (participantId: string, participantName: string) => {
//     const isCurrentlySelected = selectedParticipants.includes(participantId);
//     let newSelectedParticipants: string[];

//     if (isCurrentlySelected) {
//       newSelectedParticipants = selectedParticipants.filter(id => id !== participantId);
//     } else {
//       newSelectedParticipants = [...selectedParticipants, participantId];
//     }

//     setSelectedParticipants(newSelectedParticipants);

//     // Update search filter to include quoted names
//     const selectedNames = newSelectedParticipants
//       .map(id => recentParticipants.find(p => p.id === id)?.name)
//       .filter(Boolean)
//       .map(name => `"${name}"`);

//     const nonQuotedSearch = localSearchFilter.replace(/"[^"]*"/g, '').trim();
//     const newSearchFilter = [...selectedNames, nonQuotedSearch].filter(Boolean).join(' ');

//     setLocalSearchFilter(newSearchFilter);
//   };

//   const clearAllFilters = () => {
//     setLocalSearchFilter("");
//     setSelectedParticipants([]);
//   };

//   const handleSearchChange = (value: string) => {
//     setLocalSearchFilter(value);

//     // Update selected participants based on quoted names in search
//     const { quotedTerms } = parseQuotedSearch(value);
//     const newSelected = recentParticipants
//       .filter(p => quotedTerms.some(term => term.toLowerCase() === getDisplayName(p).toLowerCase()))
//       .map(p => p.id);

//     setSelectedParticipants(newSelected);
//   };

//   const { freeText } = parseQuotedSearch(effectiveSearchTerm);

//   return (
//     <Box
//       bg="white"
//       borderWidth={1}
//       borderColor="gray.200"
//       borderRadius="xl"
//       p={6}
//       shadow="sm"
//       _hover={{ shadow: "md" }}
//       transition="all 0.2s"
//     >
//       {/* Header */}
//       <Flex align="start" justify="space-between" mb={4}>
//         <Box flex={1}>
//           <HStack gap={2} mb={2}>
//             {topic.is_pinned && (
//               <Badge colorScheme="blue" variant="subtle" size="sm">
//                 <IconPin size={12} style={{ marginRight: '4px' }} />
//                 Pinned
//               </Badge>
//             )}
//             {topic.is_locked && (
//               <Badge colorScheme="red" variant="subtle" size="sm">
//                 <IconLock size={12} style={{ marginRight: '4px' }} />
//                 Locked
//               </Badge>
//             )}
//           </HStack>

//           <Heading size="md" color="gray.800" mb={2} lineHeight="1.3">
//             {topic.title}
//           </Heading>

//           <HStack gap={4} fontSize="sm" color="gray.500">
//             <HStack gap={1}>
//               <IconUser size={16} />
//               <Text>{getDisplayName(topic.author)}</Text>
//             </HStack>
//             <HStack gap={1}>
//               <IconClock size={16} />
//               <Text>{formatTimeAgo(topic.created_at)}</Text>
//             </HStack>
//             {totalReplies > 0 && (
//               <HStack gap={1}>
//                 <IconMessageCircle size={16} />
//                 <Text>{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</Text>
//               </HStack>
//             )}
//           </HStack>
//         </Box>
//       </Flex>

//       <Box mb={4}>
//         <Divider />
//       </Box>

//       {/* Search and Participant Filters */}
//       {totalReplies > 5 && !globalSearchTerm && (
//         <Box mb={4} minH="120px">
//           <VStack align="stretch" gap={3}>
//             <InputGroup startElement={<IconSearch size={16} />}>
//               <Input
//                 placeholder='Search messages... (use "quotes" for exact matches)'
//                 value={localSearchFilter}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
//                 fontSize="sm"
//               />
//             </InputGroup>

//             {recentParticipants.length > 0 && (
//               <HStack align="start" gap={4}>
//                 <VStack align="start" gap={1} w="140px" flexShrink={0}>
//                   <Text fontSize="xs" color="gray.500">Recent:</Text>
//                   {localSearchFilter && (
//                     <Button size="xs" variant="ghost" onClick={clearAllFilters} h="auto" py={0.5}>
//                       Clear all
//                     </Button>
//                   )}
//                 </VStack>

//                 <HStack gap={2} wrap="wrap" flex={1}>
//                   {recentParticipants.map((participant, index) => {
//                     const isSelected = selectedParticipants.includes(participant.id);

//                     return (
//                       <React.Fragment key={participant.id}>
//                         <Box
//                           position="relative"
//                           px={2}
//                           py={1}
//                           borderRadius="md"
//                           bg={isSelected ? "blue.50" : "transparent"}
//                           border="1px solid"
//                           borderColor={isSelected ? "blue.200" : "transparent"}
//                           transition="all 0.2s"
//                         >
//                           <Text
//                             fontSize="sm"
//                             color={isSelected ? "blue.600" : "gray.700"}
//                             fontWeight={isSelected ? "semibold" : "normal"}
//                             cursor="pointer"
//                             _hover={{
//                               color: isSelected ? "blue.700" : "blue.600"
//                             }}
//                             onClick={() => toggleParticipant(participant.id, getDisplayName(participant))}
//                           >
//                             {getDisplayName(participant)}
//                           </Text>
//                         </Box>
//                         {index < recentParticipants.length - 1 && (
//                           <Text fontSize="sm" color="gray.400">•</Text>
//                         )}
//                       </React.Fragment>
//                     );
//                   })}
//                 </HStack>
//               </HStack>
//             )}

//             <Box minH="20px" />
//           </VStack>
//         </Box>
//       )}

//       {/* Posts */}
//       <VStack align="stretch" gap={4} maxH={isExpanded ? "none" : "400px"} overflowY="auto">
//         {postsToShow.map((post, index) => {
//           // Find the parent post if this post has a parent
//           const parentPost = post.parent
//             ? posts.find(p => p.id === post.parent)
//             : undefined;

//           return (
//             <PostThread
//               key={post.id}
//               post={post}
//               isReply={index > 0 || !!post.parent} // Show as reply if it has a parent OR is not the first post
//               searchTerm={freeText}
//               onReplyToPost={handleReplyToPost}
//               parentPost={parentPost}
//             />
//           );
//         })}

//         {/* Expand/Collapse Controls */}
//         {hasMorePosts && !isExpanded && (
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => setIsExpanded(true)}
//             alignSelf="center"
//           >
//             Show {filteredPosts.length - maxVisiblePosts} more messages
//             <IconChevronDown size={16} style={{ marginLeft: '8px' }} />
//           </Button>
//         )}

//         {isExpanded && hasMorePosts && (
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => setIsExpanded(false)}
//             alignSelf="center"
//           >
//             Show less
//             <IconChevronUp size={16} style={{ marginLeft: '8px' }} />
//           </Button>
//         )}
//       </VStack>

//       {/* Reply Section */}
//       {!topic.is_locked && (
//         <Box mt={6} pt={4} borderTop="1px solid" borderTopColor="gray.100">
//           {/* Show reply box when replying to specific post or when showReplyBox is true */}
//           {(showReplyBox || replyingToPostId) && (
//             <VStack align="stretch" gap={3}>
//               {replyingToPostId && (
//                 <HStack justify="space-between" align="center">
//                   <Text fontSize="sm" color="blue.600">
//                     Replying to a specific message
//                   </Text>
//                   <Button size="xs" variant="ghost" onClick={handleCancelReply}>
//                     Cancel
//                   </Button>
//                 </HStack>
//               )}

//               <Textarea
//                 placeholder={
//                   replyingToPostId
//                     ? "Reply to this message..."
//                     : "Add your thoughts to this conversation..."
//                 }
//                 value={replyContent}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
//                 resize="vertical"
//                 minH="80px"
//                 fontSize="sm"
//                 borderColor="gray.300"
//                 _focus={{
//                   borderColor: "blue.400",
//                   shadow: "0 0 0 1px var(--chakra-colors-blue-400)"
//                 }}
//               />
//               <HStack justify="space-between">
//                 <Text fontSize="xs" color="gray.500">
//                   {replyingToPostId ? "This will be a threaded reply" : "This will be a general reply"}
//                 </Text>
//                 <HStack>
//                   {replyingToPostId && (
//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={handleCancelReply}
//                     >
//                       Cancel
//                     </Button>
//                   )}
//                   <Button
//                     size="sm"
//                     colorScheme="blue"
//                     px={6}
//                     fontWeight="medium"
//                     onClick={handleReply}
//                     disabled={!replyContent.trim() || isReplying}
//                     loading={isReplying}
//                   >
//                     {replyingToPostId ? "Reply to Message" : "Reply to Conversation"}
//                   </Button>
//                 </HStack>
//               </HStack>
//             </VStack>
//           )}

//           {/* Show "Reply to Conversation" button ONLY when not showing reply box AND not replying to specific post */}
//           {!showReplyBox && !replyingToPostId && (
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setShowReplyBox(true)}
//               w="full"
//             >
//               Reply to Conversation
//             </Button>
//           )}
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default ConversationCard;

// // "use client"

// // import React, { useState, useMemo } from "react";
// // import {
// //   Box,
// //   Heading,
// //   Textarea,
// //   Button,
// //   VStack,
// //   Text,
// //   HStack,
// //   Avatar,
// //   Badge,
// //   Flex,
// //   Input,
// //   InputGroup
// // } from "@chakra-ui/react";
// // import { Divider } from "@components/common/Divider";
// // import {
// //   IconMessageCircle,
// //   IconClock,
// //   IconUser,
// //   IconPin,
// //   IconLock,
// //   IconSearch,
// //   IconChevronDown,
// //   IconChevronUp
// // } from "@tabler/icons-react";
// // import { createStandaloneToast } from "@chakra-ui/toast";

// // const { toast } = createStandaloneToast();

// // // -----------------------------
// // // Types
// // // -----------------------------

// // interface User {
// //   id: string;
// //   name?: string;
// //   username?: string;
// //   first_name?: string;
// //   last_name?: string;
// //   avatar_url?: string;
// // }

// // interface Post {
// //   id: string;
// //   author: User;
// //   content: string;
// //   created_at: string;
// //   parent?: string | null;
// //   replies?: Post[];
// // }

// // interface Topic {
// //   id: string;
// //   title: string;
// //   slug: string;
// //   created_at: string;
// //   last_posted_at: string;
// //   is_pinned: boolean;
// //   is_locked: boolean;
// //   author: User;
// //   post_count: number;
// //   posts?: Post[];
// //   last_post?: {
// //     author: User;
// //     created_at: string;
// //   };
// // }

// // interface ConversationCardProps {
// //   topic: Topic;
// //   onReply?: (topicSlug: string, content: string, parentPostId?: string) => Promise<void>;
// //   searchTerm?: string;
// // }

// // // -----------------------------
// // // Helper Functions
// // // -----------------------------

// // const formatTimeAgo = (dateString: string) => {
// //   const date = new Date(dateString);
// //   const now = new Date();
// //   const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

// //   if (diffInHours < 1) return "Just now";
// //   if (diffInHours < 24) return `${diffInHours}h ago`;
// //   if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
// //   return date.toLocaleDateString();
// // };

// // const getDisplayName = (user: User): string => {
// //   if (user.name) return user.name;
// //   if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
// //   if (user.first_name) return user.first_name;
// //   return user.username || 'Unknown User';
// // };

// // const getTotalReplies = (posts: Post[]): number => {
// //   return posts.length - 1; // Subtract 1 for the main post
// // };

// // const getRecentParticipants = (posts: Post[], limit: number = 10): User[] => {
// //   const participantMap = new Map<string, { user: User; lastActivity: string }>();

// //   // Find the conversation starter (author of the first post)
// //   const conversationStarter = posts[0]?.author;

// //   posts.forEach(post => {
// //     const existing = participantMap.get(post.author.id);
// //     if (!existing || new Date(post.created_at) > new Date(existing.lastActivity)) {
// //       participantMap.set(post.author.id, {
// //         user: post.author,
// //         lastActivity: post.created_at
// //       });
// //     }
// //   });

// //   const allParticipants = Array.from(participantMap.values())
// //     .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
// //     .map(p => p.user);

// //   // Put conversation starter first, then others
// //   const starterFirst = conversationStarter
// //     ? [conversationStarter, ...allParticipants.filter(p => p.id !== conversationStarter.id)]
// //     : allParticipants;

// //   return starterFirst.slice(0, limit);
// // };

// // // -----------------------------
// // // Components
// // // -----------------------------

// // const PostThread = ({
// //   post,
// //   isReply = false,
// //   isVisible = true,
// //   searchTerm = "",
// //   onReplyToPost
// // }: {
// //   post: Post;
// //   isReply?: boolean;
// //   isVisible?: boolean;
// //   searchTerm?: string;
// //   onReplyToPost?: (postId: string) => void;
// // }) => {
// //   if (!isVisible) return null;

// //   // Function to highlight search terms
// //   const highlightSearchTerm = (text: string, term: string) => {
// //     if (!term || term.length < 2) return text;

// //     const regex = new RegExp(`(${term})`, 'gi');
// //     const parts = text.split(regex);

// //     return parts.map((part, index) => {
// //       if (regex.test(part)) {
// //         return (
// //           <Text
// //             key={index}
// //             as="span"
// //             bg="yellow.200"
// //             px={1}
// //             borderRadius="sm"
// //           >
// //             {part}
// //           </Text>
// //         );
// //       }
// //       return part;
// //     });
// //   };

// //   return (
// //     <Box
// //       id={`post-${post.id}`}
// //       pl={isReply ? 6 : 0}
// //       mt={isReply ? 3 : 0}
// //       borderLeft={isReply ? "2px solid" : undefined}
// //       borderLeftColor={isReply ? "gray.200" : undefined}
// //       transition="background-color 0.3s ease"
// //     >
// //       <HStack gap={3} align="start">
// //         <Avatar.Root size="sm" flexShrink={0}>
// //           {post.author.avatar_url && <Avatar.Image src={post.author.avatar_url} />}
// //           <Avatar.Fallback>{getDisplayName(post.author).charAt(0)}</Avatar.Fallback>
// //         </Avatar.Root>
// //         <Box flex={1}>
// //           <HStack gap={2} align="center" mb={1}>
// //             <Text fontWeight="semibold" fontSize="sm" color="gray.700">
// //               {getDisplayName(post.author)}
// //             </Text>
// //             <Text fontSize="xs" color="gray.500">
// //               {formatTimeAgo(post.created_at)}
// //             </Text>
// //           </HStack>
// //           <Text fontSize="sm" lineHeight="1.5" color="gray.800" mb={2}>
// //             {searchTerm ? highlightSearchTerm(post.content, searchTerm) : post.content}
// //           </Text>

// //           {/* Reply button for individual posts */}
// //           {onReplyToPost && (
// //             <Button
// //               size="xs"
// //               variant="ghost"
// //               colorScheme="blue"
// //               onClick={() => onReplyToPost(post.id)}
// //               fontSize="xs"
// //             >
// //               Reply
// //             </Button>
// //           )}
// //         </Box>
// //       </HStack>
// //     </Box>
// //   );
// // };

// // // -----------------------------
// // // Main Component
// // // -----------------------------

// // const ConversationCard: React.FC<ConversationCardProps> = ({
// //   topic,
// //   onReply,
// //   searchTerm: globalSearchTerm = ""
// // }) => {
// //   const [localSearchFilter, setLocalSearchFilter] = useState("");
// //   const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
// //   const [isExpanded, setIsExpanded] = useState(false);
// //   const [replyContent, setReplyContent] = useState("");
// //   const [isReplying, setIsReplying] = useState(false);
// //   const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
// //   const [showReplyBox, setShowReplyBox] = useState(false);

// //   const posts = topic.posts || [];
// //   const totalReplies = getTotalReplies(posts);
// //   const recentParticipants = getRecentParticipants(posts);

// //   // Combine global and local search terms
// //   const effectiveSearchTerm = globalSearchTerm || localSearchFilter;

// //   // Search and filter logic
// //   const filteredPosts = useMemo(() => {
// //     if (!effectiveSearchTerm) return posts;

// //     const filter = effectiveSearchTerm.toLowerCase();
// //     return posts.filter(post =>
// //       getDisplayName(post.author).toLowerCase().includes(filter) ||
// //       post.content.toLowerCase().includes(filter)
// //     );
// //   }, [posts, effectiveSearchTerm]);

// //   const maxVisiblePosts = 15;
// //   const postsToShow = isExpanded ? filteredPosts : filteredPosts.slice(0, maxVisiblePosts);
// //   const hasMorePosts = filteredPosts.length > maxVisiblePosts;

// //   const handleReply = async () => {
// //     if (!replyContent.trim() || !onReply) return;

// //     setIsReplying(true);
// //     try {
// //       await onReply(topic.slug, replyContent.trim(), replyingToPostId || undefined);
// //       setReplyContent("");
// //       setReplyingToPostId(null);
// //       setShowReplyBox(false); // Always hide the reply box after successful post
// //       toast({
// //         title: "Success",
// //         description: "Reply posted successfully!",
// //         status: "success",
// //         duration: 3000,
// //         isClosable: true,
// //       });
// //     } catch (error) {
// //       toast({
// //         title: "Error",
// //         description: "Failed to post reply.",
// //         status: "error",
// //         duration: 5000,
// //         isClosable: true,
// //       });
// //     } finally {
// //       setIsReplying(false);
// //     }
// //   };

// //   const handleReplyToPost = (postId: string) => {
// //     setReplyingToPostId(postId);
// //     setShowReplyBox(true);
// //     setReplyContent("");
// //   };

// //   const handleCancelReply = () => {
// //     setReplyingToPostId(null);
// //     setShowReplyBox(false);
// //     setReplyContent("");
// //   };

// //   // Parse quoted search for participant filtering (simplified version)
// //   const parseQuotedSearch = (searchText: string): { quotedTerms: string[]; freeText: string } => {
// //     const quotedTerms: string[] = [];
// //     let freeText = searchText;

// //     const quoteMatches = searchText.match(/"([^"]*)"/g);
// //     if (quoteMatches) {
// //       quoteMatches.forEach(match => {
// //         const term = match.slice(1, -1);
// //         if (term.trim()) {
// //           quotedTerms.push(term.trim());
// //         }
// //         freeText = freeText.replace(match, '').trim();
// //       });
// //     }

// //     return { quotedTerms, freeText };
// //   };

// //   const toggleParticipant = (participantId: string, participantName: string) => {
// //     const isCurrentlySelected = selectedParticipants.includes(participantId);
// //     let newSelectedParticipants: string[];

// //     if (isCurrentlySelected) {
// //       newSelectedParticipants = selectedParticipants.filter(id => id !== participantId);
// //     } else {
// //       newSelectedParticipants = [...selectedParticipants, participantId];
// //     }

// //     setSelectedParticipants(newSelectedParticipants);

// //     // Update search filter to include quoted names
// //     const selectedNames = newSelectedParticipants
// //       .map(id => recentParticipants.find(p => p.id === id)?.name)
// //       .filter(Boolean)
// //       .map(name => `"${name}"`);

// //     const nonQuotedSearch = localSearchFilter.replace(/"[^"]*"/g, '').trim();
// //     const newSearchFilter = [...selectedNames, nonQuotedSearch].filter(Boolean).join(' ');

// //     setLocalSearchFilter(newSearchFilter);
// //   };

// //   const clearAllFilters = () => {
// //     setLocalSearchFilter("");
// //     setSelectedParticipants([]);
// //   };

// //   const handleSearchChange = (value: string) => {
// //     setLocalSearchFilter(value);

// //     // Update selected participants based on quoted names in search
// //     const { quotedTerms } = parseQuotedSearch(value);
// //     const newSelected = recentParticipants
// //       .filter(p => quotedTerms.some(term => term.toLowerCase() === getDisplayName(p).toLowerCase()))
// //       .map(p => p.id);

// //     setSelectedParticipants(newSelected);
// //   };

// //   const { freeText } = parseQuotedSearch(effectiveSearchTerm);

// //   return (
// //     <Box
// //       bg="white"
// //       borderWidth={1}
// //       borderColor="gray.200"
// //       borderRadius="xl"
// //       p={6}
// //       shadow="sm"
// //       _hover={{ shadow: "md" }}
// //       transition="all 0.2s"
// //     >
// //       {/* Header */}
// //       <Flex align="start" justify="space-between" mb={4}>
// //         <Box flex={1}>
// //           <HStack gap={2} mb={2}>
// //             {topic.is_pinned && (
// //               <Badge colorScheme="blue" variant="subtle" size="sm">
// //                 <IconPin size={12} style={{ marginRight: '4px' }} />
// //                 Pinned
// //               </Badge>
// //             )}
// //             {topic.is_locked && (
// //               <Badge colorScheme="red" variant="subtle" size="sm">
// //                 <IconLock size={12} style={{ marginRight: '4px' }} />
// //                 Locked
// //               </Badge>
// //             )}
// //           </HStack>

// //           <Heading size="md" color="gray.800" mb={2} lineHeight="1.3">
// //             {topic.title}
// //           </Heading>

// //           <HStack gap={4} fontSize="sm" color="gray.500">
// //             <HStack gap={1}>
// //               <IconUser size={16} />
// //               <Text>{getDisplayName(topic.author)}</Text>
// //             </HStack>
// //             <HStack gap={1}>
// //               <IconClock size={16} />
// //               <Text>{formatTimeAgo(topic.created_at)}</Text>
// //             </HStack>
// //             {totalReplies > 0 && (
// //               <HStack gap={1}>
// //                 <IconMessageCircle size={16} />
// //                 <Text>{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</Text>
// //               </HStack>
// //             )}
// //           </HStack>
// //         </Box>
// //       </Flex>

// //       <Box mb={4}>
// //         <Divider />
// //       </Box>

// //       {/* Search and Participant Filters */}
// //       {totalReplies > 5 && !globalSearchTerm && (
// //         <Box mb={4} minH="120px">
// //           <VStack align="stretch" gap={3}>
// //             <InputGroup startElement={<IconSearch size={16} />}>
// //               <Input
// //                 placeholder='Search messages... (use "quotes" for exact matches)'
// //                 value={localSearchFilter}
// //                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
// //                 fontSize="sm"
// //               />
// //             </InputGroup>

// //             {recentParticipants.length > 0 && (
// //               <HStack align="start" gap={4}>
// //                 <VStack align="start" gap={1} w="140px" flexShrink={0}>
// //                   <Text fontSize="xs" color="gray.500">Recent:</Text>
// //                   {localSearchFilter && (
// //                     <Button size="xs" variant="ghost" onClick={clearAllFilters} h="auto" py={0.5}>
// //                       Clear all
// //                     </Button>
// //                   )}
// //                 </VStack>

// //                 <HStack gap={2} wrap="wrap" flex={1}>
// //                   {recentParticipants.map((participant, index) => {
// //                     const isSelected = selectedParticipants.includes(participant.id);

// //                     return (
// //                       <React.Fragment key={participant.id}>
// //                         <Box
// //                           position="relative"
// //                           px={2}
// //                           py={1}
// //                           borderRadius="md"
// //                           bg={isSelected ? "blue.50" : "transparent"}
// //                           border="1px solid"
// //                           borderColor={isSelected ? "blue.200" : "transparent"}
// //                           transition="all 0.2s"
// //                         >
// //                           <Text
// //                             fontSize="sm"
// //                             color={isSelected ? "blue.600" : "gray.700"}
// //                             fontWeight={isSelected ? "semibold" : "normal"}
// //                             cursor="pointer"
// //                             _hover={{
// //                               color: isSelected ? "blue.700" : "blue.600"
// //                             }}
// //                             onClick={() => toggleParticipant(participant.id, getDisplayName(participant))}
// //                           >
// //                             {getDisplayName(participant)}
// //                           </Text>
// //                         </Box>
// //                         {index < recentParticipants.length - 1 && (
// //                           <Text fontSize="sm" color="gray.400">•</Text>
// //                         )}
// //                       </React.Fragment>
// //                     );
// //                   })}
// //                 </HStack>
// //               </HStack>
// //             )}

// //             <Box minH="20px" />
// //           </VStack>
// //         </Box>
// //       )}

// //       {/* Posts */}
// //       <VStack align="stretch" gap={4} maxH={isExpanded ? "none" : "400px"} overflowY="auto">
// //         {postsToShow.map((post, index) => (
// //           <PostThread
// //             key={post.id}
// //             post={post}
// //             isReply={index > 0}
// //             searchTerm={freeText}
// //             onReplyToPost={handleReplyToPost}
// //           />
// //         ))}

// //         {/* Expand/Collapse Controls */}
// //         {hasMorePosts && !isExpanded && (
// //           <Button
// //             variant="ghost"
// //             size="sm"
// //             onClick={() => setIsExpanded(true)}
// //             alignSelf="center"
// //           >
// //             Show {filteredPosts.length - maxVisiblePosts} more messages
// //             <IconChevronDown size={16} style={{ marginLeft: '8px' }} />
// //           </Button>
// //         )}

// //         {isExpanded && hasMorePosts && (
// //           <Button
// //             variant="ghost"
// //             size="sm"
// //             onClick={() => setIsExpanded(false)}
// //             alignSelf="center"
// //           >
// //             Show less
// //             <IconChevronUp size={16} style={{ marginLeft: '8px' }} />
// //           </Button>
// //         )}
// //       </VStack>

// //       {/* Reply Section */}
// //       {!topic.is_locked && (
// //         <Box mt={6} pt={4} borderTop="1px solid" borderTopColor="gray.100">
// //           {/* Show reply box when replying to specific post or when showReplyBox is true */}
// //           {(showReplyBox || replyingToPostId) && (
// //             <VStack align="stretch" gap={3}>
// //               {replyingToPostId && (
// //                 <HStack justify="space-between" align="center">
// //                   <Text fontSize="sm" color="blue.600">
// //                     Replying to a specific message
// //                   </Text>
// //                   <Button size="xs" variant="ghost" onClick={handleCancelReply}>
// //                     Cancel
// //                   </Button>
// //                 </HStack>
// //               )}

// //               <Textarea
// //                 placeholder={
// //                   replyingToPostId
// //                     ? "Reply to this message..."
// //                     : "Add your thoughts to this conversation..."
// //                 }
// //                 value={replyContent}
// //                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
// //                 resize="vertical"
// //                 minH="80px"
// //                 fontSize="sm"
// //                 borderColor="gray.300"
// //                 _focus={{
// //                   borderColor: "blue.400",
// //                   shadow: "0 0 0 1px var(--chakra-colors-blue-400)"
// //                 }}
// //               />
// //               <HStack justify="space-between">
// //                 <Text fontSize="xs" color="gray.500">
// //                   {replyingToPostId ? "This will be a threaded reply" : "This will be a general reply"}
// //                 </Text>
// //                 <HStack>
// //                   {replyingToPostId && (
// //                     <Button
// //                       size="sm"
// //                       variant="ghost"
// //                       onClick={handleCancelReply}
// //                     >
// //                       Cancel
// //                     </Button>
// //                   )}
// //                   <Button
// //                     size="sm"
// //                     colorScheme="blue"
// //                     px={6}
// //                     fontWeight="medium"
// //                     onClick={handleReply}
// //                     disabled={!replyContent.trim() || isReplying}
// //                     loading={isReplying}
// //                   >
// //                     {replyingToPostId ? "Reply to Message" : "Reply to Conversation"}
// //                   </Button>
// //                 </HStack>
// //               </HStack>
// //             </VStack>
// //           )}

// //           {/* Show "Reply to Conversation" button ONLY when not showing reply box AND not replying to specific post */}
// //           {!showReplyBox && !replyingToPostId && (
// //             <Button
// //               variant="outline"
// //               size="sm"
// //               onClick={() => setShowReplyBox(true)}
// //               w="full"
// //             >
// //               Reply to Conversation
// //             </Button>
// //           )}
// //         </Box>
// //       )}
// //     </Box>
// //   );
// // };

// // export default ConversationCard;