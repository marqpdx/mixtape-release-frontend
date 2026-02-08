// apps/mixtape/src/app/(authenticated)/member/[username]/page.tsx

"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Avatar,
  Spinner,
  Badge,
  Grid,
  GridItem,
  Link,
} from "@chakra-ui/react";
import { IconMail, IconCalendar, IconUser, IconShoppingBag, IconBooks } from "@tabler/icons-react";
import NextLink from "next/link";
import { useMemberProfile } from "@hooks/member/useMemberProfile";
import { useColorModeValue } from "@components/ui/color-mode";
import { MixtapeAlert } from "@/components/ui/alerts";
import { useStall } from "@mixtape/api/hooks/useBazaar";
// import { ErrorAlert } from "@components/ui/alerts/ErrorAlert";

/**
 * Public Member Profile Page
 *
 * Displays a member's public profile information.
 * Route: /member/[username]
 */
export default function MemberProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const { member, isLoading, error } = useMemberProfile(username);
  const { stall } = useStall(member ? "user" : null, member?.id || null);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const returnPayload =
    typeof window !== "undefined"
      ? window.localStorage.getItem("memberProfileReturn")
      : null;
  const returnInfo = returnPayload ? (() => {
    try {
      return JSON.parse(returnPayload) as { slug?: string; title?: string };
    } catch {
      return null;
    }
  })() : null;
  const returnHref = returnInfo?.slug ? `/app/groups/${returnInfo.slug}` : null;

  if (isLoading) {
    return (
      <Container maxW="4xl" py={12}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="300px">
          <VStack gap={4}>
            <Spinner size="xl" />
            <Text color={subtextColor}>Loading profile...</Text>
          </VStack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="4xl" py={12}>
        <MixtapeAlert status="error"
          title="Error Loading Profile"
          description={error.message || "Unable to load member profile"}
        />
      </Container>
    );
  }

  if (!member) {
    return (
      <Container maxW="4xl" py={12}>
        <MixtapeAlert status="warning"
          title="Profile Not Found"
          description="The member profile you're looking for doesn't exist."
        />
      </Container>
    );
  }

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ");
  const joinDate = new Date(member.date_joined).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <Container maxW="4xl" py={8}>
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="xl"
        overflow="hidden"
        shadow="sm"
      >
        {/* Header Section */}
        <Box
          bgGradient="linear(to-r, blue.500, purple.500)"
          h="120px"
          position="relative"
        />

        {/* Profile Content */}
        <Box px={8} pb={8}>
          {returnHref && (
            <HStack justify="flex-end" mt={4}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.localStorage.removeItem("memberProfileReturn");
                  window.location.href = returnHref;
                }}
              >
                Return to {returnInfo?.title || "group"}
              </Button>
            </HStack>
          )}
          {/* Avatar - overlapping header */}
          <Box mt="-60px" mb={4}>
            <Avatar.Root size="2xl">
              <Avatar.Image src={member.avatar_url || undefined} />
              <Avatar.Fallback>
                {member.display_name?.charAt(0) || member.username?.charAt(0) || "?"}
              </Avatar.Fallback>
            </Avatar.Root>
          </Box>

          <VStack align="start" gap={6}>
            {/* Name & Username */}
            <Box>
              <Heading size="xl" mb={1}>
                {member.display_name || fullName || member.username}
              </Heading>
              <Text color={subtextColor} fontSize="md">
                @{member.username}
              </Text>
            </Box>

            {/* Quick Intro */}
            {member.quick_intro && (
              <Text fontSize="lg" color={subtextColor} maxW="600px">
                {member.quick_intro}
              </Text>
            )}

            {/* Roles */}
            {member.roles && member.roles.length > 0 && (
              <HStack gap={2} flexWrap="wrap">
                {member.roles.map((role) => (
                  <Badge
                    key={role}
                    colorPalette={
                      role === "admin"
                        ? "red"
                        : role === "steward"
                        ? "purple"
                        : "blue"
                    }
                    variant="subtle"
                    px={3}
                    py={1}
                    borderRadius="full"
                    textTransform="capitalize"
                  >
                    {role}
                  </Badge>
                ))}
              </HStack>
            )}

            {/* Details Grid */}
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={4}
              w="100%"
              pt={4}
            >
              {fullName && (
                <GridItem>
                  <HStack gap={3} color={subtextColor}>
                    <IconUser size={18} />
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" textTransform="uppercase">
                        Name
                      </Text>
                      <Text fontSize="sm">{fullName}</Text>
                    </Box>
                  </HStack>
                </GridItem>
              )}

              {member.email && (
                <GridItem>
                  <HStack gap={3} color={subtextColor}>
                    <IconMail size={18} />
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" textTransform="uppercase">
                        Email
                      </Text>
                      <Text fontSize="sm">{member.email}</Text>
                    </Box>
                  </HStack>
                </GridItem>
              )}

              <GridItem>
                <HStack gap={3} color={subtextColor}>
                  <IconCalendar size={18} />
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" textTransform="uppercase">
                      Member Since
                    </Text>
                    <Text fontSize="sm">{joinDate}</Text>
                  </Box>
                </HStack>
              </GridItem>
            </Grid>

            {/* Bazaar Stall Link */}
            {stall && stall.offerings_count > 0 && (
              <Box
                w="100%"
                p={4}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="lg"
              >
                <HStack justify="space-between" align="center">
                  <HStack gap={3}>
                    <IconShoppingBag size={20} />
                    <Box>
                      <Text fontWeight="medium">Bazaar Stall</Text>
                      <Text fontSize="sm" color={subtextColor}>
                        {stall.offerings_count} {stall.offerings_count === 1 ? "offering" : "offerings"} available
                      </Text>
                    </Box>
                  </HStack>
                  <Link as={NextLink} href={`/member/${username}/stall`}>
                    <Button size="sm" variant="outline">
                      <IconShoppingBag size={16} />
                      View Stall
                    </Button>
                  </Link>
                </HStack>
              </Box>
            )}

            <Box
              w="100%"
              p={4}
              borderWidth="1px"
              borderColor={cardBorder}
              borderRadius="lg"
            >
              <HStack justify="space-between" align="center">
                <HStack gap={3}>
                  <IconBooks size={20} />
                  <Box>
                    <Text fontWeight="medium">Library</Text>
                    <Text fontSize="sm" color={subtextColor}>
                      Writing shelves and published pieces
                    </Text>
                  </Box>
                </HStack>
                <Link as={NextLink} href={`/@${username}/library`}>
                  <Button size="sm" variant="outline">
                    <IconBooks size={16} />
                    View Library
                  </Button>
                </Link>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Container>
  );
}
