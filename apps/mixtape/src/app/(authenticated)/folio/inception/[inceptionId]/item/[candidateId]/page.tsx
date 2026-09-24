"use client";

import { use } from "react";
import Link from "next/link";
import { Container, Text, Box, Skeleton, VStack, HStack, Textarea } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useFolioInception } from "@mixtape/api/hooks/folio";

// Phase 6 — the minimal "enter b)" bridge (prototype spec §13). We do not
// yet know what the full entered-item experience should be, so this is
// deliberately small: breadcrumb back to the Folio, the selected item's
// text, and a blank fast-writing area with no automatic suggestions and no
// persistence — recursive layout, sub-node grammar, relation controls, and
// a research rail are all explicitly deferred, not decided here.
function ordinalLabel(ordinal: number | null): string {
  if (!ordinal || ordinal < 1) return "";
  return `${String.fromCharCode(96 + ordinal)})`;
}

export default function FolioMaterialItemPage({
  params,
}: {
  params: Promise<{ inceptionId: string; candidateId: string }>;
}) {
  const { inceptionId, candidateId } = use(params);
  const { data: inception, isLoading } = useFolioInception(inceptionId);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (isLoading) {
    return (
      <Container className="fmi-root" maxW="640px" py={16}>
        <Skeleton height="120px" />
      </Container>
    );
  }

  const candidate = inception?.material_candidates.find((c) => c.id === candidateId);

  if (!inception || !candidate) {
    return (
      <Container className="fmi-root" maxW="640px" py={16}>
        <Text color={mutedColor}>Item not found.</Text>
      </Container>
    );
  }

  return (
    <Container className="fmi-root" maxW="640px" py={16}>
      <VStack className="fmi-stack" gap={6} align="stretch">
        <HStack className="fmi-breadcrumb" gap={2} fontSize="sm" color={mutedColor}>
          <Link href={`/folio/inception/${inceptionId}`}>
            <Text as="span" _hover={{ textDecoration: "underline" }}>
              {inception.folio.title || "Untitled"}
            </Text>
          </Link>
          <Text as="span">&rsaquo;</Text>
          <Text as="span">{ordinalLabel(candidate.ordinal)}</Text>
        </HStack>

        <Text className="fmi-item-text" fontSize="xl" fontWeight="medium">
          {candidate.display_text}
        </Text>

        <Box className="fmi-divider" borderTopWidth="1px" borderColor={borderColor} />

        <Textarea
          className="fmi-writing-area"
          placeholder=""
          rows={16}
          resize="vertical"
          autoFocus
        />
      </VStack>
    </Container>
  );
}
