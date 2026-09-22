"use client";

import { use } from "react";
import { Container, Text, Box, Skeleton, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useFolioInception } from "@mixtape/api/hooks/folio";

// Phase 0 only: proves raw_text was preserved verbatim before any model
// call. Gates 1-5 (folio-first-cut-build-plan.md checkpoint table) are not
// built yet, so this intentionally does not render a State B interpretation
// — that would misrepresent unbuilt pipeline output as a real result.
export default function FolioInceptionPage({
  params,
}: {
  params: Promise<{ inceptionId: string }>;
}) {
  const { inceptionId } = use(params);
  const { data: inception, isLoading } = useFolioInception(inceptionId);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

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
          Materiality analysis (Gates 1–5) isn't wired up yet — this is Phase 0's
          proof that the raw inception is captured and kept exactly as written.
        </Text>
      </VStack>
    </Container>
  );
}
