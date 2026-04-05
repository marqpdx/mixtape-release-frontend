"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { HelpDocSummary } from "@/types/help";

interface HelpIndexClientProps {
  docs: HelpDocSummary[];
  baseHref?: string;
}

function matchesQuery(doc: HelpDocSummary, query: string): boolean {
  if (!query) return true;
  const haystack = [
    doc.title,
    doc.summary,
    doc.feature,
    doc.metadata.library || "",
    doc.headings.map((heading) => heading.text).join(" "),
    doc.plainText,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function HelpIndexClient({ docs, baseHref = "/help" }: HelpIndexClientProps) {
  const [query, setQuery] = useState("");
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const featureFilterKey = `mixtape_help_feature_filter_${baseHref}`;
  const statusFilterKey = `mixtape_help_status_filter_${baseHref}`;

  const featureOptions = useMemo(
    () => Array.from(new Set(docs.map((doc) => doc.feature))).sort(),
    [docs]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          docs
            .map((doc) => doc.metadata.status?.trim())
            .filter((status): status is string => Boolean(status))
        )
      ).sort(),
    [docs]
  );

  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) => {
        if (!matchesQuery(doc, query.trim())) return false;
        if (featureFilter !== "all" && doc.feature !== featureFilter) return false;
        if (statusFilter !== "all" && doc.metadata.status !== statusFilter) return false;
        return true;
      }),
    [docs, query, featureFilter, statusFilter]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedFeature = window.localStorage.getItem(featureFilterKey);
    const storedStatus = window.localStorage.getItem(statusFilterKey);

    if (storedFeature && (storedFeature === "all" || featureOptions.includes(storedFeature))) {
      setFeatureFilter(storedFeature);
    }
    if (storedStatus && (storedStatus === "all" || statusOptions.includes(storedStatus))) {
      setStatusFilter(storedStatus);
    }
  }, [featureOptions, statusOptions, featureFilterKey, statusFilterKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(featureFilterKey, featureFilter);
  }, [featureFilter, featureFilterKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(statusFilterKey, statusFilter);
  }, [statusFilter, statusFilterKey]);

  return (
    <Flex direction={{ base: "column", lg: "row" }} gap={{ base: 6, lg: 10 }} align="flex-start">
      <Box
        w={{ base: "full", lg: "240px" }}
        position={{ base: "static", lg: "sticky" }}
        top={{ base: "auto", lg: "calc(var(--app-topbar) + 24px)" }}
      >
        <Stack gap={5}>
          <Stack gap={2}>
            <Text fontSize="xs" color="fg.muted" letterSpacing="0.18em" textTransform="uppercase">
              Taxonomy
            </Text>
            <Stack gap={1}>
              <Button
                size="sm"
                justifyContent="space-between"
                variant={featureFilter === "all" ? "subtle" : "ghost"}
                onClick={() => setFeatureFilter("all")}
              >
                <Text>All features</Text>
                <Text color="fg.muted">{docs.length}</Text>
              </Button>
              {featureOptions.map((feature) => {
                const count = docs.filter((doc) => doc.feature === feature).length;
                return (
                  <Button
                    key={feature}
                    size="sm"
                    justifyContent="space-between"
                    variant={featureFilter === feature ? "subtle" : "ghost"}
                    onClick={() => setFeatureFilter(feature)}
                  >
                    <Text>{feature}</Text>
                    <Text color="fg.muted">{count}</Text>
                  </Button>
                );
              })}
            </Stack>
          </Stack>

          <Stack gap={2}>
            <Text fontSize="xs" color="fg.muted" letterSpacing="0.18em" textTransform="uppercase">
              Status
            </Text>
            <HStack gap={2} wrap="wrap">
              <Button
                size="xs"
                variant={statusFilter === "all" ? "solid" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  size="xs"
                  variant={statusFilter === status ? "solid" : "outline"}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </HStack>
          </Stack>
        </Stack>
      </Box>

      <Stack gap={6} flex="1" minW={0}>
        <Stack gap={2}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help docs..."
            maxW="520px"
            bg="bg"
          />
          <Text fontSize="sm" color="fg.muted">
            {filteredDocs.length} {filteredDocs.length === 1 ? "article" : "articles"}
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {filteredDocs.map((doc) => (
            <Box
              key={doc.slug}
              asChild
              borderWidth="1px"
              borderColor="border"
              bg="bg"
              borderRadius="xl"
              p={5}
              transition="border-color 0.2s ease, transform 0.2s ease"
              _hover={{ borderColor: "border.emphasized", transform: "translateY(-1px)" }}
            >
              <NextLink href={`${baseHref}/${doc.slug}`}>
                <Stack gap={3}>
                  <HStack justify="space-between" align="flex-start">
                    <Text fontSize="xl" fontWeight="semibold" color="fg">
                      {doc.title}
                    </Text>
                    <Badge variant="subtle">{doc.feature}</Badge>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted" lineClamp={3}>
                    {doc.summary || doc.plainText}
                  </Text>
                  <HStack gap={3} color="fg.subtle" fontSize="xs" wrap="wrap">
                    {doc.metadata.lastUpdated ? <Text>Updated {doc.metadata.lastUpdated}</Text> : null}
                    {doc.metadata.status ? <Text>Status: {doc.metadata.status}</Text> : null}
                    {doc.headings.length > 0 ? <Text>{doc.headings.length} sections</Text> : null}
                  </HStack>
                </Stack>
              </NextLink>
            </Box>
          ))}
        </SimpleGrid>

        {filteredDocs.length === 0 ? (
          <Box borderWidth="1px" borderColor="border" borderRadius="xl" p={6} bg="bg">
            <Text fontWeight="medium" color="fg">
              No help articles matched that search.
            </Text>
            <Text mt={1} fontSize="sm" color="fg.muted">
              Try a feature name like “workbench” or a concept like “RSVP”.
            </Text>
          </Box>
        ) : null}
      </Stack>
    </Flex>
  );
}
