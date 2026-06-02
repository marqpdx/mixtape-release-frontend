// apps/mixtape/src/components/invitations/AcceptInviteForm.tsx

"use client";

import {
  Box,
  Button,
  Grid,
  Heading,
  Image,
  Input,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toaster } from "@mixtape/core/lib/toaster";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import * as authApi from "@mixtape/api/clients/auth/api";
import { motion } from "framer-motion";
import { Filter } from "bad-words";
import type { InviteInfoGroup } from "@mixtape/api/clients/public/publicApi";
import { useAuth } from "@/lib/auth/AuthContext";

const filter = new Filter();

const DEFAULT_GROUP_NAME =
  process.env.NEXT_PUBLIC_DEFAULT_GROUP_NAME ||
  process.env.MIXTAPE_DEFAULT_GROUP_NAME ||
  "Crossroads";

const DEFAULT_GROUP_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_GROUP_SLUG ||
  process.env.MIXTAPE_DEFAULT_GROUP_SLUG ||
  "crossroads";

const isValidUsername = (username: string) =>
  /^[a-zA-Z0-9_]{3,20}$/.test(username);

const containsProfanity = (username: string) => filter.isProfane(username);

const checkUsernameAvailable = async (username: string) => {
  try {
    const res = await axiosInstance.get(`/api/auth/check-username/${username}`);
    return res.data.available;
  } catch {
    return false;
  }
};

interface AcceptInviteFormProps {
  shortcode: string;
  isNewUser: boolean;
}

export function AcceptInviteForm({ shortcode, isNewUser }: AcceptInviteFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [group, setGroup] = useState<InviteInfoGroup | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!shortcode) return;
    axiosInstance
      .get<{ group: InviteInfoGroup & { name?: string } }>(`/api/auth/invite-info/${shortcode}`)
      .then((res) => {
        const g = res.data.group;
        // Backend may return 'name' instead of 'title'
        setGroup({ ...g, title: g.title || g.name || "" });
      })
      .catch((err) => {
        console.warn("[AcceptInviteForm] invite-info fetch failed:", err?.response?.status, err?.message);
      })
      .finally(() => setGroupLoading(false));
  }, [shortcode]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: { username?: string; password?: string }) => {
    setSubmitting(true);

    try {
      if (!shortcode) throw new Error("Missing invite shortcode");

      const payload: { shortcode: string; username?: string; password?: string } = { shortcode };
      if (isNewUser) {
        payload.username = data.username;
        payload.password = data.password;
      }

      const inviteResult = isNewUser
        ? await authApi.acceptInvite(payload)
        : (await axiosInstance.post("/api/auth/accept-invite", payload)).data;

      toaster.success({
        title: isNewUser ? "Welcome!" : "Success!",
        description: isNewUser
          ? "Your account has been activated."
          : `You've joined ${inviteResult.group?.title || "the group"}!`,
      });

      const groupSlug = inviteResult.group?.slug;
      const groupTitle = inviteResult.group?.title;
      if (isNewUser) {
        await authApi.activateInviteSession(inviteResult);
        await refreshUser();

        const introParams = new URLSearchParams();
        if (groupSlug) introParams.set("group_slug", groupSlug);
        if (groupTitle) introParams.set("group", groupTitle);
        router.push(`/welcome/quick-intro?${introParams.toString()}`);
      } else {
        router.push(groupSlug ? `/groups/${groupSlug}` : "/dashboard");
      }
    } catch (error) {
      const response = (error as { response?: { data?: { error?: string; detail?: string } } }).response;
      const message = error instanceof Error ? error.message : undefined;
      toaster.error({
        title: "Invalid or expired invite",
        description:
          response?.data?.error ||
          response?.data?.detail ||
          message ||
          "Could not accept invitation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const groupName = group?.title ?? "your group";
  const isDefaultGroup = group?.slug === DEFAULT_GROUP_SLUG;
  const initials = groupName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
    <Box minH="100vh" bg="theme.bg" display="flex" alignItems="center" justifyContent="center" py={12} px={{ base: 6, md: 8 }}>
      <Box w="full" maxW="2xl">
        <Grid
          templateColumns={{ base: "1fr", md: "200px 1fr" }}
          gap={{ base: 6, md: 10 }}
          mb={8}
          alignItems="start"
        >
          {/* Group image */}
          <Box
            w={{ base: "120px", md: "200px" }}
            h={{ base: "120px", md: "200px" }}
            borderRadius="2xl"
            overflow="hidden"
            bg="theme.border"
            flexShrink={0}
            mx={{ base: "auto", md: 0 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {group?.profile_image_url ? (
              <Image
                src={group.profile_image_url}
                alt={groupName}
                w="full"
                h="full"
                objectFit="cover"
              />
            ) : (
              <Text fontSize="4xl" fontWeight="bold" color="theme.textSecondary">
                {initials}
              </Text>
            )}
          </Box>

          {/* Welcome text */}
          <Box textAlign={{ base: "center", md: "left" }}>
            {groupLoading ? (
              <Skeleton height="48px" width="280px" borderRadius="md" />
            ) : (
              <Heading
                as="h1"
                size="2xl"
                color="theme.text"
                fontWeight="800"
                lineHeight="1.15"
              >
                Welcome to {group?.title ?? "…"}
              </Heading>
            )}
            {!isDefaultGroup && (
              <Text
                mt={1}
                fontSize="lg"
                color="theme.textSecondary"
                fontWeight="500"
              >
                at {DEFAULT_GROUP_NAME}
              </Text>
            )}
          </Box>
        </Grid>

        {/* Form */}
        <Box
          bg="theme.surface"
          border="1px solid"
          borderColor="theme.border"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
        >
          <Text color="theme.textSecondary" mb={5}>
            {isNewUser
              ? "Set your username and password to activate and log in to your account."
              : "Click below to accept this invitation and join the group."}
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={4}>
              {isNewUser && (
                <>
                  <Box>
                    <Input
                      type="text"
                      data-testid="username-input"
                      placeholder="Choose a username"
                      bg="theme.surface"
                      borderColor={errors.username ? "red.400" : "theme.border"}
                      _focus={{ borderColor: errors.username ? "red.400" : "theme.accent", boxShadow: "none" }}
                      {...register("username", {
                        required: "Username is required",
                        validate: async (value) => {
                          if (!isValidUsername(value))
                            return "Only letters, numbers, and _ allowed (3–20 characters)";
                          if (containsProfanity(value))
                            return "Inappropriate username";
                          const available = await checkUsernameAvailable(value);
                          return available || "Username already taken";
                        },
                      })}
                    />
                    {errors.username && (
                      <Text color="red.400" fontSize="sm" mt={1}>
                        {errors.username.message as string}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Input
                      type="password"
                      data-testid="password-input"
                      placeholder="Choose a password (min 8 characters)"
                      bg="theme.surface"
                      borderColor={errors.password ? "red.400" : "theme.border"}
                      _focus={{ borderColor: errors.password ? "red.400" : "theme.accent", boxShadow: "none" }}
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                      })}
                    />
                    {errors.password && (
                      <Text color="red.400" fontSize="sm" mt={1}>
                        {errors.password.message as string}
                      </Text>
                    )}
                  </Box>
                </>
              )}

              <Button
                type="submit"
                loading={submitting}
                bg="theme.accent"
                color="white"
                size="lg"
                borderRadius="xl"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                {isNewUser ? "Activate and Log In" : "Accept Invitation"}
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </Box>
    </motion.div>
  );
}
