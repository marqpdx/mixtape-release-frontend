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
    <Box
      className="cmns-root"
      bg="theme.bg"
      color="theme.text"
      maxW="1200px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      py={8}
    >
      {/* Header */}
      <VStack className="cmns-header" align="start" gap={1} mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Crossroads Commons
        </Text>
        <Text fontSize="sm" color="theme.textMuted">
          A curated atlas of meaningful initiatives — people, organizations,
          projects, and places.
        </Text>
      </VStack>

      {/* Controls */}
      <HStack className="cmns-controls" justify="space-between" mb={4} wrap="wrap" gap={3}>
        <HStack className="cmns-view-controls" gap={1}>
          <Button
            aria-pressed={view === "map"}
            size="sm"
            variant={view === "map" ? "solid" : "outline"}
            onClick={() => setView("map")}
          >
            Map
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "solid" : "outline"}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List
          </Button>
        </HStack>

        <Input
          size="sm"
          maxW="260px"
          aria-label="Search Commons"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </HStack>

      {/* Error */}
      {error && (
        <Text role="alert" color="status.danger.fg" fontSize="sm" mb={4}>
          {error}
        </Text>
      )}

      {/* Map view */}
      {view === "map" && (
        <Box className="cmns-map" h="calc(100vh - 280px)" minH="420px">
          <CommonsMap items={items} />
        </Box>
      )}

      {/* List view */}
      {view === "list" && (
        <>
          {loading ? (
            <Box
              className="cmns-loading"
              role="status"
              aria-label="Loading Commons"
              color="theme.textMuted"
              textAlign="center"
              py={16}
            >
              <Spinner size="lg" />
            </Box>
          ) : items.length === 0 ? (
            <Box className="cmns-empty" textAlign="center" py={16}>
              <Text fontSize="sm" color="theme.textMuted">
                No published items yet.
              </Text>
            </Box>
          ) : (
            <VStack className="cmns-list" align="stretch" gap={3}>
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
