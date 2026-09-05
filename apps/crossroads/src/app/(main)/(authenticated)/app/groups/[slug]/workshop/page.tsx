"use client";

import { use } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";

export default function GroupWorkshopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, isLoading } = useAuth();

  const bg = useColorModeValue("gray.50", "gray.900");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  if (isLoading) {
    return (
      <Box className="wks-loading" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bg}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!user?.is_superuser) {
    return (
      <Box className="wks-gate" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bg}>
        <Text color={mutedText} fontSize="sm">
          Home Workshop is not available yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="wks-root" bg={bg} minH="100vh" px={{ base: 6, md: 12 }} py={10}>
      <Text
        className="wks-surface-label"
        fontSize="xs"
        fontWeight="600"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color={mutedText}
        mb={4}
      >
        Home Workshop · {slug}
      </Text>
      <Text fontSize="sm" color={mutedText}>
        Surface scaffold — pilot in progress.
      </Text>
    </Box>
  );
}
