// apps/mixtape/src/app/(authenticated)/member/[username]/stall/page.tsx

"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Skeleton,
  Alert,
  Breadcrumb,
  Badge,
  Avatar,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { IconChevronRight, IconShoppingBag } from "@tabler/icons-react";
import { useMemberProfile } from "@hooks/member/useMemberProfile";
import { useStall } from "@mixtape/api/hooks/useBazaar";
import OfferingCard from "@/components/bazaar/offerings/OfferingCard";

/**
 * MEMBER STALL PAGE
 *
 * Public-facing storefront for a member's personal offerings.
 * Displays all active offerings that the member has published.
 */
export default function MemberStallPage() {
  const params = useParams();
  const username = params?.username as string;

  // Fetch member info
  const { member, isLoading: memberLoading, error: memberError } = useMemberProfile(username);

  // Fetch stall (offerings) for this member
  const {
    stall,
    isLoading: stallLoading,
    error: stallError,
  } = useStall(member ? "user" : null, member?.id || null);

  const isLoading = memberLoading || stallLoading;
  const error = memberError || stallError;

  // Loading
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Skeleton height="32px" width="300px" mb={4} />
        <Skeleton height="24px" width="200px" mb={8} />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height="280px" borderRadius="md" />
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  // Error
  if (error || !member) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>
            {error?.message || "Member not found"}
          </Alert.Title>
        </Alert.Root>
      </Container>
    );
  }

  const offerings = stall?.offerings || [];
  const hasOfferings = offerings.length > 0;
  const displayName = member.display_name || member.username;

  return (
    <Container maxW="container.xl" py={8}>
      {/* Breadcrumb */}
      <Breadcrumb.Root mb={6}>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link as={NextLink} href={`/member/${username}`}>
              {displayName}
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>
            <IconChevronRight size={14} />
          </Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink>Stall</Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      {/* Header */}
      <VStack align="start" gap={4} mb={8}>
        <HStack gap={4}>
          {member.avatar_url && (
            <Avatar.Root size="lg">
              <Avatar.Image src={member.avatar_url} alt={displayName} />
              <Avatar.Fallback>{displayName.charAt(0).toUpperCase()}</Avatar.Fallback>
            </Avatar.Root>
          )}
          <VStack align="start" gap={1}>
            <HStack gap={3}>
              <IconShoppingBag size={28} />
              <Heading size="xl">{displayName}&apos;s Stall</Heading>
            </HStack>
            <Text color="gray.600">
              @{member.username}
            </Text>
          </VStack>
        </HStack>

        <Text color="gray.600" fontSize="lg">
          Browse offerings from {displayName}
        </Text>
        {stall && (
          <Badge colorPalette="blue" fontSize="sm">
            {stall.offerings_count} {stall.offerings_count === 1 ? "offering" : "offerings"} available
          </Badge>
        )}
      </VStack>

      {/* Offerings Grid */}
      {!hasOfferings ? (
        <Box textAlign="center" py={16}>
          <IconShoppingBag size={64} style={{ margin: "0 auto", opacity: 0.3 }} />
          <Heading size="md" mt={4} color="gray.500">
            No offerings available
          </Heading>
          <Text color="gray.400" mt={2}>
            {displayName} hasn&apos;t published any offerings yet.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {offerings.map((offering) => (
            <OfferingCard
              key={offering.id}
              offering={offering}
              showSponsor={false}
            />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
