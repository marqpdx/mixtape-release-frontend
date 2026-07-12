// apps/mixtape/src/components/groups/memberview-d/GroupLandingDTellAboutYourself.tsx

"use client";

import { useState, useRef } from "react";
import { Box, Flex, Image, Text, Textarea, Spinner } from "@chakra-ui/react";
import NextLink from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconSend, IconMinus, IconCheck } from "@tabler/icons-react";
import { toaster } from "@mixtape/core/lib/toaster";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchDiscussion, createPost, updatePost } from "@mixtape/api/clients/threadworks/threadworksApi";
import {
  getThreadworksUserDisplayName,
  getThreadworksUserInitials,
  type Post,
} from "@mixtape/core/types/threadworksTypes";

const MAX_INTRO_LENGTH = 300;
const WELCOME_FORUM = "welcome";
const TAY_SLUG = "who-we-are";

// ── helpers ────────────────────────────────────────────────────────────────

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

// ── PostItem ───────────────────────────────────────────────────────────────

function PostItem({ post }: { post: Post }) {
  const displayName = getThreadworksUserDisplayName(post.author);
  const initials = getThreadworksUserInitials(post.author);

  return (
    <Flex
      className="tay-post"
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
          className="tay-post-avatar"
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

// ── main component ─────────────────────────────────────────────────────────

interface GroupLandingDTellAboutYourselfProps {
  groupSlug: string;
  isCollapsed: boolean;
  onCollapse: () => void;
}

export function GroupLandingDTellAboutYourself({ groupSlug, isCollapsed, onCollapse }: GroupLandingDTellAboutYourselfProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [introText, setIntroText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const threadCardRef = useRef<HTMLDivElement>(null);

  const remaining = MAX_INTRO_LENGTH - introText.length;
  const editRemaining = MAX_INTRO_LENGTH - editText.length;

  // ── discussion thread ───────────────────────────────────────────────────
  const discussionQuery = useQuery({
    queryKey: ["threadworks", "discussion", groupSlug, WELCOME_FORUM, TAY_SLUG],
    queryFn: () => fetchDiscussion(WELCOME_FORUM, TAY_SLUG, groupSlug),
  });

  const [replyText, setReplyText] = useState("");

  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      createPost(WELCOME_FORUM, TAY_SLUG, { content }, groupSlug),
    onSuccess: () => {
      setReplyText("");
      qc.invalidateQueries({
        queryKey: ["threadworks", "discussion", groupSlug, WELCOME_FORUM, TAY_SLUG],
      });
    },
    onError: () => toaster.error({ title: "Could not post reply" }),
  });

  const introMutation = useMutation({
    mutationFn: (content: string) =>
      createPost(WELCOME_FORUM, TAY_SLUG, { content }, groupSlug),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["threadworks", "discussion", groupSlug, WELCOME_FORUM, TAY_SLUG],
      });
    },
    onError: () => toaster.error({ title: "Could not post intro" }),
  });

  const posts = discussionQuery.data?.posts ?? [];
  const hasPostedToThread = !discussionQuery.isLoading && posts.some((p) => p.author?.username === user?.username);
  const myPost = posts.find((p) => p.author?.username === user?.username);
  const showIntroCard = !discussionQuery.isLoading && !hasPostedToThread && !isCollapsed;

  const editMutation = useMutation({
    mutationFn: () =>
      updatePost(WELCOME_FORUM, TAY_SLUG, myPost!.id, { content: editText.trim() }, groupSlug),
    onSuccess: () => {
      setEditMode(false);
      qc.invalidateQueries({
        queryKey: ["threadworks", "discussion", groupSlug, WELCOME_FORUM, TAY_SLUG],
      });
      toaster.success({ title: "Intro updated" });
    },
    onError: () => toaster.error({ title: "Could not update intro" }),
  });

  return (
    <Flex className="tay-root" direction="column" gap={5}>

      {/* Pre-intro heading — shown only when member hasn't posted yet */}
      {showIntroCard && (
        <Box className="tay-heading">
          <Text
            as="h2"
            fontFamily="heading"
            fontSize="22px"
            fontWeight="700"
            color="theme.text"
            lineHeight="1.2"
          >
            Say Hello
          </Text>
          <Text fontSize="14px" color="theme.textSecondary" mt="4px">
            A short intro helps the group get to know you — it'll show up in the thread below.
          </Text>
        </Box>
      )}

      {/* Intro composer — shown pre-intro, not collapsed */}
      {showIntroCard && (
        <Box
          className="tay-intro-card"
          bg="theme.surface"
          borderWidth="1px"
          borderColor="theme.border"
          borderRadius="16px"
          boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
          p={5}
          position="relative"
        >
          {/* Dismiss — icon only, tooltip via title */}
          <Box
            as="button"
            className="tay-dismiss"
            position="absolute"
            top="12px"
            right="12px"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="24px"
            h="24px"
            borderRadius="full"
            borderWidth="1px"
            borderColor="theme.border"
            color="theme.textSecondary"
            cursor="pointer"
            _hover={{ bg: "theme.bgSubtle", color: "theme.text", borderColor: "theme.textMuted" }}
            transition="all 0.12s"
            onClick={onCollapse}
            title="Not ready? Come back anytime."
          >
            <IconMinus size={13} />
          </Box>

          <Flex className="tay-intro-form" direction="column" gap={3} pr="28px">
            {/* Label + username badge */}
            <Flex align="center" justify="space-between">
              <Text
                fontSize="11.5px"
                fontWeight="600"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="theme.textMuted"
              >
                Your introduction
              </Text>
              {user?.username && (
                <Box
                  display="inline-block"
                  px="10px"
                  py="4px"
                  borderRadius="full"
                  bg="theme.accentSoft"
                  borderWidth="1px"
                  borderColor="theme.border"
                >
                  <Text fontSize="13px" fontWeight="600" color="theme.accent">
                    @{user.username}
                  </Text>
                </Box>
              )}
            </Flex>

            {/* Copy from profile — offered when they have a profile intro but textarea is empty */}
            {user?.profile?.quick_intro && introText === "" && (
              <Box
                as="button"
                textAlign="left"
                fontSize="13px"
                color="theme.accent"
                fontWeight="500"
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                onClick={() => setIntroText(user?.profile?.quick_intro ?? "")}
              >
                Copy from your profile intro →
              </Box>
            )}

            <Textarea
              className="tay-intro-textarea"
              minH="88px"
              value={introText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIntroText(e.target.value)}
              placeholder="A few words about who you are, what you're exploring, or what brings you here."
              bg="theme.surface"
              borderColor={remaining < 0 ? "red.400" : "theme.border"}
              _focus={{
                borderColor: remaining < 0 ? "red.400" : "theme.accent",
                boxShadow: "none",
              }}
              resize="none"
            />

            {/* Caption + submit */}
            <Flex align="center" justify="space-between">
              <Text
                fontSize="12px"
                color={remaining < 0 ? "red.400" : remaining < 20 ? "theme.accent" : "theme.textMuted"}
              >
                Shared with the group in Who We Are · {remaining} characters left
              </Text>
              <Box
                as="button"
                flexShrink={0}
                ml={3}
                px="16px"
                py="7px"
                borderRadius="full"
                bg="theme.accent"
                color="white"
                fontSize="13px"
                fontWeight="600"
                cursor={introMutation.isPending || !introText.trim() || remaining < 0 ? "not-allowed" : "pointer"}
                opacity={introMutation.isPending || !introText.trim() || remaining < 0 ? 0.6 : 1}
                transition="all 0.12s"
                _hover={!introMutation.isPending && !!introText.trim() && remaining >= 0 ? { opacity: 0.9 } : {}}
                onClick={() => {
                  if (!introMutation.isPending && introText.trim() && remaining >= 0) {
                    introMutation.mutate(introText.trim());
                  }
                }}
              >
                {introMutation.isPending ? "Posting…" : "Post intro"}
              </Box>
            </Flex>
          </Flex>
        </Box>
      )}

      {/* Post-intro strip — shown after member has posted */}
      {hasPostedToThread && !editMode && (
        <Box
          className="tay-intro-strip"
          bg="theme.surface"
          borderWidth="1px"
          borderColor="theme.border"
          borderRadius="16px"
          boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
          px={5}
          py={4}
        >
          <Flex align="center" gap="10px" mb="10px">
            <Box color="theme.accent" display="flex" alignItems="center">
              <IconCheck size={16} />
            </Box>
            <Text fontSize="14px" fontWeight="600" color="theme.text">
              You introduced yourself.
            </Text>
            <Box
              as="button"
              fontSize="13px"
              fontWeight="600"
              color="theme.accent"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={() => {
                setEditText(myPost?.content ?? "");
                setEditMode(true);
              }}
            >
              Edit intro
            </Box>
          </Flex>
          <Text fontSize="13px" color="theme.textSecondary">
            Want to add a couple details to your profile so people can find you later?{" "}
            <NextLink href="/dashboard?section=edit-profile">
              <Box
                as="span"
                fontWeight="600"
                color="theme.accent"
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
              >
                Edit Profile
              </Box>
            </NextLink>
          </Text>
        </Box>
      )}

      {/* Edit intro composer — shown when member clicks "Edit intro" */}
      {hasPostedToThread && editMode && (
        <Box
          className="tay-intro-card tay-intro-edit"
          bg="theme.surface"
          borderWidth="1px"
          borderColor="theme.border"
          borderRadius="16px"
          boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
          p={5}
        >
          <Flex direction="column" gap={3}>
            <Text
              fontSize="11.5px"
              fontWeight="600"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="theme.textMuted"
            >
              Edit your introduction
            </Text>

            <Textarea
              className="tay-intro-textarea"
              minH="88px"
              value={editText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
              placeholder="A few words about who you are, what you're exploring, or what brings you here."
              bg="theme.surface"
              borderColor={editRemaining < 0 ? "red.400" : "theme.border"}
              _focus={{
                borderColor: editRemaining < 0 ? "red.400" : "theme.accent",
                boxShadow: "none",
              }}
              resize="none"
            />

            <Flex align="center" justify="space-between">
              <Text
                fontSize="12px"
                color={editRemaining < 0 ? "red.400" : editRemaining < 20 ? "theme.accent" : "theme.textMuted"}
              >
                Shared with the group in Who We Are · {editRemaining} characters left
              </Text>
              <Flex gap={2} ml={3}>
                <Box
                  as="button"
                  px="14px"
                  py="7px"
                  borderRadius="full"
                  bg="theme.bgSubtle"
                  borderWidth="1px"
                  borderColor="theme.border"
                  fontSize="13px"
                  fontWeight="600"
                  color="theme.textSecondary"
                  cursor="pointer"
                  _hover={{ color: "theme.text", borderColor: "theme.textMuted" }}
                  transition="all 0.12s"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Box>
                <Box
                  as="button"
                  px="16px"
                  py="7px"
                  borderRadius="full"
                  bg="theme.accent"
                  color="white"
                  fontSize="13px"
                  fontWeight="600"
                  cursor={editMutation.isPending || !editText.trim() || editRemaining < 0 ? "not-allowed" : "pointer"}
                  opacity={editMutation.isPending || !editText.trim() || editRemaining < 0 ? 0.6 : 1}
                  transition="all 0.12s"
                  _hover={!editMutation.isPending && !!editText.trim() && editRemaining >= 0 ? { opacity: 0.9 } : {}}
                  onClick={() => {
                    if (!editMutation.isPending && editText.trim() && editRemaining >= 0) {
                      editMutation.mutate();
                    }
                  }}
                >
                  {editMutation.isPending ? "Saving…" : "Update intro"}
                </Box>
              </Flex>
            </Flex>
          </Flex>
        </Box>
      )}

      {/* Discussion thread */}
      <Box
        ref={threadCardRef}
        className="tay-thread-card"
        scrollMarginTop="72px"
        bg="theme.surface"
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="16px"
        boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
        overflow="hidden"
      >
        <Box px={5} pt={5} pb={3} borderBottomWidth="1px" borderColor="theme.border">
          <Text fontFamily="heading" fontSize="18px" fontWeight="600" color="theme.text">
            Who We Are{" "}
            <Box as="span" fontWeight="400" fontSize="15px" color="theme.textSecondary">
              ({posts.length})
            </Box>
          </Text>
          <Text fontSize="13px" color="theme.textMuted" mt="2px">
            A shared thread where members introduce themselves.
          </Text>
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
                No posts yet — be the first to introduce yourself.
              </Text>
            </Box>
          )}

          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </Box>

        {/* Reply form — shown only after member has posted their intro */}
        {hasPostedToThread && (
          <Box
            className="tay-reply-form"
            px={5}
            py={4}
            borderTopWidth="1px"
            borderColor="theme.border"
          >
            <Flex gap={2} align="flex-end">
              <Textarea
                className="tay-reply-textarea"
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
                cursor={
                  replyMutation.isPending || !replyText.trim() ? "not-allowed" : "pointer"
                }
                opacity={replyMutation.isPending || !replyText.trim() ? 0.4 : 1}
                transition="opacity 0.12s"
                onClick={() => {
                  if (!replyMutation.isPending && replyText.trim()) {
                    replyMutation.mutate(replyText.trim());
                  }
                }}
              >
                <IconSend size={15} />
              </Box>
            </Flex>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
