// apps/mixtape/src/app/(authenticated)/groups/[slug]/catalyst/page.tsx
// Dissolve shell — Catalyst surface. Input at top (declarative). Left panel constant.

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Avatar,
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

type MemberPreview = {
  username: string;
  display_name: string;
  avatar_url: string;
};

type GroupDetail = {
  title: string;
  slug: string;
  quick_intro?: string;
  description?: string;
  member_preview?: MemberPreview[];
};

type IntroState = "center" | "animating" | "bubble" | "confirming";

type RegisterRow = {
  slug: string;
  displayName: string;
  canonSynonym: string;
  entryCount: number;
  sourceFile: string;
};

const BRAND = "#1a1a2e";
const VERBS = ["Find", "Amend", "Add"];

const PROPOSED_REGISTERS: RegisterRow[] = [
  { slug: "meals",              displayName: "Meal Register",      canonSynonym: "Final Menu", entryCount: 16,  sourceFile: "2026_Temple_Menu. UPDATED.docx" },
  { slug: "prep-tasks",         displayName: "Prep Tasks",          canonSynonym: "Live Prep",  entryCount: 42,  sourceFile: "2026_Prep_List..docx" },
  { slug: "confirmed-partners", displayName: "Confirmed Partners",  canonSynonym: "Confirmed",  entryCount: 25,  sourceFile: "TOB 2026 Fundraising Progress-2.xlsx" },
  { slug: "partner-outreach",   displayName: "Partner Outreach",    canonSynonym: "Active",     entryCount: 163, sourceFile: "TOB 2026 Fundraising Progress-2.xlsx" },
  { slug: "staff",              displayName: "Staff",               canonSynonym: "Active",     entryCount: 36,  sourceFile: "Temple 2026 Workbook (ours).xlsx" },
  { slug: "grants",             displayName: "Grants",              canonSynonym: "Awarded",    entryCount: 5,   sourceFile: "TOB 2026 Fundraising Progress-2.xlsx" },
  { slug: "meeting-actions",    displayName: "Meeting Actions",     canonSynonym: "Resolved",   entryCount: 8,   sourceFile: "Meeting 7_6_26.docx" },
];

const CONTEXT_FILES = [
  { slug: "dietary-restrictions-summary", label: "dietary-restrictions-summary" },
  { slug: "shift-schedule-2026",          label: "shift-schedule-2026" },
];

