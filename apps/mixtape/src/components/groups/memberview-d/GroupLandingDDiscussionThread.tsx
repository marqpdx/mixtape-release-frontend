"use client";

import { useState } from "react";
import { Box, Flex, Image, Text, Textarea, Spinner } from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconSend } from "@tabler/icons-react";
import { toaster } from "@mixtape/core/lib/toaster";
import { fetchDiscussion, createPost } from "@mixtape/api/clients/threadworks/threadworksApi";
import {
  getThreadworksUserDisplayName,
  getThreadworksUserInitials,
  type Post,
} from "@mixtape/core/types/threadworksTypes";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PostItem({ post }: { post: Post }) {
  const displayName = getThreadworksUserDisplayName(post.author);
  const initials = getThreadworksUserInitials(post.author);

  return (
    <Flex
      className="dth-post"
      gap={3}
      py={4}
      borderBottomWidth="1px"
      borderColor="theme.border"
      _last={{ borderBottomWidth: 0 }}
    >
      {post.author?.avatar_url ? (
        <Image
          src={post.author.avatar_url}
          alt={displayName}
          w="36px"
          h="36px"
          borderRadius="full"
          objectFit="cover"
          flexShrink={0}
        />
      ) : (
        <Flex
          className="dth-post-avatar"
          w="36px"
          h="36px"
          borderRadius="full"
          bg="theme.accent"
          align="center"
          justify="center"
          color="white"
          fontSize="13px"
          fontWeight="700"
          flexShrink={0}
        >
          {initials}
        </Flex>
      )}
      <Box flex="1" minW={0}>
        <Flex align="baseline" gap={2} mb="3px">
          <Text fontWeight="600" fontSize="14px" color="theme.text">
            {displayName}
          </Text>
          <Text fontSize="12px" color="theme.textFaint">
            {formatRelativeTime(post.created_at)}
          </Text>
        </Flex>
        <Text
          fontSize="14px"
          color="theme.textSecondary"
          lineHeight="1.55"
          whiteSpace="pre-wrap"
        >
          {post.content}
        </Text>
      </Box>
    </Flex>
  );
}

interface GroupLandingDDiscussionThreadProps {
  groupSlug: string;
  forumSlug: string;
  discussionSlug: string;
}

export function GroupLandingDDiscussionThread({
  groupSlug,
  forumSlug,
  discussionSlug,
}: GroupLandingDDiscussionThreadProps) {
  const qc = useQueryClient();

  const discussionQuery = useQuery({
    queryKey: ["threadworks", "discussion", groupSlug, forumSlug, discussionSlug],
    queryFn: () => fetchDiscussion(forumSlug, discussionSlug, groupSlug),
  });

  const [replyText, setReplyText] = useState("");

  const postMutation = useMutation({
    mutationFn: (content: string) =>
      createPost(forumSlug, discussionSlug, { content }, groupSlug),
    onSuccess: () => {
      setReplyText("");
      qc.invalidateQueries({
        queryKey: ["threadworks", "discussion", groupSlug, forumSlug, discussionSlug],
      });
    },
    onError: () => toaster.error({ title: "Could not post reply" }),
  });

  const discussion = discussionQuery.data;
  const posts = discussion?.posts ?? [];
  const displayTitle = discussion?.pinned_nav_name || discussion?.title || "";

  return (
    <Box
      className="dth-root"
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      overflow="hidden"
    >
      <Box px={5} pt={5} pb={3} borderBottomWidth="1px" borderColor="theme.border">
        <Text fontFamily="heading" fontSize="18px" fontWeight="600" color="theme.text">
          {displayTitle}{" "}
          {!discussionQuery.isLoading && (
            <Box as="span" fontWeight="400" fontSize="15px" color="theme.textSecondary">
              ({posts.length})
            </Box>
          )}
        </Text>
        {discussion?.description && (
          <Text fontSize="13px" color="theme.textMuted" mt="2px">
            {discussion.description}
          </Text>
        )}
      </Box>

      <Box px={5}>
        {discussionQuery.isLoading && (
          <Flex justify="center" py={8}>
            <Spinner size="sm" color="theme.accent" />
          </Flex>
        )}

        {!discussionQuery.isLoading && posts.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text fontSize="14px" color="theme.textMuted">
              No posts yet — be the first to reply.
            </Text>
          </Box>
        )}

        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </Box>

      <Box
        className="dth-reply-form"
        px={5}
        py={4}
        borderTopWidth="1px"
        borderColor="theme.border"
      >
        <Flex gap={2} align="flex-end">
          <Textarea
            className="dth-reply-textarea"
            flex="1"
            rows={2}
            value={replyText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setReplyText(e.target.value)
            }
            placeholder="Add to the thread…"
            bg="theme.bg"
            borderColor="theme.border"
            _focus={{ borderColor: "theme.accent", boxShadow: "none" }}
            resize="none"
            fontSize="14px"
          />
          <Box
            as="button"
            flexShrink={0}
            w="36px"
            h="36px"
            borderRadius="10px"
            bg="theme.accent"
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor={postMutation.isPending || !replyText.trim() ? "not-allowed" : "pointer"}
            opacity={postMutation.isPending || !replyText.trim() ? 0.4 : 1}
            transition="opacity 0.12s"
            onClick={() => {
              if (!postMutation.isPending && replyText.trim()) {
                postMutation.mutate(replyText.trim());
              }
            }}
          >
            <IconSend size={15} />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
