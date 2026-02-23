// apps/mixtape/src/components/profiles/ProfileHeaderWrapper.tsx

"use client";

import { useState, useCallback } from "react";
import { Box, Flex, Heading, Text, Avatar, IconButton } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";

const COMPACT_STORAGE_KEY = "profileHeader_compact";

interface ProfileHeaderWrapperProps {
  mode: "self" | "public";
  title: string;
  subtitle?: string;
  bannerImageUrl?: string | null;
  avatarImageUrl?: string | null;
  avatarFallbackText: string;
}

export default function ProfileHeaderWrapper({
  mode,
  title,
  subtitle,
  bannerImageUrl,
  avatarImageUrl,
  avatarFallbackText,
}: ProfileHeaderWrapperProps) {
  const canCompact = mode === "self";

  const [compact, setCompact] = useState(() => {
    if (!canCompact) return false;
    if (typeof window !== "undefined") {
      return localStorage.getItem(COMPACT_STORAGE_KEY) === "true";
    }
    return false;
  });

  const toggleCompact = useCallback(() => {
    setCompact((prev) => {
      const next = !prev;
      localStorage.setItem(COMPACT_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const bannerFallback = useColorModeValue(
    "linear-gradient(120deg, rgba(226,232,240,0.8), rgba(248,250,252,1))",
    "linear-gradient(120deg, rgba(30,41,59,1), rgba(51,65,85,0.9))"
  );
  const bannerBorder = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const subtitleColor = useColorModeValue("gray.600", "gray.400");
  const toggleBg = useColorModeValue("whiteAlpha.700", "blackAlpha.500");

  return (
    <Box w="100%" borderBottom="1px solid" borderColor={bannerBorder} position="relative">
      <Box className="bobBox"
        w="100%"
        h={compact ? "0px" : { base: "170px", md: "230px" }}
        bg={bannerImageUrl ? undefined : bannerFallback}
        bgImage={bannerImageUrl ? `url(${bannerImageUrl})` : undefined}
        bgSize="cover"
        bgPos="center"
        position="relative"
        overflow="hidden"
        transition="height 0.3s ease"
      />

      <Box
        maxW="7xl"
        mx="auto"
        px={{ base: 4, md: 8 }}
        position="relative"
        pb={compact ? 2 : { base: 4, md: 6 }}
        transition="padding 0.3s ease"
      >
        <Flex className="bobFlex"
          align={compact ? "center" : "flex-end"}
          gap={compact ? 3 : 4}
          direction={{ base: compact ? "row" : "column", md: "row" }}
          mt={compact ? 2 : { base: -10, md: -12 }}
          transition="margin 0.3s ease"
        >
          <Avatar.Root
            size={compact ? { base: "md", md: "lg" } : { base: "xl", md: "2xl" }}
            borderWidth={compact ? "2px" : "4px"}
            borderColor="white"
          >
            {avatarImageUrl ? <Avatar.Image src={avatarImageUrl} /> : null}
            <Avatar.Fallback>{avatarFallbackText}</Avatar.Fallback>
          </Avatar.Root>

          <Box
            textAlign={{ base: compact ? "left" : "center", md: "left" }}
            pt={compact ? 0 : { base: 2, md: 6 }}
            pb={compact ? 0 : { base: 2, md: 0 }}
          >
            <Heading size={compact ? "md" : "lg"} color={titleColor}>
              {title}
            </Heading>
            {subtitle && !compact && (
              <Text mt={1} color={subtitleColor} fontSize="sm">
                {subtitle}
              </Text>
            )}
          </Box>
        </Flex>
      </Box>

      {/* Roll up / expand toggle — only for self mode */}
      {canCompact && (
        <IconButton
          size="xs"
          variant="ghost"
          position="absolute"
          top={compact ? 1 : 2}
          right={2}
          onClick={toggleCompact}
          aria-label={compact ? "Expand header" : "Collapse header"}
          title={compact ? "Expand header" : "Collapse header"}
          bg={toggleBg}
          borderRadius="full"
          _hover={{ bg: toggleBg, opacity: 0.9 }}
        >
          {compact ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
        </IconButton>
      )}
    </Box>
  );
}
