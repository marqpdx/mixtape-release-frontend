"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Text, Textarea, Button, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useCreateFolioInception } from "@mixtape/api/hooks/folio";

// State A — raw inception capture (prototype spec §5). No setup wizard, no
// audience selector, no taxonomy picker, no AI suggestions.
export default function FolioNewPage() {
  const [rawText, setRawText] = useState("");
  const router = useRouter();
  const { mutate: create, isPending } = useCreateFolioInception();

  const textColor = useColorModeValue("gray.700", "gray.200");

  const handleSubmit = () => {
    const trimmed = rawText.trim();
    if (!trimmed) return;
    create(
      { raw_text: rawText },
      {
        onSuccess: (inception) => {
          router.push(`/folio/inception/${inception.id}`);
        },
      },
    );
  };

  return (
    <Container className="fln-root" maxW="640px" py={16}>
      <VStack className="fln-stack" gap={6} align="stretch">
        <Text className="fln-prompt" fontSize="lg" color={textColor}>
          What are you working on?
        </Text>
        <Textarea
          className="fln-input"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="I want to write a white paper about..."
          rows={8}
          autoFocus
          resize="vertical"
        />
        <Box className="fln-actions" textAlign="right">
          <Button
            onClick={handleSubmit}
            loading={isPending}
            disabled={!rawText.trim()}
          >
            Begin
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}
