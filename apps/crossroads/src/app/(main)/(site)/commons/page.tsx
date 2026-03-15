"use client";

// app/(main)/(site)/commons/page.tsx

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Button,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  fetchPublicCommons,
  type PublicCommonsItem,
} from "@mixtape/api/clients/public/publicApi";
import CommonsItemCard from "@components/commons/CommonsItemCard";

const CommonsMap = dynamic(
  () => import("@components/commons/CommonsMap"),
  { ssr: false }
);

type ViewMode = "map" | "list";

export default function CommonsPage() {
  const [view, setView] = useState<ViewMode>("map");
  const [items, setItems] = useState<PublicCommonsItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtitleColor = useColorModeValue("gray.600", "gray.400");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchPublicCommons(search ? { search } : undefined);
        setItems(data);
      } catch {
        setError("Could not load Commons.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search]);

  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
      {/* Header */}
      <VStack align="start" gap={1} mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Crossroads Commons
        </Text>
        <Text fontSize="sm" color={subtitleColor}>
          A curated atlas of meaningful initiatives — people, organizations,
          projects, and places.
        </Text>
      </VStack>

      {/* Controls */}
      <HStack justify="space-between" mb={4} wrap="wrap" gap={3}>
        <HStack gap={1}>
          <Button
            size="sm"
            variant={view === "map" ? "solid" : "outline"}
            onClick={() => setView("map")}
          >
            Map
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "solid" : "outline"}
            onClick={() => setView("list")}
          >
            List
          </Button>
        </HStack>

        <Input
          size="sm"
          maxW="260px"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </HStack>

      {/* Error */}
      {error && (
        <Text color="red.500" fontSize="sm" mb={4}>
          {error}
        </Text>
      )}

      {/* Map view */}
      {view === "map" && (
        <Box h="calc(100vh - 280px)" minH="420px">
          <CommonsMap items={items} />
        </Box>
      )}

      {/* List view */}
      {view === "list" && (
        <>
          {loading ? (
            <Box textAlign="center" py={16}>
              <Spinner size="lg" />
            </Box>
          ) : items.length === 0 ? (
            <Box textAlign="center" py={16}>
              <Text fontSize="sm" color={mutedColor}>
                No published items yet.
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={3}>
              {items.map((item) => (
                <CommonsItemCard key={item.id} item={item} />
              ))}
            </VStack>
          )}
        </>
      )}
    </Box>
  );
}
