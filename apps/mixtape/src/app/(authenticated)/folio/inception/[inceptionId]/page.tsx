"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Text, Box, Skeleton, VStack, Button, Code } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useFolioInception, useAnalyzeFolioInception } from "@mixtape/api/hooks/folio";

// Phase 0 only: proves raw_text was preserved verbatim before any model
// call. Gates 2-5 (folio-first-cut-build-plan.md checkpoint table) are not
// built yet, so this intentionally does not render a State B interpretation
// — that would misrepresent unbuilt pipeline output as a real result.
//
// Phase 1 adds Gate 1 (deterministic surface parse, no LLM) behind a debug
// drawer (?debug=1) per prototype spec §12 — not shown in the primary
// surface, which stays visually quiet per spec §5.
//
// Phase 2 adds Gate 2 (subject/intention extraction, local model via
// Inkwell) to the same debug drawer. Gates 3-5 are still not built, so
// this still does not render a State B interpretation.
export default function FolioInceptionPage({
  params,
}: {
  params: Promise<{ inceptionId: string }>;
}) {
  const { inceptionId } = use(params);
  const { data: inception, isLoading } = useFolioInception(inceptionId);
  const { mutate: analyze, data: analyzeResult, isPending: isAnalyzing } = useAnalyzeFolioInception(inceptionId);
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "1";

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const debugBg = useColorModeValue("gray.50", "gray.900");

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

  return (
    <Container className="fli-root" maxW="640px" py={16}>
      <VStack className="fli-stack" gap={4} align="stretch">
        <Text className="fli-label" fontSize="sm" color={mutedColor}>
          Preserved, verbatim
        </Text>
        <Box
          className="fli-raw-text"
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          p={4}
          whiteSpace="pre-wrap"
        >
          {inception.raw_text}
        </Box>
        <Text className="fli-note" fontSize="sm" color={mutedColor}>
          Materiality analysis (Gates 2–5) isn't wired up yet — this is Phase 0's
          proof that the raw inception is captured and kept exactly as written.
        </Text>

        {debugMode && (
          <Box className="fli-debug-drawer" borderTopWidth="1px" borderColor={borderColor} pt={4} mt={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => analyze({ debug: true })}
              loading={isAnalyzing}
            >
              Run Gates 1–2 (deterministic parse + subject/intention extraction)
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
