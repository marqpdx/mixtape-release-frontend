"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import StorylineExperience from "@/components/crossroads/StorylineExperience";

export default function StorylinePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const defaultGroupSlug = process.env.NEXT_PUBLIC_DEFAULT_GROUP_SLUG || "crossroads";

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    router.replace(`/group/${defaultGroupSlug}`);
  }, [defaultGroupSlug, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!isAuthenticated || !user?.username) {
    return (
      <Box px="6" py="20">
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text color="gray.500">Opening the default group storyline…</Text>
        </VStack>
      </Box>
    );
  }

  return <StorylineExperience username={user.username} />;
}
