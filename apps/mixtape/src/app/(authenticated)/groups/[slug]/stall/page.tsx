// apps/mixtape/src/app/(authenticated)/groups/[slug]/stall/page.tsx

"use client";

import { use } from "react";
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
} from "@chakra-ui/react";
import NextLink from "next/link";
import { IconChevronRight, IconShoppingBag } from "@tabler/icons-react";
import { useGroup } from "@mixtape/api/hooks/groups/useGroups";
import { useStall } from "@mixtape/api/hooks/useBazaar";
import OfferingCard from "@/components/bazaar/offerings/OfferingCard";

interface GroupStallPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * GROUP STALL PAGE
 *
 * Public-facing storefront for a group's offerings.
 * Displays all active offerings that the group has published.
 */
export default function GroupStallPage({ params }: GroupStallPageProps) {
  const { slug } = use(params);

  // Fetch group info
  const { group, isLoading: groupLoading, error: groupError } = useGroup(slug);

  // Fetch stall (offerings) for this group
  const {
    stall,
    isLoading: stallLoading,
    error: stallError,
  } = useStall(group ? "group" : null, group?.id || null);

  const isLoading = groupLoading || stallLoading;
  const error = groupError || stallError;

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
  if (error || !group) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>
            {error?.message || "Group not found"}
          </Alert.Title>
        </Alert.Root>
      </Container>
    );
  }

  const offerings = stall?.offerings || [];
  const hasOfferings = offerings.length > 0;

  return (
    <Container maxW="container.xl" py={8}>
      {/* Breadcrumb */}
      <Breadcrumb.Root mb={6}>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link as={NextLink} href={`/groups/${slug}`}>
              {group.title}
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
      <VStack align="start" gap={3} mb={8}>
        <HStack gap={3}>
          <IconShoppingBag size={32} />
          <Heading size="xl">{group.title}&apos;s Stall</Heading>
        </HStack>
        <Text color="gray.600" fontSize="lg">
          Browse offerings from {group.title}
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
            {group.title} hasn&apos;t published any offerings yet.
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
