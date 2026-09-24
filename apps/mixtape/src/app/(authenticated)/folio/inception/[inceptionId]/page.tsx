"use client";

import { useEffect, useRef, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container, Text, Box, Skeleton, VStack, HStack, Button, Code, Input, IconButton } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  useFolioInception,
  useAnalyzeFolioInception,
  useUpdateFolioTitle,
  useUpdateFolioCandidateDisplayText,
  useConfirmFolioCandidate,
  useRejectFolioCandidate,
} from "@mixtape/api/hooks/folio";
import type { FolioMaterialCandidate } from "@mixtape/api/clients/folio/folioApi";

// Phase 0 only: proves raw_text was preserved verbatim before any model
// call. Phase 1 adds Gate 1 (deterministic surface parse), Phase 2 Gate 2
// (subject/intention extraction), Phase 3 Gate 3 (materiality
// classification) — all behind the debug drawer (?debug=1) per prototype
// spec §12, not shown in the primary surface.
//
// Phase 4 adds Gate 4-5 (normalization + validation) and persists proposed
// FolioMaterialCandidate rows. Phase 5 renders State B (prototype spec §5)
// from those persisted rows and adds human-curation actions (§6): edit
// title, amend intention, edit/reject a material item. Edits only ever
// touch FolioMaterialCandidate/Folio rows — raw_text stays immutable.

function ordinalLabel(ordinal: number | null): string {
  if (!ordinal || ordinal < 1) return "";
  return `${String.fromCharCode(96 + ordinal)})`;
}

function InlineEditableText({
  value,
  onSave,
  fontSize,
  fontWeight,
  isQuote,
}: {
  value: string;
  onSave: (next: string) => void;
  fontSize?: string;
  fontWeight?: string;
  isQuote?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        className="fli-inline-edit"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        autoFocus
        fontSize={fontSize}
        fontWeight={fontWeight}
        size="sm"
      />
    );
  }

  return (
    <Text
      className="fli-inline-text"
      as="span"
      fontSize={fontSize}
      fontWeight={fontWeight}
      cursor="text"
      onClick={() => setEditing(true)}
      title="Click to edit"
      _hover={{ color: mutedColor }}
    >
      {isQuote ? `“${value}”` : value}
    </Text>
  );
}

export default function FolioInceptionPage({
  params,
}: {
  params: Promise<{ inceptionId: string }>;
}) {
  const { inceptionId } = use(params);
  const { data: inception, isLoading } = useFolioInception(inceptionId);
  const { mutate: analyze, data: analyzeResult, isPending: isAnalyzing } = useAnalyzeFolioInception(inceptionId);
  const { mutate: updateTitle } = useUpdateFolioTitle(inceptionId);
  const { mutate: updateDisplayText } = useUpdateFolioCandidateDisplayText(inceptionId);
  const { mutate: confirmCandidate } = useConfirmFolioCandidate(inceptionId);
  const { mutate: rejectCandidate } = useRejectFolioCandidate(inceptionId);
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "1";
  const autoAnalyzeTriggered = useRef(false);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const debugBg = useColorModeValue("gray.50", "gray.900");

  const hasRunPipeline = Boolean(inception && inception.material_candidates.length > 0);

  useEffect(() => {
    if (!inception || debugMode || hasRunPipeline || autoAnalyzeTriggered.current) return;
    autoAnalyzeTriggered.current = true;
    analyze({ debug: false });
  }, [inception, debugMode, hasRunPipeline, analyze]);

  if (isLoading) {
    return (
      <Container className="fli-root" maxW="640px" py={16}>
        <Skeleton height="120px" />
      </Container>
    );
  }

  if (!inception) {
    return (
      <Container className="fli-root" maxW="640px" py={16}>
        <Text color={mutedColor}>Inception not found.</Text>
      </Container>
    );
  }

  const intention = inception.material_candidates.find((c) => c.candidate_type === "intention");
  const materialItems = inception.material_candidates
    .filter((c): c is FolioMaterialCandidate => c.candidate_type === "material" && c.status !== "rejected")
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));

  return (
    <Container className="fli-root" maxW="640px" py={16}>
      <VStack className="fli-stack" gap={6} align="stretch">
        {!hasRunPipeline && !debugMode && (
          <Text className="fli-shaping" fontSize="sm" color={mutedColor}>
            {isAnalyzing ? "Shaping…" : "Waiting to be shaped…"}
          </Text>
        )}

        {hasRunPipeline && (
          <VStack className="fli-interpretation" gap={4} align="stretch">
            <InlineEditableText
              value={inception.folio.title || "Untitled"}
              onSave={(next) => updateTitle({ folioId: inception.folio.id, title: next })}
              fontSize="2xl"
              fontWeight="bold"
            />

            {intention && (
              <InlineEditableText
                value={intention.display_text}
                onSave={(next) => updateDisplayText({ candidateId: intention.id, displayText: next })}
                isQuote
              />
            )}

            {materialItems.length > 0 && (
              <VStack className="fli-material-list" gap={2} align="stretch" pt={2}>
                {materialItems.map((item) => (
                  <HStack key={item.id} className="fli-material-item" gap={2}>
                    <Link href={`/folio/inception/${inceptionId}/item/${item.id}`}>
                      <Text
                        as="span"
                        color={mutedColor}
                        minW="24px"
                        _hover={{ textDecoration: "underline" }}
                        title="Enter this item"
                      >
                        {ordinalLabel(item.ordinal)}
                      </Text>
                    </Link>
                    <Box flex="1">
                      <InlineEditableText
                        value={item.display_text}
                        onSave={(next) => updateDisplayText({ candidateId: item.id, displayText: next })}
                      />
                    </Box>
                    <IconButton
                      aria-label="Reject this item"
                      size="xs"
                      variant="ghost"
                      onClick={() => rejectCandidate(item.id)}
                    >
                      <LuX />
                    </IconButton>
                  </HStack>
                ))}
              </VStack>
            )}

            <HStack className="fli-actions" pt={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => materialItems.forEach((item) => confirmCandidate(item.id))}
              >
                Looks good
              </Button>
            </HStack>
          </VStack>
        )}

        <Box
          className="fli-raw-text-drawer"
          as="details"
          borderTopWidth={hasRunPipeline ? "1px" : undefined}
          borderColor={borderColor}
          pt={hasRunPipeline ? 4 : 0}
        >
          <Box as="summary" fontSize="sm" color={mutedColor} cursor="pointer">
            View original
          </Box>
          <Box
            className="fli-raw-text"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            p={4}
            mt={2}
            whiteSpace="pre-wrap"
          >
            {inception.raw_text}
          </Box>
        </Box>

        {debugMode && (
          <Box className="fli-debug-drawer" borderTopWidth="1px" borderColor={borderColor} pt={4} mt={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => analyze({ debug: true })}
              loading={isAnalyzing}
            >
              Run Gates 1–5 (parse + extraction + materiality + validation)
            </Button>
            {analyzeResult?.debug && (
              <Box
                className="fli-debug-output"
                mt={3}
                p={3}
                bg={debugBg}
                borderRadius="md"
                overflowX="auto"
              >
                <Code
                  as="pre"
                  fontSize="xs"
                  whiteSpace="pre"
                  bg="transparent"
                >
                  {JSON.stringify(analyzeResult.debug, null, 2)}
                </Code>
              </Box>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
}
