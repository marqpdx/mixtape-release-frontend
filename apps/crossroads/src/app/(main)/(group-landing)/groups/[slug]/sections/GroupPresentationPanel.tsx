"use client";

// GroupPresentationPanel — slide-in Tier 2 settings panel.
// Opened from GroupPublicAdminBar "Design" button.
// Each selection calls PATCH /api/groups/{slug}/public-config/presentation
// then router.refresh() to re-render the server component with new settings.
// Optimistic local state so the panel shows the intended value immediately.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { GroupPublicPresentation } from "../types";
import { tenantPalettes } from "../tenantPalettes";

const TEMPLATES: {
  id: string;
  label: string;
  note: string;
  deferred?: boolean;
}[] = [
  { id: "masthead", label: "Masthead", note: "Single hero column" },
  { id: "ledger", label: "Ledger", note: "Two-column with left rail" },
  {
    id: "atlas",
    label: "Atlas",
    note: "Full-bleed banner — needs a background image",
  },
  {
    id: "docket",
    label: "Docket",
    note: "Indexed table — coming soon",
    deferred: true,
  },
];

const FONTS: { id: string; label: string; category: "serif" | "display" | "sans" }[] = [
  { id: "source-serif-4", label: "Source Serif 4", category: "serif" },
  { id: "newsreader", label: "Newsreader", category: "serif" },
  { id: "literata", label: "Literata", category: "serif" },
  { id: "lora", label: "Lora", category: "serif" },
  { id: "instrument-serif", label: "Instrument Serif", category: "display" },
  { id: "public-sans", label: "Public Sans", category: "sans" },
  { id: "archivo", label: "Archivo", category: "sans" },
  { id: "work-sans", label: "Work Sans", category: "sans" },
  { id: "karla", label: "Karla", category: "sans" },
  { id: "ibm-plex-sans", label: "IBM Plex Sans", category: "sans" },
];

interface Props {
  groupSlug: string;
  initialPresentation: GroupPublicPresentation;
  onClose: () => void;
}

