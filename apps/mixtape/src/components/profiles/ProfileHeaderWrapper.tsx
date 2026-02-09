// apps/mixtape/src/components/profiles/ProfileHeaderWrapper.tsx

"use client";

import { Box, Flex, Heading, Text, Avatar } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

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
  void mode;
  const bannerFallback = useColorModeValue(
    "linear-gradient(120deg, rgba(226,232,240,0.8), rgba(248,250,252,1))",
    "linear-gradient(120deg, rgba(30,41,59,1), rgba(51,65,85,0.9))"
  );
  const bannerBorder = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const subtitleColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Box w="100%" borderBottom="1px solid" borderColor={bannerBorder}>
      <Box className="bobBox"
        w="100%"
        h={{ base: "170px", md: "230px" }}
        bg={bannerImageUrl ? undefined : bannerFallback}
        bgImage={bannerImageUrl ? `url(${bannerImageUrl})` : undefined}
        bgSize="cover"
        bgPos="center"
        position="relative"
      />

      <Box
        maxW="7xl"
        mx="auto"
        px={{ base: 4, md: 8 }}
        position="relative"
        pb={{ base: 4, md: 6 }}
      >
        <Flex className="bobFlex"
          align="flex-end"
          gap={4}
          direction={{ base: "column", md: "row" }}
          mt={{ base: -10, md: -12 }}
        >
          <Avatar.Root size={{ base: "xl", md: "2xl" }} borderWidth="4px" borderColor="white">
            {avatarImageUrl ? <Avatar.Image src={avatarImageUrl} /> : null}
            <Avatar.Fallback>{avatarFallbackText}</Avatar.Fallback>
          </Avatar.Root>

          <Box
            textAlign={{ base: "center", md: "left" }}
            pt={{ base: 2, md: 6 }}
            pb={{ base: 2, md: 0 }}
          >
            <Heading size="lg" color={titleColor}>
              {title}
            </Heading>
            {subtitle && (
              <Text mt={1} color={subtitleColor} fontSize="sm">
                {subtitle}
              </Text>
            )}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