export default function GroupCatalystPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [introState, setIntroState] = useState<IntroState>("center");
  const [cmdInput, setCmdInput] = useState("");
  const [registers, setRegisters] = useState<RegisterRow[]>(PROPOSED_REGISTERS);
  const [contextOpen, setContextOpen] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const [materializeResult, setMaterializeResult] = useState<{ commit: string; registers_written: number } | null>(null);
  const [materializeError, setMaterializeError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── color tokens ──────────────────────────────────────────────────────────
  const shellBg         = useColorModeValue("#f4f5f7", "#111827");
  const topBarBg        = useColorModeValue("white", "#1a202c");
  const topBarBorder    = useColorModeValue("#e2e8f0", "#2d3748");
  const centerBg        = useColorModeValue("#f9fafb", "#111827");
  const cardBg          = useColorModeValue("white", "#1e2533");
  const cardBorder      = useColorModeValue("#e2e8f0", "#2d3748");
  const mutedText       = useColorModeValue("#6b7280", "#9ca3af");
  const chipBg          = useColorModeValue("#f1f5f9", "#1e2a3a");
  const chipBorder      = useColorModeValue("#e2e8f0", "#2d3748");
  const chipText        = useColorModeValue("#374151", "#cbd5e0");
  const dropZoneHoverBg = useColorModeValue("#eef3ff", "#1a2030");
  const dropZoneBorder  = useColorModeValue("#c7d7fe", "#2d3748");
  const statusBg        = useColorModeValue("#f0fdf4", "#0f2318");
  const statusBorder    = useColorModeValue("#bbf7d0", "#166534");
  const statusText      = useColorModeValue("#15803d", "#4ade80");
  const badgeBg         = useColorModeValue("#f1f5f9", "#1e2a3a");
  const badgeText       = useColorModeValue("#64748b", "#94a3b8");
  const synonymLabel    = useColorModeValue("#9ca3af", "#6b7280");
  const removeHover     = useColorModeValue("#fee2e2", "#3b1515");
  const startHereBg     = useColorModeValue("#eef4ff", "#1e2a40");
  const startHereBorder = useColorModeValue("#c3d9ff", "#2a4070");

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

  function updateRegisterName(idx: number, value: string) {
    setRegisters((prev) => prev.map((r, i) => i === idx ? { ...r, displayName: value } : r));
  }

  function updateRegisterSynonym(idx: number, value: string) {
    setRegisters((prev) => prev.map((r, i) => i === idx ? { ...r, canonSynonym: value } : r));
  }

  function removeRegister(idx: number) {
    setRegisters((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleMaterialize() {
    setMaterializing(true);
    setMaterializeError(null);
    try {
      const payload = registers.map((r) => ({
        slug: r.slug,
        display_name: r.displayName,
        canon_synonym: r.canonSynonym,
        entry_count: r.entryCount,
        source_file: r.sourceFile,
      }));
      const res = await axiosInstance.post(
        `/api/catalyst/groups/${slug}/materialize-registers/`,
        { registers: payload },
      );
      setMaterializeResult(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Materialization failed — check console.";
      setMaterializeError(msg);
    } finally {
      setMaterializing(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setSelectedFiles((prev) => [...prev, ...files]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) setSelectedFiles((prev) => [...prev, ...files]);
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh" bg={shellBg}>
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  const showBubble = introState === "animating" || introState === "bubble" || introState === "confirming";

  return (
    <>
    <style>{`
      @keyframes cat-dissolve-out {
        0%   { opacity: 1; transform: scale(1) translateX(0); }
        60%  { opacity: 0.5; transform: scale(0.55) translateX(-18%); }
        100% { opacity: 0; transform: scale(0.25) translateX(-32%); }
      }
      @keyframes cat-bubble-appear {
        0%   { opacity: 0; transform: scale(0.3); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes cat-work-appear {
        0%   { opacity: 0; transform: translateY(14px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `}</style>
    <Box
      className="cat-shell"
      display="flex"
      height="100%"
      minH="calc(100vh - 60px)"
      bg={shellBg}
      overflow="hidden"
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

        {showBubble && (
          <Box
            className="cat-intro-bubble"
            onClick={introState !== "animating" ? handleRestoreIntro : undefined}
            cursor={introState !== "animating" ? "pointer" : "default"}
            w="34px"
            h="34px"
            borderRadius="full"
            bg="rgba(255,255,255,0.10)"
            border="1px solid rgba(255,255,255,0.18)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            title="Restore orientation"
            animation={introState === "bubble" || introState === "confirming" ? "cat-bubble-appear 0.3s ease forwards" : undefined}
            _hover={introState !== "animating" ? { bg: "rgba(255,255,255,0.18)" } : undefined}
            transition="background 0.15s"
          >
            <Text fontSize="13px" lineHeight="1">📍</Text>
          </Box>
        )}
      </Box>

      {/* ── MAIN AREA ───────────────────────────────────────────────────── */}
      <Box className="cat-main" flex="1" display="flex" flexDirection="column" overflow="hidden">

        {/* TOP BAR */}
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
            flex="1"
            fontSize="sm"
            fontFamily="mono"
            border="none"
            background="transparent"
            boxShadow="none"
            _focus={{ boxShadow: "none", outline: "none" }}
            _placeholder={{ color: mutedText, opacity: 0.7 }}
          />

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

        {/* CENTER */}
        <Box
          className="cat-center"
          flex="1"
          overflow="auto"
          bg={centerBg}
          position="relative"
        >

          {/* ── INTRO / LANDING ── */}
          {(introState === "center" || introState === "animating") && (
            <Box
              className="cat-intro"
              position="absolute"
              inset={0}
              overflow="auto"
              display="flex"
              justifyContent="center"
              p={{ base: 5, md: 8 }}
              animation={
                introState === "animating"
                  ? "cat-dissolve-out 0.48s cubic-bezier(0.4,0,0.2,1) forwards"
                  : undefined
              }
              pointerEvents={introState === "animating" ? "none" : undefined}
            >
              <Box className="cat-intro-inner" maxW="640px" w="full">
                <VStack align="stretch" gap={6}>

                  {/* Header */}
                  <Box
                    className="cat-intro-header"
                    bg={BRAND}
                    color="white"
                    px={8}
                    py={7}
                    borderRadius="xl"
                    boxShadow="0 4px 24px rgba(0,0,0,0.10)"
                  >
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
                      <Text fontSize="sm" opacity={0.65} mb={4}>
                        {group.quick_intro}
                      </Text>
                    )}
                    <HStack gap={2}>
                      <Box w="7px" h="7px" borderRadius="full" bg="green.400" flexShrink={0} />
                      <Text fontSize="xs" fontWeight="500" opacity={0.8}>
                        Codex active — CORE + FIXTURE indexed
                      </Text>
                    </HStack>
                  </Box>

                  {/* Start here */}
                  <Box
                    className="cat-start-here"
                    bg={startHereBg}
                    border="1px solid"
                    borderColor={startHereBorder}
                    borderRadius="lg"
                    p={5}
                  >
                    <HStack gap={3} mb={2}>
                      <Text fontSize="lg">📍</Text>
                      <Text fontWeight="700" fontSize="md">Start here</Text>
                    </HStack>
                    <Text fontSize="sm" color={mutedText} mb={4}>
                      Open <strong>START-HERE.md</strong> in your Codex to orient yourself — it maps out
                      your knowledge structure, key files, and what to build first.
                    </Text>
                    <Button
                      onClick={handleImport}
                      bg={BRAND}
                      color="white"
                      _hover={{ opacity: 0.88 }}
                      size="sm"
                      fontWeight="600"
                    >
                      Import your files →
                    </Button>
                  </Box>

                  {/* Three pillars */}
                  <Box className="cat-pillars">
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color={mutedText}
                      mb={3}
                    >
                      What&apos;s in your Codex
                    </Text>
                    <VStack gap={3} align="stretch">
                      {[
                        {
                          icon: "📚",
                          title: "Knowledge Base",
                          body: "Seeded with the Catalyst CORE library — the foundational types, patterns, and structure your team will build on.",
                        },
                        {
                          icon: "🗂",
                          title: "Context Files",
                          body: "Who you are, how you work, what you offer. These are the files Beryl draws from when it helps your team.",
                        },
                        {
                          icon: "⚙️",
                          title: "Operational Files",
                          body: "Procedures, playbooks, and workflows. Active knowledge — not archive, not notes. Living documents your team acts on.",
                        },
                      ].map(({ icon, title, body }) => (
                        <HStack
                          key={title}
                          className="cat-pillar"
                          align="start"
                          gap={4}
                          p={4}
                          bg={cardBg}
                          border="1px solid"
                          borderColor={cardBorder}
                          borderRadius="md"
                        >
                          <Text fontSize="xl" flexShrink={0} mt="1px">{icon}</Text>
                          <Box>
                            <Text fontWeight="600" fontSize="sm" mb={1}>{title}</Text>
                            <Text fontSize="sm" color={mutedText}>{body}</Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  {/* Team preview */}
                  {(group?.member_preview ?? []).length > 0 && (
                    <Box className="cat-team">
                      <Text
                        fontSize="10px"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        textTransform="uppercase"
                        color={mutedText}
                        mb={3}
                      >
                        Your team
                      </Text>
                      <HStack gap={3} flexWrap="wrap">
                        {(group?.member_preview ?? []).map((m) => (
                          <HStack key={m.username} gap={2}>
                            <Avatar.Root size="sm">
                              <Avatar.Image src={m.avatar_url || undefined} />
                              <Avatar.Fallback>
                                {(m.display_name || m.username).charAt(0).toUpperCase()}
                              </Avatar.Fallback>
                            </Avatar.Root>
                            <Text fontSize="sm">{m.display_name || m.username}</Text>
                          </HStack>
                        ))}
                      </HStack>
                    </Box>
                  )}

                  <Text className="cat-support" fontSize="xs" color={mutedText}>
                    Questions or need a walkthrough? Reply to your activation email — we&apos;re here.
                  </Text>

                </VStack>
              </Box>
            </Box>
          )}

          {/* ── FILE IMPORT SURFACE ── */}
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

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".md,.pdf,.docx,.doc,.txt,.xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                />

                <Box
                  borderRadius="lg"
                  border="2px dashed"
                  borderColor={dragOver ? BRAND : dropZoneBorder}
                  p={12}
                  textAlign="center"
                  cursor="pointer"
                  bg={dragOver ? dropZoneHoverBg : cardBg}
                  _hover={{ borderColor: BRAND, bg: dropZoneHoverBg }}
                  transition="all 0.15s"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Text fontSize="2xl" mb={3}>📂</Text>
                  <Text fontWeight="600" fontSize="sm" mb={1}>
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                      : "Drop files here"}
                  </Text>
                  <Text fontSize="xs" color={mutedText}>
                    {selectedFiles.length > 0
                      ? selectedFiles.map((f) => f.name).join(", ").slice(0, 80)
                      : "or click to browse — Markdown, PDF, DOCX, XLSX, plain text"}
                  </Text>
                </Box>

                {selectedFiles.length > 0 && (
                  <Button
                    bg={BRAND}
                    color="white"
                    _hover={{ opacity: 0.88 }}
                    size="md"
                    w="full"
                    fontWeight="600"
                    onClick={() => setIntroState("confirming")}
                  >
                    Parse {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} →
                  </Button>
                )}

                <Text
                  as="button"
                  fontSize="xs"
                  color={mutedText}
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ color: BRAND }}
                  onClick={() => setIntroState("confirming")}
                >
                  Skip to Stage 4 → (dev shortcut)
                </Text>

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

          {/* ── STAGE 4 — REGISTER REVIEW ── */}
          {introState === "confirming" && (
            <Box
              className="cat-confirm-surface"
              maxW="720px"
              mx="auto"
              px={6}
              py={10}
              animation="cat-work-appear 0.4s ease forwards"
            >
              <VStack align="stretch" gap={7}>

                {/* Header */}
                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color={mutedText}
                    mb={2}
                  >
                    Review · Stage 2 of 3
                  </Text>
                  <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={1}>
                    We found {registers.length} registers — does this look right?
                  </Heading>
                  <Text fontSize="sm" color={mutedText} lineHeight="1.6">
                    These are the structures we&apos;ll create from your files. Adjust names or synonyms
                    before confirming. Nothing is written to disk until you say go.
                  </Text>
                </Box>

                {/* Register rows */}
                <VStack align="stretch" gap={2}>
                  {registers.map((reg, idx) => (
                    <Box
                      key={reg.slug}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={cardBorder}
                      borderRadius="lg"
                      px={4}
                      py={3}
                    >
                      <HStack align="start" gap={3}>
                        {/* Name + source */}
                        <VStack align="stretch" flex="1" gap={1.5}>
                          <HStack gap={2} align="center">
                            <Input
                              value={reg.displayName}
                              onChange={(e) => updateRegisterName(idx, e.target.value)}
                              fontSize="sm"
                              fontWeight="600"
                              flex="1"
                              px={0}
                              border="none"
                              background="transparent"
                              borderRadius={0}
                              _focus={{ outline: "none", boxShadow: "none", borderBottom: `1px solid ${BRAND}` }}
                            />
                            <Box
                              px={2}
                              py="1px"
                              bg={badgeBg}
                              borderRadius="full"
                              flexShrink={0}
                            >
                              <Text fontSize="10px" fontWeight="600" color={badgeText} whiteSpace="nowrap">
                                {reg.entryCount} entries
                              </Text>
                            </Box>
                          </HStack>
                          <Text
                            fontSize="10px"
                            fontFamily="mono"
                            color={synonymLabel}
                            maxW="340px"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                          >
                            {reg.sourceFile}
                          </Text>
                          <HStack gap={2} align="center" mt={0.5}>
                            <Text fontSize="10px" color={synonymLabel} flexShrink={0}>
                              Synonym for &ldquo;Canon&rdquo;:
                            </Text>
                            <Input
                              value={reg.canonSynonym}
                              onChange={(e) => updateRegisterSynonym(idx, e.target.value)}
                              placeholder="e.g. Final Menu, Live, Confirmed"
                              fontSize="11px"
                              flex="1"
                              px={0}
                              color={mutedText}
                              border="none"
                              background="transparent"
                              borderRadius={0}
                              _placeholder={{ color: synonymLabel, opacity: 0.7 }}
                              _focus={{ outline: "none", boxShadow: "none", borderBottom: `1px solid ${BRAND}` }}
                            />
                          </HStack>
                        </VStack>

                        {/* Remove button */}
                        <Box
                          as="button"
                          onClick={() => removeRegister(idx)}
                          w="24px"
                          h="24px"
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color={mutedText}
                          fontSize="14px"
                          flexShrink={0}
                          mt="2px"
                          _hover={{ bg: removeHover, color: "red.500" }}
                          transition="all 0.12s"
                          title="Remove this register"
                        >
                          ✕
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>

                {/* Context files — collapsible */}
                <Box
                  bg={cardBg}
                  border="1px solid"
                  borderColor={cardBorder}
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <HStack
                    px={4}
                    py={3}
                    as="button"
                    w="full"
                    justify="space-between"
                    onClick={() => setContextOpen((o) => !o)}
                    cursor="pointer"
                    _hover={{ bg: chipBg }}
                    transition="background 0.12s"
                  >
                    <Text fontSize="xs" fontWeight="600" color={mutedText}>
                      Also proposed as context files (not registers)
                    </Text>
                    <Text fontSize="10px" color={synonymLabel}>{contextOpen ? "▲" : "▼"}</Text>
                  </HStack>
                  {contextOpen && (
                    <VStack align="stretch" px={4} pb={3} gap={1.5}>
                      {CONTEXT_FILES.map((cf) => (
                        <Text key={cf.slug} fontSize="11px" fontFamily="mono" color={mutedText}>
                          {cf.label}
                        </Text>
                      ))}
                    </VStack>
                  )}
                </Box>

                {/* Error feedback */}
                {materializeError && (
                  <Box px={3} py={2} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                    <Text fontSize="xs" color="red.700">{materializeError}</Text>
                  </Box>
                )}

                {/* Success — replaces the action row */}
                {materializeResult ? (
                  <Box
                    bg={statusBg}
                    border="1px solid"
                    borderColor={statusBorder}
                    borderRadius="lg"
                    px={5}
                    py={5}
                  >
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Box w="7px" h="7px" borderRadius="full" bg="green.400" flexShrink={0} />
                        <Text fontSize="sm" fontWeight="600" color={statusText}>
                          {materializeResult.registers_written} register{materializeResult.registers_written !== 1 ? "s" : ""} written to your Codex
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color={mutedText}>
                        Commit <code>{materializeResult.commit}</code> — files are in{" "}
                        <code>CONTENT/registers/</code> in your Codex git repo. Draft entries
                        are waiting for your review. Canon synonyms are set per register.
                      </Text>
                      <HStack gap={3} flexWrap="wrap">
                        <Button
                          bg={BRAND}
                          color="white"
                          _hover={{ opacity: 0.88 }}
                          size="sm"
                          fontWeight="600"
                          flex="1"
                          onClick={() => setIntroState("center")}
                        >
                          ← Back to Codex home
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          fontWeight="600"
                          flex="1"
                          onClick={() => {
                            setMaterializeResult(null);
                            setMaterializeError(null);
                            setRegisters(PROPOSED_REGISTERS);
                          }}
                        >
                          Import more files
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ) : (
                  /* Pre-materialize action row */
                  <HStack justify="space-between" pt={2} flexWrap="wrap" gap={3}>
                    <Box
                      as="button"
                      onClick={() => setIntroState("bubble")}
                      fontSize="sm"
                      color={mutedText}
                      cursor="pointer"
                      _hover={{ color: BRAND }}
                      transition="color 0.12s"
                    >
                      ← Back to import
                    </Box>
                    <Button
                      onClick={handleMaterialize}
                      bg={BRAND}
                      color="white"
                      _hover={{ opacity: 0.88 }}
                      size="md"
                      fontWeight="600"
                      flexShrink={0}
                      loading={materializing}
                      disabled={materializing}
                    >
                      Looks good — materialize files →
                    </Button>
                  </HStack>
                )}

              </VStack>
            </Box>
          )}

        </Box>
      </Box>
    </Box>
    </>
  );
}
