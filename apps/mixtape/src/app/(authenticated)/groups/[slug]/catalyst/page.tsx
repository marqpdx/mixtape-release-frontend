// apps/mixtape/src/app/(authenticated)/groups/[slug]/catalyst/page.tsx
// Dissolve shell — Catalyst surface. Input at top (declarative). Left panel constant.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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

type IntroState = "center" | "animating" | "bubble" | "confirming" | "browse";

type RegisterRow = {
  slug: string;
  displayName: string;
  canonSynonym: string;
  entryCount: number;
  sourceFile: string;
};

type RegisterMeta = {
  slug: string;
  title: string;
  canon_synonym: string;
  entry_count: number;
  status: string;
  source_file: string;
};

type ParsedFileRegister = {
  slug: string;
  display_name: string;
  entry_count: number;
  source_file: string;
  canon_synonym: string;
  notes: string;
  confidence: "high" | "medium" | "low";
  columns: string[];
};

type ParsedFile = {
  filename: string;
  file_type: string;
  registers: ParsedFileRegister[];
  skipped: string[];
  file_notes: string;
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
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);

  // Browse state
  const [registerList, setRegisterList] = useState<RegisterMeta[]>([]);
  const [registerListLoading, setRegisterListLoading] = useState(false);
  const [selectedRegSlug, setSelectedRegSlug] = useState<string | null>(null);
  const [regBody, setRegBody] = useState<string>("");
  const [regMeta, setRegMeta] = useState<RegisterMeta | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canonizing, setCanonizing] = useState(false);
  const [saveResult, setSaveResult] = useState<string | null>(null);

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSynonym, setSettingsSynonym] = useState("");
  const [settingsDisplayName, setSettingsDisplayName] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsResult, setSettingsResult] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── TipTap editor ────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "cat-tiptap-body",
      },
    },
  });

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
  const navBg           = useColorModeValue("#f0f2f5", "#161d2a");
  const navBorder       = useColorModeValue("#e2e8f0", "#1e2533");
  const navItemHover    = useColorModeValue("#e4e9f5", "#1e2a40");
  const navItemActive   = useColorModeValue("#dde6ff", "#1a2a50");
  const navActiveText   = useColorModeValue("#1e3a8a", "#93c5fd");
  const toolbarBg       = useColorModeValue("white", "#1a202c");
  const toolbarBorder   = useColorModeValue("#e2e8f0", "#2d3748");
  const canonBadgeBg    = useColorModeValue("#f0fdf4", "#0f2318");
  const canonBadgeText  = useColorModeValue("#166534", "#4ade80");
  const preCanonBg      = useColorModeValue("#fefce8", "#1a1600");
  const preCanonText    = useColorModeValue("#854d0e", "#facc15");

  useEffect(() => {
    axiosInstance
      .get(`/api/public/groups/${slug}`)
      .then((res) => setGroup(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadRegisterList = useCallback(() => {
    setRegisterListLoading(true);
    axiosInstance
      .get(`/api/catalyst/groups/${slug}/registers/`)
      .then((res) => setRegisterList(res.data))
      .catch(() => setRegisterList([]))
      .finally(() => setRegisterListLoading(false));
  }, [slug]);

  const loadRegister = useCallback((regSlug: string) => {
    setRegLoading(true);
    setSaveResult(null);
    axiosInstance
      .get(`/api/catalyst/groups/${slug}/registers/${regSlug}/`)
      .then((res) => {
        setRegBody(res.data.body_markdown ?? "");
        const meta: RegisterMeta = {
          slug: regSlug,
          title: res.data.frontmatter?.id ?? regSlug,
          canon_synonym: res.data.canon_synonym ?? "",
          entry_count: res.data.entry_count ?? 0,
          status: res.data.status ?? "pre-canon",
          source_file: res.data.frontmatter?.source_file ?? "",
        };
        setRegMeta(meta);
        setSettingsSynonym(meta.canon_synonym);
        setSettingsDisplayName(res.data.frontmatter?.display_name ?? meta.title);
        setSettingsOpen(false);
        setSettingsResult(null);
        editor?.commands.setContent(mdToHtml(res.data.body_markdown ?? ""));
      })
      .finally(() => setRegLoading(false));
  }, [slug, editor]);

  useEffect(() => {
    if (introState === "browse") {
      loadRegisterList();
    }
  }, [introState, loadRegisterList]);

  useEffect(() => {
    if (selectedRegSlug) {
      loadRegister(selectedRegSlug);
    }
  }, [selectedRegSlug, loadRegister]);

  function handleImport() {
    setIntroState("animating");
    setTimeout(() => setIntroState("bubble"), 480);
  }

  function handleRestoreIntro() {
    setIntroState("center");
  }

  function handleGoToBrowse() {
    setIntroState("browse");
    setSelectedRegSlug(null);
    setRegMeta(null);
    setRegBody("");
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

  async function handleSave() {
    if (!selectedRegSlug || !editor) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const body = htmlToMd(editor.getHTML());
      await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`,
        { body_markdown: body },
      );
      setSaveResult("Saved");
      setRegBody(body);
    } catch {
      setSaveResult("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings() {
    if (!selectedRegSlug) return;
    setSettingsSaving(true);
    setSettingsResult(null);
    try {
      const res = await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`,
        { canon_synonym: settingsSynonym, display_name: settingsDisplayName },
      );
      setRegMeta((prev) =>
        prev ? { ...prev, canon_synonym: res.data.canon_synonym ?? settingsSynonym } : prev
      );
      setRegisterList((prev) =>
        prev.map((r) =>
          r.slug === selectedRegSlug ? { ...r, canon_synonym: res.data.canon_synonym ?? settingsSynonym } : r
        )
      );
      setSettingsResult("Saved");
    } catch {
      setSettingsResult("Save failed");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleDecanonize() {
    if (!selectedRegSlug) return;
    setCanonizing(true);
    setSaveResult(null);
    try {
      await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`,
        { decanonize: true },
      );
      setRegMeta((prev) => prev ? { ...prev, status: "pre-canon" } : prev);
      setRegisterList((prev) =>
        prev.map((r) => r.slug === selectedRegSlug ? { ...r, status: "pre-canon" } : r)
      );
      setSaveResult("Reverted to draft");
    } catch {
      setSaveResult("Revert failed");
    } finally {
      setCanonizing(false);
    }
  }

  async function handleCanonize() {
    if (!selectedRegSlug || !editor) return;
    setCanonizing(true);
    setSaveResult(null);
    try {
      const body = htmlToMd(editor.getHTML());
      await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`,
        { body_markdown: body, canonize: true },
      );
      setSaveResult("Canonized");
      setRegMeta((prev) => prev ? { ...prev, status: "canon" } : prev);
      setRegisterList((prev) =>
        prev.map((r) => r.slug === selectedRegSlug ? { ...r, status: "canon" } : r)
      );
    } catch {
      setSaveResult("Canonize failed");
    } finally {
      setCanonizing(false);
    }
  }

  async function handleParse() {
    if (!selectedFiles.length) return;
    setParsing(true);
    setParseError(null);
    try {
      const form = new FormData();
      selectedFiles.forEach((f) => form.append("files", f));
      const res = await axiosInstance.post(
        `/api/catalyst/groups/${slug}/parse-files/`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const data = res.data as {
        files: ParsedFile[];
        merged_registers: ParsedFileRegister[];
        files_processed: number;
        errors: { file: string; error: string }[];
      };

      setParsedFiles(data.files ?? []);

      const merged = data.merged_registers ?? [];
      if (merged.length) {
        setRegisters(merged.map((r) => ({
          slug: r.slug,
          displayName: r.display_name,
          canonSynonym: r.canon_synonym || "Canon",
          entryCount: r.entry_count,
          sourceFile: r.source_file,
        })));
      }
      setIntroState("confirming");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Parse failed — check file types and try again.";
      setParseError(msg);
    } finally {
      setParsing(false);
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
  const showRegNav = introState === "browse";

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
      .cat-tiptap-body {
        outline: none;
        font-size: 14px;
        line-height: 1.7;
        min-height: 320px;
      }
      .cat-tiptap-body h1 { font-size: 1.4em; font-weight: 700; margin: 1em 0 0.4em; }
      .cat-tiptap-body h2 { font-size: 1.15em; font-weight: 600; margin: 0.9em 0 0.35em; }
      .cat-tiptap-body p  { margin: 0 0 0.6em; }
      .cat-tiptap-body strong { font-weight: 600; }
      .cat-tiptap-body em { font-style: italic; }
      .cat-tiptap-body code { font-family: monospace; background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px; font-size: 0.88em; }
      .cat-tiptap-body ul, .cat-tiptap-body ol { padding-left: 1.4em; margin: 0 0 0.6em; }
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

        {showRegNav && (
          <Box
            as="button"
            onClick={() => setIntroState("center")}
            w="34px"
            h="34px"
            borderRadius="full"
            bg="rgba(255,255,255,0.10)"
            border="1px solid rgba(255,255,255,0.18)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            title="Back to landing"
            _hover={{ bg: "rgba(255,255,255,0.18)" }}
            transition="background 0.15s"
          >
            <Text fontSize="13px" lineHeight="1">🏠</Text>
          </Box>
        )}
      </Box>

      {/* ── REGISTER NAV PANEL — visible in browse state ─────────────────── */}
      {showRegNav && (
        <Box
          className="cat-reg-nav"
          width="210px"
          flexShrink={0}
          bg={navBg}
          borderRight="1px solid"
          borderColor={navBorder}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Box px={3} py={3} borderBottom="1px solid" borderColor={navBorder}>
            <Text
              fontSize="9px"
              fontWeight="700"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color={mutedText}
            >
              Register of Registers
            </Text>
            <Text fontSize="xs" color={mutedText} mt={1} lineHeight="1.4">
              {group?.title}
            </Text>
          </Box>

          <Box flex="1" overflowY="auto" py={1}>
            {registerListLoading ? (
              <Box px={3} py={4}>
                <Spinner size="xs" color="blue.400" />
              </Box>
            ) : registerList.length === 0 ? (
              <Box px={3} py={4}>
                <Text fontSize="xs" color={mutedText}>
                  No registers yet. Import files to create them.
                </Text>
              </Box>
            ) : (
              registerList.map((reg) => (
                <Box
                  key={reg.slug}
                  className="cat-reg-nav-item"
                  as="button"
                  w="full"
                  textAlign="left"
                  px={3}
                  py="9px"
                  bg={selectedRegSlug === reg.slug ? navItemActive : "transparent"}
                  _hover={{ bg: selectedRegSlug === reg.slug ? navItemActive : navItemHover }}
                  transition="background 0.1s"
                  onClick={() => setSelectedRegSlug(reg.slug)}
                  borderLeft="3px solid"
                  borderColor={selectedRegSlug === reg.slug ? navActiveText : "transparent"}
                >
                  <Text
                    fontSize="12px"
                    fontWeight={selectedRegSlug === reg.slug ? "600" : "400"}
                    color={selectedRegSlug === reg.slug ? navActiveText : chipText}
                    lineHeight="1.3"
                    mb="2px"
                  >
                    {reg.title || reg.slug}
                  </Text>
                  <HStack gap={1.5}>
                    <Text fontSize="10px" color={synonymLabel}>
                      {reg.entry_count} entries
                    </Text>
                    <Box
                      px="5px"
                      py="1px"
                      borderRadius="full"
                      bg={reg.status === "canon" ? canonBadgeBg : preCanonBg}
                    >
                      <Text
                        fontSize="9px"
                        fontWeight="600"
                        color={reg.status === "canon" ? canonBadgeText : preCanonText}
                      >
                        {reg.status === "canon" ? "canon" : "draft"}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))
            )}
          </Box>

          <Box px={3} py={3} borderTop="1px solid" borderColor={navBorder}>
            <Box
              as="button"
              onClick={() => {
                setIntroState("bubble");
                setSelectedRegSlug(null);
              }}
              fontSize="11px"
              color={mutedText}
              _hover={{ color: BRAND }}
              transition="color 0.12s"
              cursor="pointer"
            >
              + Import more files
            </Box>
          </Box>
        </Box>
      )}

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
                    <HStack gap={3} flexWrap="wrap">
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
                      <Button
                        onClick={handleGoToBrowse}
                        variant="outline"
                        size="sm"
                        fontWeight="600"
                      >
                        View Register of Registers →
                      </Button>
                    </HStack>
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

                {parseError && (
                  <Box px={3} py={2} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                    <Text fontSize="xs" color="red.700">{parseError}</Text>
                  </Box>
                )}

                {selectedFiles.length > 0 && (
                  <Button
                    bg={BRAND}
                    color="white"
                    _hover={{ opacity: 0.88 }}
                    size="md"
                    w="full"
                    fontWeight="600"
                    onClick={handleParse}
                    loading={parsing}
                    disabled={parsing}
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
                  Skip to Stage 4 → (dev shortcut — uses fixture data)
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
              <VStack align="stretch" gap={8}>

                {/* Bridge narrative header */}
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
                  <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={2}>
                    Your files have been read
                  </Heading>
                  <Text fontSize="sm" color={mutedText} lineHeight="1.7">
                    Before anything is written to your Codex, here&apos;s what we found —
                    by file, so you can see exactly where each register comes from.
                    Your original files are always kept. These registers are inferred shapes,
                    not authoritative until you say so.
                  </Text>
                  {/* Summary chips */}
                  <HStack mt={3} gap={2} flexWrap="wrap">
                    <Box px={2} py="2px" bg={chipBg} border="1px solid" borderColor={chipBorder} borderRadius="full">
                      <Text fontSize="10px" fontWeight="600" color={chipText}>
                        {registers.length} register{registers.length !== 1 ? "s" : ""} proposed
                      </Text>
                    </Box>
                    {parsedFiles.length > 0 && (
                      <Box px={2} py="2px" bg={chipBg} border="1px solid" borderColor={chipBorder} borderRadius="full">
                        <Text fontSize="10px" fontWeight="600" color={chipText}>
                          {parsedFiles.length} file{parsedFiles.length !== 1 ? "s" : ""} scanned
                        </Text>
                      </Box>
                    )}
                    {parsedFiles.reduce((s, f) => s + f.skipped.length, 0) > 0 && (
                      <Box px={2} py="2px" bg={preCanonBg} border="1px solid" borderColor={chipBorder} borderRadius="full">
                        <Text fontSize="10px" fontWeight="600" color={preCanonText}>
                          {parsedFiles.reduce((s, f) => s + f.skipped.length, 0)} noise sheets skipped
                        </Text>
                      </Box>
                    )}
                  </HStack>
                </Box>

                {/* Per-file breakdown */}
                {parsedFiles.length > 0 && (
                  <Box>
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color={mutedText}
                      mb={3}
                    >
                      What each file contributed
                    </Text>
                    <VStack align="stretch" gap={3}>
                      {parsedFiles.map((pf) => (
                        <Box
                          key={pf.filename}
                          bg={cardBg}
                          border="1px solid"
                          borderColor={cardBorder}
                          borderRadius="lg"
                          overflow="hidden"
                        >
                          {/* File header */}
                          <HStack px={4} py={3} borderBottom="1px solid" borderColor={cardBorder} gap={3}>
                            <Text fontSize="lg" flexShrink={0}>
                              {pf.file_type === "pdf" ? "📑" : pf.file_type === "docx" ? "📝" : "📊"}
                            </Text>
                            <Box flex="1" minW={0}>
                              <Text fontSize="sm" fontWeight="600" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                {pf.filename}
                              </Text>
                              <Text fontSize="10px" color={mutedText}>
                                {pf.registers.length} register{pf.registers.length !== 1 ? "s" : ""} found
                                {pf.skipped.length > 0 ? ` · ${pf.skipped.length} skipped` : ""}
                                {pf.file_notes ? ` · ${pf.file_notes}` : ""}
                              </Text>
                            </Box>
                            <Box
                              px="6px"
                              py="1px"
                              bg={chipBg}
                              borderRadius="md"
                              flexShrink={0}
                            >
                              <Text fontSize="9px" fontWeight="700" color={mutedText} fontFamily="mono">
                                {pf.file_type}
                              </Text>
                            </Box>
                          </HStack>

                          {/* Register rows */}
                          <VStack align="stretch" px={4} py={3} gap={3}>
                            {pf.registers.map((r) => (
                              <HStack key={r.slug} align="start" gap={3}>
                                {/* Confidence dot */}
                                <Box
                                  w="7px"
                                  h="7px"
                                  borderRadius="full"
                                  flexShrink={0}
                                  mt="6px"
                                  bg={
                                    r.confidence === "high" ? "green.400"
                                    : r.confidence === "medium" ? "yellow.400"
                                    : "gray.400"
                                  }
                                  title={`${r.confidence} confidence`}
                                />
                                <Box flex="1">
                                  <HStack gap={2} align="baseline">
                                    <Text fontSize="sm" fontWeight="500">{r.display_name}</Text>
                                    <Text fontSize="10px" color={mutedText}>{r.entry_count} entries</Text>
                                  </HStack>
                                  {r.columns.length > 0 && (
                                    <Text fontSize="10px" color={synonymLabel} mt="2px" lineHeight="1.5">
                                      columns: {r.columns.join(", ")}
                                    </Text>
                                  )}
                                  {r.notes && r.notes !== `columns: ${r.columns.join(", ")}` && (
                                    <Text fontSize="10px" color={synonymLabel} mt="1px" lineHeight="1.5">
                                      {r.notes}
                                    </Text>
                                  )}
                                </Box>
                                <Box
                                  px="6px"
                                  py="1px"
                                  borderRadius="full"
                                  flexShrink={0}
                                  bg={
                                    r.confidence === "high" ? statusBg
                                    : r.confidence === "medium" ? preCanonBg
                                    : chipBg
                                  }
                                >
                                  <Text
                                    fontSize="9px"
                                    fontWeight="700"
                                    color={
                                      r.confidence === "high" ? statusText
                                      : r.confidence === "medium" ? preCanonText
                                      : mutedText
                                    }
                                  >
                                    {r.confidence}
                                  </Text>
                                </Box>
                              </HStack>
                            ))}

                            {/* Skipped sheets */}
                            {pf.skipped.length > 0 && (
                              <Text fontSize="10px" color={synonymLabel} fontStyle="italic" pt={1} borderTop="1px dashed" borderColor={cardBorder}>
                                Skipped: {pf.skipped.join(" · ")}
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Registers to create — editable flat list */}
                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color={mutedText}
                    mb={1}
                  >
                    Registers to create
                  </Text>
                  <Text fontSize="xs" color={mutedText} mb={3} lineHeight="1.6">
                    Edit names or synonyms, remove any you don&apos;t want.
                    Nothing is written until you confirm below.
                  </Text>
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
                              <Box px={2} py="1px" bg={badgeBg} borderRadius="full" flexShrink={0}>
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
                </Box>

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
                          onClick={handleGoToBrowse}
                        >
                          View Register of Registers →
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
                            setParsedFiles([]);
                            setIntroState("bubble");
                            setSelectedFiles([]);
                          }}
                        >
                          Import more files
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ) : (
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
                      Looks right — write {registers.length} register{registers.length !== 1 ? "s" : ""} to Codex →
                    </Button>
                  </HStack>
                )}

              </VStack>
            </Box>
          )}

          {/* ── STAGE 7 — BROWSE / REGISTER EDITOR ── */}
          {introState === "browse" && (
            <Box
              className="cat-browse-surface"
              display="flex"
              flexDirection="column"
              height="100%"
            >
              {/* No register selected — placeholder */}
              {!selectedRegSlug && (
                <Box
                  flex="1"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  p={8}
                >
                  <VStack gap={3} textAlign="center">
                    <Text fontSize="2xl">◈</Text>
                    <Text fontWeight="600" fontSize="sm">Select a register</Text>
                    <Text fontSize="xs" color={mutedText} maxW="260px" lineHeight="1.6">
                      Choose a register from the panel on the left to view and edit its content.
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* Register selected — TipTap editor */}
              {selectedRegSlug && (
                <Box className="cat-editor-area" display="flex" flexDirection="column" height="100%">

                  {/* Editor toolbar */}
                  <Box
                    className="cat-editor-toolbar"
                    bg={toolbarBg}
                    borderBottom="1px solid"
                    borderColor={toolbarBorder}
                    px={4}
                    py="6px"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    flexShrink={0}
                  >
                    {/* Format buttons */}
                    {[
                      { label: "B", title: "Bold", action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
                      { label: "I", title: "Italic", action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
                      { label: "H1", title: "Heading 1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }) },
                      { label: "H2", title: "Heading 2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
                    ].map(({ label, title, action, active }) => (
                      <Box
                        key={label}
                        as="button"
                        onClick={action}
                        title={title}
                        px="8px"
                        py="2px"
                        borderRadius="4px"
                        bg={active ? chipBorder : "transparent"}
                        border="1px solid"
                        borderColor={active ? BRAND : chipBorder}
                        fontSize="11px"
                        fontWeight="700"
                        color={active ? BRAND : chipText}
                        cursor="pointer"
                        _hover={{ borderColor: BRAND, color: BRAND }}
                        transition="all 0.1s"
                        fontFamily="mono"
                      >
                        {label}
                      </Box>
                    ))}

                    <Box flex="1" />

                    {/* Status badge */}
                    {regMeta && (
                      <Box
                        px={2}
                        py="2px"
                        borderRadius="full"
                        bg={regMeta.status === "canon" ? canonBadgeBg : preCanonBg}
                      >
                        <Text
                          fontSize="10px"
                          fontWeight="600"
                          color={regMeta.status === "canon" ? canonBadgeText : preCanonText}
                        >
                          {regMeta.status === "canon" ? "✓ canon" : "draft"}
                        </Text>
                      </Box>
                    )}

                    {/* Save result feedback */}
                    {saveResult && (
                      <Text fontSize="11px" color={saveResult.includes("fail") ? "red.500" : statusText}>
                        {saveResult}
                      </Text>
                    )}

                    {/* Settings toggle */}
                    <Box
                      as="button"
                      onClick={() => { setSettingsOpen((o) => !o); setSettingsResult(null); }}
                      px="8px"
                      py="2px"
                      borderRadius="4px"
                      bg={settingsOpen ? chipBorder : "transparent"}
                      border="1px solid"
                      borderColor={settingsOpen ? BRAND : chipBorder}
                      fontSize="11px"
                      fontWeight="600"
                      color={settingsOpen ? BRAND : chipText}
                      cursor="pointer"
                      _hover={{ borderColor: BRAND, color: BRAND }}
                      transition="all 0.1s"
                      title="Register settings"
                    >
                      ⚙ Settings
                    </Box>

                    {/* Save button */}
                    <Button
                      onClick={handleSave}
                      size="xs"
                      bg={chipBg}
                      border="1px solid"
                      borderColor={chipBorder}
                      color={chipText}
                      fontWeight="600"
                      _hover={{ borderColor: BRAND }}
                      loading={saving}
                      disabled={saving || canonizing || settingsSaving}
                    >
                      Save
                    </Button>

                    {/* Canonize / Revert button */}
                    {regMeta?.status !== "canon" ? (
                      <Button
                        onClick={handleCanonize}
                        size="xs"
                        bg={BRAND}
                        color="white"
                        fontWeight="600"
                        _hover={{ opacity: 0.88 }}
                        loading={canonizing}
                        disabled={saving || canonizing || settingsSaving}
                      >
                        Canonize →
                      </Button>
                    ) : (
                      <Button
                        onClick={handleDecanonize}
                        size="xs"
                        variant="outline"
                        fontWeight="600"
                        loading={canonizing}
                        disabled={saving || canonizing || settingsSaving}
                      >
                        Revert to draft
                      </Button>
                    )}
                  </Box>

                  {/* Settings panel */}
                  {settingsOpen && regMeta && (
                    <Box
                      className="cat-settings-panel"
                      bg={startHereBg}
                      borderBottom="1px solid"
                      borderColor={startHereBorder}
                      px={6}
                      py={5}
                      flexShrink={0}
                    >
                      <Text
                        fontSize="9px"
                        fontWeight="700"
                        letterSpacing="0.12em"
                        textTransform="uppercase"
                        color={mutedText}
                        mb={4}
                      >
                        Register Settings
                      </Text>

                      <VStack align="stretch" gap={4} maxW="480px">
                        {/* Display name */}
                        <Box>
                          <Text fontSize="11px" fontWeight="600" color={mutedText} mb={1}>
                            Display name
                          </Text>
                          <Input
                            value={settingsDisplayName}
                            onChange={(e) => setSettingsDisplayName(e.target.value)}
                            size="sm"
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="md"
                            fontSize="sm"
                            _focus={{ borderColor: BRAND, boxShadow: "none" }}
                          />
                        </Box>

                        {/* Canon synonym */}
                        <Box>
                          <Text fontSize="11px" fontWeight="600" color={mutedText} mb={1}>
                            Canon synonym
                          </Text>
                          <Text fontSize="10px" color={synonymLabel} mb={2} lineHeight="1.5">
                            The label used for a confirmed, authoritative entry in this register.
                            Used in Beryl prompts and export headers.
                          </Text>
                          <Input
                            value={settingsSynonym}
                            onChange={(e) => setSettingsSynonym(e.target.value)}
                            placeholder="e.g. Final Menu, Live, Confirmed"
                            size="sm"
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="md"
                            fontSize="sm"
                            _focus={{ borderColor: BRAND, boxShadow: "none" }}
                          />
                        </Box>

                        {/* Provenance read-only */}
                        <Box>
                          <Text fontSize="11px" fontWeight="600" color={mutedText} mb={2}>
                            Provenance
                          </Text>
                          <VStack align="stretch" gap={1}>
                            {[
                              { label: "Source file", value: regMeta.source_file || "—" },
                              { label: "Entry count", value: String(regMeta.entry_count) },
                              { label: "Status", value: regMeta.status },
                            ].map(({ label, value }) => (
                              <HStack key={label} gap={2}>
                                <Text fontSize="10px" color={synonymLabel} w="80px" flexShrink={0}>{label}</Text>
                                <Text fontSize="10px" fontFamily="mono" color={chipText}>{value}</Text>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>

                        {/* Save settings */}
                        <HStack gap={3}>
                          <Button
                            onClick={handleSaveSettings}
                            size="sm"
                            bg={BRAND}
                            color="white"
                            fontWeight="600"
                            _hover={{ opacity: 0.88 }}
                            loading={settingsSaving}
                            disabled={settingsSaving}
                          >
                            Save settings
                          </Button>
                          {settingsResult && (
                            <Text
                              fontSize="11px"
                              color={settingsResult.includes("fail") ? "red.500" : statusText}
                            >
                              {settingsResult}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </Box>
                  )}

                  {/* Register meta header */}
                  {regMeta && !regLoading && (
                    <Box
                      px={6}
                      py={4}
                      borderBottom="1px solid"
                      borderColor={cardBorder}
                      bg={cardBg}
                      flexShrink={0}
                    >
                      <HStack gap={3} align="baseline">
                        <Heading as="h2" fontSize="lg" fontWeight="700" letterSpacing="-0.02em">
                          {regMeta.title || regMeta.slug}
                        </Heading>
                        <Text fontSize="xs" color={mutedText}>
                          {regMeta.entry_count} entries · synonym: <em>{regMeta.canon_synonym || "—"}</em>
                        </Text>
                      </HStack>
                      {regMeta.source_file && (
                        <Text fontSize="10px" fontFamily="mono" color={synonymLabel} mt={1}>
                          {regMeta.source_file}
                        </Text>
                      )}
                    </Box>
                  )}

                  {/* TipTap body */}
                  {regLoading ? (
                    <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                      <Spinner size="md" color="blue.400" />
                    </Box>
                  ) : (
                    <Box
                      className="cat-tiptap-wrapper"
                      flex="1"
                      overflow="auto"
                      px={6}
                      py={5}
                      bg={centerBg}
                    >
                      <Box maxW="680px">
                        <EditorContent editor={editor} />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

        </Box>
      </Box>
    </Box>
    </>
  );
}

// ── Minimal md ↔ HTML round-trip (no external dep) ───────────────────────────

function mdToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .split("\n\n")
    .map((block) =>
      block.startsWith("<h") || block.startsWith("<ul") || block.startsWith("<ol")
        ? block
        : `<p>${block.replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");
}

function htmlToMd(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
