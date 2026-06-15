// apps/mixtape/src/components/groups/memberview-d/GroupLandingDTellAboutYourself.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Flex, Image, Text, Textarea, Spinner, IconButton } from "@chakra-ui/react";
import NextLink from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconSend, IconInfoCircle, IconMinus } from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchDiscussion, createPost } from "@mixtape/api/clients/threadworks/threadworksApi";
import {
  getThreadworksUserDisplayName,
  getThreadworksUserInitials,
  type Post,
} from "@mixtape/core/types/threadworksTypes";

const MAX_INTRO_LENGTH = 300;
const WELCOME_FORUM = "welcome";
const TAY_SLUG = "tell-about-yourself";

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
      {post.author.avatar_url ? (
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
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();

  // ── quick intro edit ────────────────────────────────────────────────────
  const [introText, setIntroText] = useState("");
  const [introSaving, setIntroSaving] = useState(false);
  const [introSaved, setIntroSaved] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [sharePosting, setSharePosting] = useState(false);

  // Capture whether the user had an intro when the component first mounted.
  // null = not yet known (user still loading); false = was empty; true = had content.
  const hadIntroOnMount = useRef<boolean | null>(null);

  useEffect(() => {
    const currentIntro = user?.profile?.quick_intro || "";
    setIntroText(currentIntro);
    setIntroSaved(false);
    if (hadIntroOnMount.current === null) {
      hadIntroOnMount.current = !!currentIntro;
    }
  }, [user?.profile?.quick_intro]);

  const remaining = MAX_INTRO_LENGTH - introText.length;

  async function handleSaveIntro() {
    if (!user?.username || remaining < 0) return;
    setIntroSaving(true);
    setIntroSaved(false);
    setShowSharePrompt(false);
    try {
      await axiosInstance.patch(`/api/members/${user.username}`, {
        quick_intro: introText.trim(),
      });
      await refreshUser();
      setIntroSaved(true);
      toaster.success({ title: "Intro saved" });

      const isFirstPost = hadIntroOnMount.current === false;
      if (isFirstPost) {
        // Auto-post the intro to the thread on first save
        hadIntroOnMount.current = true;
        await createPost(WELCOME_FORUM, TAY_SLUG, { content: introText.trim() }, groupSlug);
        qc.invalidateQueries({
          queryKey: ["threadworks", "discussion", groupSlug, WELCOME_FORUM, TAY_SLUG],
        });
      } else {
        // Offer to share the update to the thread
        setShowSharePrompt(true);
      }
    } catch {
      toaster.error({ title: "Could not save intro" });
    } finally {
      setIntroSaving(false);
    }
  }

  async function handleShareToThread() {
    setSharePosting(true);
    try {
      await createPost(WELCOME_FORUM, TAY_SLUG, { content: introText.trim() }, groupSlug);
      qc.invalidateQueries({
        queryKey: ["threadworks", "discussion", groupSlug, WELCOME_FORUM, TAY_SLUG],
      });
      setShowSharePrompt(false);
      toaster.success({ title: "Posted to thread" });
    } catch {
      toaster.error({ title: "Could not post to thread" });
    } finally {
      setSharePosting(false);
    }
  }

  // ── discussion thread ───────────────────────────────────────────────────
  const discussionQuery = useQuery({
    queryKey: ["threadworks", "discussion", groupSlug, WELCOME_FORUM, TAY_SLUG],
    queryFn: () => fetchDiscussion(WELCOME_FORUM, TAY_SLUG, groupSlug),
  });

  const [replyText, setReplyText] = useState("");

  const postMutation = useMutation({
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

  const posts = discussionQuery.data?.posts ?? [];

  return (
    <Flex className="tay-root" direction="column" gap={5}>

      {/* Quick intro card — hidden when collapsed */}
      {!isCollapsed && (
      <Box
        className="tay-intro-card"
        bg="theme.surface"
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="16px"
        boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
        p={5}
      >
        <Flex className="tay-intro-body" gap={6} align="stretch">

          {/* Left 60% — textarea + controls */}
          <Box flex="3" minW={0}>
            <Flex align="center" justify="space-between" mb={4}>
              <Text
                fontSize="11.5px"
                fontWeight="600"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="theme.textMuted"
              >
                Your introduction
              </Text>
              <Flex align="center" gap={2}>
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
                <IconButton
                  aria-label="Hide Your Introduction"
                  size="xs"
                  variant="ghost"
                  color="theme.textFaint"
                  _hover={{ color: "theme.textMuted" }}
                  onClick={onCollapse}
                  title="Hide this section"
                >
                  <IconMinus size={14} />
                </IconButton>
              </Flex>
            </Flex>

            <Textarea
              className="tay-intro-textarea"
              rows={4}
              value={introText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setIntroText(e.target.value);
                setIntroSaved(false);
                setShowSharePrompt(false);
              }}
              placeholder="A few words about who you are, what you're exploring, or what brings you here."
              bg="theme.surface"
              borderColor={remaining < 0 ? "red.400" : "theme.border"}
              _focus={{
                borderColor: remaining < 0 ? "red.400" : "theme.accent",
                boxShadow: "none",
              }}
              resize="vertical"
            />

            <Flex align="center" justify="space-between" mt={3}>
              <Text
                fontSize="12px"
                color={remaining < 0 ? "red.400" : remaining < 20 ? "theme.accent" : "theme.textMuted"}
              >
                {remaining} characters left
              </Text>
              <Box
                as="button"
                px="16px"
                py="7px"
                borderRadius="full"
                bg={introSaved ? "theme.bgSubtle" : "theme.accent"}
                color={introSaved ? "theme.textSecondary" : "white"}
                fontSize="13px"
                fontWeight="600"
                cursor={introSaving || remaining < 0 ? "not-allowed" : "pointer"}
                opacity={introSaving || remaining < 0 ? 0.6 : 1}
                transition="all 0.12s"
                _hover={!introSaving && remaining >= 0 ? { opacity: 0.9 } : {}}
                onClick={handleSaveIntro}
              >
                {introSaving ? "Saving…" : introSaved ? "Saved ✓" : "Save intro"}
              </Box>
            </Flex>
          </Box>

          {/* Right 40% — context panel */}
          <Flex
            className="tay-intro-context"
            flex="2"
            direction="column"
            justify="space-between"
            borderLeftWidth="1px"
            borderColor="theme.border"
            pl={6}
            gap={4}
          >
            <Flex gap={3} align="flex-start">
              <Box color="theme.accent" flexShrink={0} mt="2px">
                <IconInfoCircle size={20} />
              </Box>
              <Text fontSize="13.5px" color="theme.textSecondary" lineHeight="1.6">
                Thank you for sharing a bit about you. You can see what others have
                written below.
                <br /><br />
                You can edit this and other profile fields by clicking{" "}
                <Box as="span" fontWeight="600" color="theme.text">Edit Profile</Box>{" "}
                below.
                <br /><br />
                When you{"'"}re good for now, you can hide this section by clicking the{" "}
                <Box
                  as="span"
                  display="inline-flex"
                  alignItems="center"
                  verticalAlign="middle"
                  mx="2px"
                  position="relative"
                  top="-1px"
                  color="theme.textMuted"
                >
                  <IconMinus size={13} />
                </Box>{" "}
                button above, and restore it with the{" "}
                <Box as="span" fontWeight="600" color="theme.text">Your Intro</Box>{" "}
                button that appears in the header.
              </Text>
            </Flex>
            <Box>
              <Box
                as={NextLink}
                href="/dashboard?section=edit-profile"
                display="inline-block"
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
                _hover={{ color: "theme.accent", borderColor: "theme.accent" }}
                transition="all 0.12s"
              >
                Edit Profile
              </Box>
            </Box>
          </Flex>
        </Flex>

        {/* Share-to-thread prompt — appears after non-first save */}
        {showSharePrompt && (
          <Flex
            className="tay-share-prompt"
            mt={3}
            p={3}
            bg="theme.bgSubtle"
            borderRadius="10px"
            borderWidth="1px"
            borderColor="theme.border"
            align="center"
            gap={3}
          >
            <Text fontSize="13px" color="theme.textSecondary" flex="1">
              Share this update to the Tell About Yourself thread?
            </Text>
            <Flex gap={2} flexShrink={0}>
              <Box
                as="button"
                px="12px"
                py="5px"
                borderRadius="full"
                fontSize="12px"
                fontWeight="600"
                color="theme.textMuted"
                cursor="pointer"
                _hover={{ color: "theme.textSecondary" }}
                onClick={() => setShowSharePrompt(false)}
              >
                Dismiss
              </Box>
              <Box
                as="button"
                px="12px"
                py="5px"
                borderRadius="full"
                bg="theme.accent"
                color="white"
                fontSize="12px"
                fontWeight="600"
                cursor={sharePosting ? "not-allowed" : "pointer"}
                opacity={sharePosting ? 0.6 : 1}
                transition="opacity 0.12s"
                _hover={!sharePosting ? { opacity: 0.9 } : {}}
                onClick={handleShareToThread}
              >
                {sharePosting ? "Posting…" : "Post"}
              </Box>
            </Flex>
          </Flex>
        )}
      </Box>
      )} {/* end !isCollapsed */}

      {/* Discussion thread */}
      <Box
        className="tay-thread-card"
        bg="theme.surface"
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="16px"
        boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
        overflow="hidden"
      >
        <Box px={5} pt={5} pb={3} borderBottomWidth="1px" borderColor="theme.border">
          <Text fontFamily="heading" fontSize="18px" fontWeight="600" color="theme.text">
            Tell About Yourself{" "}
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
                No posts yet — save your intro above to start the thread.
              </Text>
            </Box>
          )}

          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </Box>

        {/* Reply form */}
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
                postMutation.isPending || !replyText.trim() ? "not-allowed" : "pointer"
              }
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
    </Flex>
  );
}
