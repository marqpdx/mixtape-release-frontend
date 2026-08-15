// apps/mixtape/src/app/(authenticated)/groups/[slug]/catalyst/page.tsx
// Dissolve shell — Catalyst surface. Input at top (declarative). Left panel constant.

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type GroupDetail = {
  title: string;
  slug: string;
  quick_intro?: string;
};

type IntroState = "center" | "animating" | "bubble";

const BRAND = "#1a1a2e";
const VERBS = ["Find", "Amend", "Add"];

export default function GroupCatalystPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [introState, setIntroState] = useState<IntroState>("center");
  const [cmdInput, setCmdInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── color tokens ──────────────────────────────────────────────────────────
  const shellBg        = useColorModeValue("#f4f5f7", "#111827");
  const topBarBg       = useColorModeValue("white", "#1a202c");
  const topBarBorder   = useColorModeValue("#e2e8f0", "#2d3748");
  const centerBg       = useColorModeValue("#f9fafb", "#111827");
  const cardBg         = useColorModeValue("white", "#1e2533");
  const cardBorder     = useColorModeValue("#e2e8f0", "#2d3748");
  const mutedText      = useColorModeValue("#6b7280", "#9ca3af");
  const chipBg         = useColorModeValue("#f1f5f9", "#1e2a3a");
  const chipBorder     = useColorModeValue("#e2e8f0", "#2d3748");
  const chipText       = useColorModeValue("#374151", "#cbd5e0");
  const dropZoneHoverBg = useColorModeValue("#eef3ff", "#1a2030");
  const dropZoneBorder  = useColorModeValue("#c7d7fe", "#2d3748");
  const statusBg        = useColorModeValue("#f0fdf4", "#0f2318");
  const statusBorder    = useColorModeValue("#bbf7d0", "#166534");
  const statusText      = useColorModeValue("#15803d", "#4ade80");

  useEffect(() => {
    axiosInstance
      .get(`/api/public/groups/${slug}`)
      .then((res) => setGroup(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleImport() {
    setIntroState("animating");
    setTimeout(() => setIntroState("bubble"), 480);
  }

  function handleRestoreIntro() {
    setIntroState("center");
  }

  function seedVerb(verb: string) {
    setCmdInput(verb + " ");
    inputRef.current?.focus();
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh" bg={shellBg}>
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box
      className="cat-shell"
      display="flex"
      height="100%"
      minH="calc(100vh - 60px)"
      bg={shellBg}
      overflow="hidden"
      sx={{
        "@keyframes cat-dissolve-out": {
          "0%":   { opacity: 1, transform: "scale(1) translateX(0)" },
          "60%":  { opacity: 0.5, transform: "scale(0.55) translateX(-18%)" },
          "100%": { opacity: 0, transform: "scale(0.25) translateX(-32%)" },
        },
        "@keyframes cat-bubble-appear": {
          "0%":   { opacity: 0, transform: "scale(0.3)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "@keyframes cat-work-appear": {
          "0%":   { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* ── LEFT PANEL — constant persistence anchor ────────────────────── */}
      <Box
        className="cat-left"
        width="52px"
        bg={BRAND}
        display="flex"
        flexDirection="column"
        alignItems="center"
        py={4}
        gap={4}
        flexShrink={0}
        borderRight="1px solid rgba(255,255,255,0.06)"
      >
        {/* Codex anchor icon */}
        <Box
          title="Codex anchor"
          fontSize="18px"
          color="white"
          opacity={0.55}
          cursor="default"
          lineHeight="1"
          userSelect="none"
        >
          ◈
        </Box>

        {/* Intro bubble — appears after dissolve, click to restore */}
        {(introState === "animating" || introState === "bubble") && (
          <Box
            className="cat-intro-bubble"
            onClick={introState === "bubble" ? handleRestoreIntro : undefined}
            cursor={introState === "bubble" ? "pointer" : "default"}
            w="34px"
            h="34px"
            borderRadius="full"
            bg="rgba(255,255,255,0.10)"
            border="1px solid rgba(255,255,255,0.18)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            title="Restore orientation"
            animation={introState === "bubble" ? "cat-bubble-appear 0.3s ease forwards" : undefined}
            _hover={introState === "bubble" ? { bg: "rgba(255,255,255,0.18)" } : undefined}
            transition="background 0.15s"
          >
            <Text fontSize="13px" lineHeight="1">📍</Text>
          </Box>
        )}
      </Box>

      {/* ── MAIN AREA ───────────────────────────────────────────────────── */}
      <Box className="cat-main" flex="1" display="flex" flexDirection="column" overflow="hidden">

        {/* TOP BAR — Catalyst command input (declarative, anchoring) */}
        <Box
          className="cat-top-bar"
          bg={topBarBg}
          borderBottom="1px solid"
          borderColor={topBarBorder}
          px={4}
          py="7px"
          display="flex"
          alignItems="center"
          gap={3}
          flexShrink={0}
        >
          <Text
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.1em"
            textTransform="uppercase"
            color={mutedText}
            flexShrink={0}
            userSelect="none"
          >
            {group?.title ?? "Catalyst"}
          </Text>
          <Box w="1px" h="14px" bg={topBarBorder} flexShrink={0} />

          <Input
            ref={inputRef}
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="Find, Amend, Add…"
            size="sm"
            variant="unstyled"
            flex="1"
            fontSize="sm"
            fontFamily="mono"
            _placeholder={{ color: mutedText, opacity: 0.7 }}
          />

          {/* Verb affordances — click seeds the input */}
          <HStack gap={1} flexShrink={0}>
            {VERBS.map((v) => (
              <Box
                key={v}
                as="button"
                onClick={() => seedVerb(v)}
                px="8px"
                py="2px"
                borderRadius="4px"
                bg={chipBg}
                border="1px solid"
                borderColor={chipBorder}
                fontSize="11px"
                fontWeight="600"
                color={chipText}
                cursor="pointer"
                fontFamily="mono"
                _hover={{ borderColor: BRAND, color: BRAND }}
                transition="all 0.12s"
              >
                {v}
              </Box>
            ))}
          </HStack>
        </Box>

        {/* CENTER — relative container for dissolve overlay */}
        <Box
          className="cat-center"
          flex="1"
          overflow="auto"
          bg={centerBg}
          position="relative"
        >

          {/* ── INTRO CARD — center state, dissolves out in animating state ── */}
          {(introState === "center" || introState === "animating") && (
            <Box
              className="cat-intro"
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={{ base: 5, md: 8 }}
              animation={
                introState === "animating"
                  ? "cat-dissolve-out 0.48s cubic-bezier(0.4,0,0.2,1) forwards"
                  : undefined
              }
              pointerEvents={introState === "animating" ? "none" : undefined}
            >
              <Box
                className="cat-intro-card"
                maxW="560px"
                w="full"
                bg={cardBg}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="xl"
                overflow="hidden"
                boxShadow="0 4px 24px rgba(0,0,0,0.06)"
              >
                {/* Header strip */}
                <Box bg={BRAND} color="white" px={8} py={6}>
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                    opacity={0.45}
                    mb={3}
                  >
                    Catalyst · Foundation
                  </Text>
                  <Heading
                    as="h1"
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="700"
                    letterSpacing="-0.02em"
                    mb={2}
                  >
                    {group?.title}
                  </Heading>
                  {group?.quick_intro && (
                    <Text fontSize="sm" opacity={0.65}>
                      {group.quick_intro}
                    </Text>
                  )}
                </Box>

                {/* Body */}
                <Box px={8} py={6}>
                  <VStack align="stretch" gap={5}>
                    <HStack
                      gap={2}
                      px={3}
                      py={2.5}
                      bg={statusBg}
                      border="1px solid"
                      borderColor={statusBorder}
                      borderRadius="md"
                    >
                      <Box w="7px" h="7px" borderRadius="full" bg="green.400" flexShrink={0} />
                      <Text fontSize="xs" fontWeight="500" color={statusText}>
                        Codex active — 13 starter files indexed
                      </Text>
                    </HStack>

                    <Box>
                      <Text fontWeight="600" fontSize="sm" mb={1}>
                        Catalyst needs your files to be useful.
                      </Text>
                      <Text fontSize="sm" color={mutedText} lineHeight="1.6">
                        The starter Codex gives you structure, but structure without content is a shell.
                        Import your documents — recipes, playbooks, supplier lists, anything your team
                        acts on — and we&apos;ll parse and structure them into your knowledge base.
                      </Text>
                    </Box>

                    <Box borderTop="1px solid" borderColor={cardBorder} pt={5}>
                      <Button
                        onClick={handleImport}
                        bg={BRAND}
                        color="white"
                        _hover={{ opacity: 0.88 }}
                        size="md"
                        w="full"
                        fontWeight="600"
                      >
                        Import your files →
                      </Button>
                      <Text fontSize="xs" color={mutedText} mt={2} textAlign="center">
                        Markdown, PDF, DOCX, plain text — we&apos;ll sort it out.
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              </Box>
            </Box>
          )}

          {/* ── FILE IMPORT SURFACE — revealed after dissolve ──────────── */}
          {introState === "bubble" && (
            <Box
              className="cat-import-surface"
              maxW="600px"
              mx="auto"
              px={6}
              py={10}
              animation="cat-work-appear 0.4s ease forwards"
            >
              <VStack align="stretch" gap={7}>
                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color={mutedText}
                    mb={2}
                  >
                    Import · Stage 1 of 3
                  </Text>
                  <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={1}>
                    Bring in your files
                  </Heading>
                  <Text fontSize="sm" color={mutedText}>
                    Documents, lists, notes — anything that holds knowledge about how your team works.
                    We&apos;ll parse it and propose a structure for your review before anything is committed.
                  </Text>
                </Box>

                {/* Drop zone */}
                <Box
                  borderRadius="lg"
                  border="2px dashed"
                  borderColor={dropZoneBorder}
                  p={12}
                  textAlign="center"
                  cursor="pointer"
                  bg={cardBg}
                  _hover={{ borderColor: BRAND, bg: dropZoneHoverBg }}
                  transition="all 0.15s"
                >
                  <Text fontSize="2xl" mb={3}>📂</Text>
                  <Text fontWeight="600" fontSize="sm" mb={1}>Drop files here</Text>
                  <Text fontSize="xs" color={mutedText}>
                    or click to browse — Markdown, PDF, DOCX, plain text
                  </Text>
                </Box>

                {/* What happens next */}
                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color={mutedText}
                    mb={3}
                  >
                    What happens next
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {[
                      { step: "1", label: "Parse", body: "We read your files and propose artifact shapes — registers, playbooks, context files." },
                      { step: "2", label: "Review", body: "You confirm the shape before anything is created. Nothing is committed without your say-so." },
                      { step: "3", label: "Canonize", body: "Confirmed artifacts enter your Codex. You decide what's canon now vs. draft for later." },
                    ].map(({ step, label, body }) => (
                      <HStack
                        key={step}
                        align="start"
                        gap={3}
                        p={3}
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="md"
                      >
                        <Box
                          w="22px"
                          h="22px"
                          borderRadius="full"
                          bg={BRAND}
                          color="white"
                          fontSize="10px"
                          fontWeight="700"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          mt="1px"
                        >
                          {step}
                        </Box>
                        <Box>
                          <Text fontWeight="600" fontSize="sm">{label}</Text>
                          <Text fontSize="xs" color={mutedText}>{body}</Text>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Text fontSize="xs" color={mutedText} textAlign="center">
                  Files stay in your Codex on your cluster. Nothing is shared without your explicit approval.
                </Text>
              </VStack>
            </Box>
          )}

        </Box>
      </Box>
    </Box>
  );
}
