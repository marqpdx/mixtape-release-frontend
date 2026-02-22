// apps/mixtape/src/app/(authenticated)/bazaar/page.tsx

"use client";

import { Suspense, useState, useMemo } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Input,
  InputGroup,
  Select,
  Skeleton,
  SkeletonText,
  createListCollection,
} from "@chakra-ui/react";
import { IconSearch } from "@tabler/icons-react";
import { useOfferings } from "@mixtape/api/hooks/useBazaar";
import {
  OfferingShape,
  OfferingFilters,
} from "@mixtape/core/types/bazaarTypes";
import OfferingCard from "@/components/bazaar/offerings/OfferingCard";

/**
 * BAZAAR CATALOG PAGE
 *
 * Main marketplace browse page showing all active offerings.
 * Features:
 * - Search by title/description
 * - Filter by shape (service, event, program, product)
 * - Filter by price (free, paid)
 * - Grid layout of offering cards
 */
function BazaarCatalogPageClient() {
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [shapeFilter, setShapeFilter] = useState<OfferingShape | "">("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  const shapeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Services", value: "service" },
          { label: "Events", value: "event" },
          { label: "Programs", value: "program" },
          { label: "Products", value: "product" },
        ],
      }),
    []
  );

  const priceCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "All prices", value: "all" },
          { label: "Free only", value: "free" },
          { label: "Paid only", value: "paid" },
        ],
      }),
    []
  );

  // Build API filters
  const apiFilters: OfferingFilters = useMemo(() => {
    const filters: OfferingFilters = {
      status: "active",
    };
    if (shapeFilter) {
      filters.shape = shapeFilter;
    }
    return filters;
  }, [shapeFilter]);

  // Fetch offerings
  const { offerings, isLoading, error } = useOfferings(apiFilters);

  // Client-side filtering for search and price
  const filteredOfferings = useMemo(() => {
    let result = offerings;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(query) ||
          o.summary.toLowerCase().includes(query)
      );
    }

    // Price filter
    if (priceFilter === "free") {
      result = result.filter((o) => o.is_free || o.effective_price === 0);
    } else if (priceFilter === "paid") {
      result = result.filter((o) => !o.is_free && o.effective_price > 0);
    }

    return result;
  }, [offerings, searchQuery, priceFilter]);

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header */}
      <VStack align="start" gap={2} mb={8}>
        <Heading size="xl">Bazaar</Heading>
        <Text color="gray.600">
          Discover services, events, programs, and products from the community
        </Text>
      </VStack>

      {/* Filters */}
      <HStack gap={4} mb={8} flexWrap="wrap">
        {/* Search */}
        <InputGroup maxW="300px" startElement={<IconSearch size={18} color="gray" />}>
          <Input
            placeholder="Search offerings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        {/* Shape filter */}
        <Select.Root
          collection={shapeCollection}
          value={shapeFilter ? [shapeFilter] : []}
          onValueChange={({ value }) => setShapeFilter((value[0] as OfferingShape) || "")}
        >
          <Select.HiddenSelect />
          <Select.Control maxW="180px">
            <Select.Trigger>
              <Select.ValueText placeholder="All types" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {shapeCollection.items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>

        {/* Price filter */}
        <Select.Root
          collection={priceCollection}
          value={[priceFilter]}
          onValueChange={({ value }) => setPriceFilter((value[0] as "all" | "free" | "paid") || "all")}
        >
          <Select.HiddenSelect />
          <Select.Control maxW="150px">
            <Select.Trigger>
              <Select.ValueText />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {priceCollection.items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </HStack>

      {/* Results count */}
      <Text color="gray.500" mb={4}>
        {isLoading
          ? "Loading..."
          : `${filteredOfferings.length} offering${filteredOfferings.length !== 1 ? "s" : ""} found`}
      </Text>

      {/* Error state */}
      {error && (
        <Box p={4} bg="red.50" borderRadius="md" mb={4}>
          <Text color="red.600">Error loading offerings: {error.message}</Text>
        </Box>
      )}

      {/* Loading state */}
      {isLoading && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box key={i} p={4} borderWidth="1px" borderRadius="lg">
              <Skeleton height="150px" mb={4} />
              <SkeletonText lineClamp={3} gap={2} />
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Empty state */}
      {!isLoading && filteredOfferings.length === 0 && (
        <Box textAlign="center" py={12}>
          <Text color="gray.500" fontSize="lg">
            No offerings found matching your criteria.
          </Text>
          <Text color="gray.400" mt={2}>
            Try adjusting your filters or search query.
          </Text>
        </Box>
      )}

      {/* Offerings grid */}
      {!isLoading && filteredOfferings.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {filteredOfferings.map((offering) => (
            <OfferingCard key={offering.id} offering={offering} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}

export default function BazaarCatalogPage() {
  return (
    <Suspense fallback={<Text>Loading bazaar...</Text>}>
      <BazaarCatalogPageClient />
    </Suspense>
  );
}
