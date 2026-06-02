"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { useAuth } from "@/lib/auth/AuthContext";
import { IconArrowRight } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const MAX_INTRO_LENGTH = 300;

export default function QuickIntroPage() {
  return (
    <Suspense fallback={null}>
      <QuickIntroContent />
    </Suspense>
  );
}

function QuickIntroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, refreshUser } = useAuth();
  const [quickIntro, setQuickIntro] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const agreementsHref = useMemo(() => {
    const params = new URLSearchParams();
    const groupSlug = searchParams.get("group_slug");
    const groupName = searchParams.get("group");

    if (groupSlug) params.set("group_slug", groupSlug);
    if (groupName) params.set("group", groupName);

    const suffix = params.toString();
    return suffix ? `/welcome/agreements?${suffix}` : "/welcome/agreements";
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && !user) {
      const loginParams = new URLSearchParams();
      loginParams.set("redirect", agreementsHref);
      router.replace(`/login?${loginParams.toString()}`);
    }
  }, [agreementsHref, isLoading, router, user]);

  useEffect(() => {
    setQuickIntro(user?.profile?.quick_intro || "");
  }, [user?.profile?.quick_intro]);

  const handleContinue = async () => {
    if (!user?.username) return;

    const trimmed = quickIntro.trim();
    if (trimmed.length > MAX_INTRO_LENGTH) return;

    setSubmitting(true);
    try {
      if (trimmed !== (user.profile?.quick_intro || "")) {
        await axiosInstance.patch(`/api/members/${user.username}`, {
          quick_intro: trimmed,
        });
        await refreshUser();
      }

      router.push(agreementsHref);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save your intro.";
      toaster.error({
        title: "Unable to save intro",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_INTRO_LENGTH - quickIntro.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Box minH="100vh" bg="theme.bg" py={{ base: 10, md: 16 }} px={{ base: 6, md: 8 }}>
        <Container maxW="2xl" px={0}>
          <VStack align="start" gap={2} mb={6}>
            <Text
              fontSize="sm"
              color="theme.textSecondary"
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Step 2 of 3
            </Text>
            <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
              Tell us about yourself
            </Heading>
            <Text color="theme.textSecondary">
              Share a short intro for the people you are joining. You can change this later.
            </Text>
          </VStack>

          <Box
            bg="theme.surface"
            border="1px solid"
            borderColor="theme.border"
            borderRadius="2xl"
            p={{ base: 6, md: 8 }}
          >
            <VStack align="stretch" gap={4}>
              <Box>
                <Text color="theme.text" fontWeight="600" mb={2}>
                  Quick intro
                </Text>
                <Textarea
                  rows={6}
                  value={quickIntro}
                  maxLength={MAX_INTRO_LENGTH}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setQuickIntro(e.target.value)
                  }
                  placeholder="A few words about who you are, what brings you here, or what you are exploring."
                  bg="theme.surface"
                  borderColor={remaining < 0 ? "red.400" : "theme.border"}
                  _focus={{
                    borderColor: remaining < 0 ? "red.400" : "theme.accent",
                    boxShadow: "none",
                  }}
                />
                <HStack mt={2} justify="space-between" color="theme.textSecondary">
                  <Text fontSize="sm">This appears on your member profile.</Text>
                  <Text fontSize="sm">{remaining} left</Text>
                </HStack>
              </Box>

              <HStack justify="space-between" pt={2}>
                <Button
                  variant="ghost"
                  color="theme.textSecondary"
                  onClick={() => router.push(agreementsHref)}
                >
                  Skip for now
                </Button>
                <Button
                  bg="theme.accent"
                  color="white"
                  borderRadius="xl"
                  px={6}
                  py={5}
                  size="lg"
                  loading={submitting}
                  disabled={isLoading || !user || remaining < 0}
                  onClick={handleContinue}
                  _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                >
                  <IconArrowRight size={18} />
                  Continue
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Container>
      </Box>
    </motion.div>
  );
}