export function GroupPresentationPanel({
  groupSlug,
  initialPresentation,
  onClose,
}: Props) {
  const router = useRouter();
  const [current, setCurrent] =
    useState<GroupPublicPresentation>(initialPresentation);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function applyChange(patch: Partial<GroupPublicPresentation>) {
    const prev = current;
    setCurrent({ ...current, ...patch });
    setSaving(true);
    setSaveError(null);
    try {
      await axiosInstance.patch(
        `/api/groups/${groupSlug}/public-config/presentation`,
        patch
      );
      router.refresh();
    } catch {
      setCurrent(prev);
      setSaveError("Could not save. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  const activeTemplate = current.template_id ?? "masthead";
  const activePalette = current.palette_id ?? null;
  const activeFont = current.font_id ?? null;
  const activeTypo = current.typography_setting ?? "journal";

  return (
    <>
      {/* Invisible backdrop captures outside clicks */}
      <Box
        className="gpp-backdrop"
        position="fixed"
        inset={0}
        zIndex={1001}
        onClick={onClose}
      />

      {/* Panel */}
      <Box
        className="gpp-panel"
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        zIndex={1002}
        w={{ base: "100vw", sm: "340px" }}
        bg="gray.900"
        borderLeftWidth="1px"
        borderColor="gray.700"
        overflowY="auto"
        style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.5)" }}
      >
        {/* Sticky header */}
        <Flex
          className="gpp-header"
          align="center"
          justify="space-between"
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="gray.700"
          position="sticky"
          top={0}
          bg="gray.900"
          zIndex={1}
        >
          <Text fontSize="sm" fontWeight="600" color="white">
            Page design
          </Text>
          <Flex align="center" gap={3}>
            {saving && (
              <Text fontSize="xs" color="gray.500">
                Saving…
              </Text>
            )}
            <Button
              size="xs"
              variant="ghost"
              color="gray.400"
              _hover={{ color: "white", bg: "gray.700" }}
              onClick={onClose}
              aria-label="Close design panel"
            >
              ✕
            </Button>
          </Flex>
        </Flex>

        {saveError && (
          <Box px={4} pt={3}>
            <Text fontSize="xs" color="red.400">
              {saveError}
            </Text>
          </Box>
        )}

        <Flex
          className="gpp-body"
          flexDir="column"
          gap={6}
          px={4}
          pt={4}
          pb={8}
        >
          {/* ── Type style ── */}
          <Box className="gpp-section-typo">
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Type style
            </Text>
            <Flex gap={2}>
              {(["journal", "notice"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  flex={1}
                  onClick={() => applyChange({ typography_setting: t })}
                  variant={activeTypo === t ? "solid" : "outline"}
                  colorPalette={activeTypo === t ? "indigo" : undefined}
                  color={activeTypo === t ? undefined : "gray.300"}
                  borderColor={activeTypo === t ? undefined : "gray.600"}
                >
                  {t === "journal" ? "Journal" : "Notice"}
                </Button>
              ))}
            </Flex>
            <Text fontSize="xs" color="gray.600" mt={1}>
              {activeTypo === "journal"
                ? "Serif — editorial, long-form"
                : "Sans — clean, modular"}
            </Text>
          </Box>

          {/* ── Template ── */}
          <Box className="gpp-section-template">
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Template
            </Text>
            <Flex flexDir="column" gap={2}>
              {TEMPLATES.map((tmpl) => {
                const isActive = activeTemplate === tmpl.id;
                return (
                  <Box
                    key={tmpl.id}
                    className="gpp-template-option"
                    onClick={() =>
                      !tmpl.deferred && applyChange({ template_id: tmpl.id })
                    }
                    cursor={tmpl.deferred ? "default" : "pointer"}
                    px={3}
                    py={2}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={isActive ? "indigo.500" : "gray.700"}
                    bg={
                      isActive
                        ? "rgba(99,102,241,0.12)"
                        : "rgba(255,255,255,0.03)"
                    }
                    _hover={
                      !tmpl.deferred ? { borderColor: "gray.500" } : undefined
                    }
                    transition="border-color 0.15s, background 0.15s"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight={isActive ? "600" : "400"}
                      color={
                        tmpl.deferred
                          ? "gray.600"
                          : isActive
                          ? "indigo.200"
                          : "gray.200"
                      }
                    >
                      {tmpl.label}
                    </Text>
                    <Text
                      fontSize="xs"
                      color={tmpl.deferred ? "gray.700" : "gray.500"}
                      mt={0.5}
                    >
                      {tmpl.note}
                    </Text>
                  </Box>
                );
              })}
            </Flex>
          </Box>

          {/* ── Palette ── */}
          <Box className="gpp-section-palette">
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Palette
            </Text>
            <Flex flexDir="column" gap={2}>
              {tenantPalettes.map((palette) => {
                const isActive = activePalette === palette.id;
                return (
                  <Box
                    key={palette.id}
                    className="gpp-palette-option"
                    onClick={() => applyChange({ palette_id: palette.id })}
                    cursor="pointer"
                    px={3}
                    py={2}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={isActive ? "indigo.500" : "gray.700"}
                    bg={
                      isActive
                        ? "rgba(99,102,241,0.12)"
                        : "rgba(255,255,255,0.03)"
                    }
                    _hover={{ borderColor: "gray.500" }}
                    transition="border-color 0.15s, background 0.15s"
                  >
                    <Flex align="center" gap={3}>
                      {/* Color swatches: bg, accent, text */}
                      <Flex gap={1} flexShrink={0}>
                        <Box
                          w="14px"
                          h="14px"
                          borderRadius="2px"
                          style={{
                            background: palette.light.bg,
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}
                        />
                        <Box
                          w="14px"
                          h="14px"
                          borderRadius="2px"
                          style={{ background: palette.light.accent }}
                        />
                        <Box
                          w="14px"
                          h="14px"
                          borderRadius="2px"
                          style={{ background: palette.light.text }}
                        />
                      </Flex>
                      <Text
                        fontSize="sm"
                        fontWeight={isActive ? "600" : "400"}
                        color={isActive ? "indigo.200" : "gray.200"}
                      >
                        {palette.name}
                      </Text>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          </Box>

          {/* ── Font ── */}
          <Box className="gpp-section-font">
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Font
            </Text>
            <Flex flexDir="column" gap={1}>
              {FONTS.map((font) => {
                const isActive = activeFont === font.id;
                return (
                  <Flex
                    key={font.id}
                    className="gpp-font-option"
                    align="center"
                    justify="space-between"
                    onClick={() => applyChange({ font_id: font.id })}
                    cursor="pointer"
                    px={3}
                    py={2}
                    borderRadius="md"
                    bg={
                      isActive
                        ? "rgba(99,102,241,0.12)"
                        : "transparent"
                    }
                    borderWidth="1px"
                    borderColor={isActive ? "indigo.500" : "transparent"}
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                    transition="background 0.1s, border-color 0.1s"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight={isActive ? "600" : "400"}
                      color={isActive ? "indigo.200" : "gray.300"}
                    >
                      {font.label}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {font.category}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Flex>
      </Box>
    </>
  );
}
