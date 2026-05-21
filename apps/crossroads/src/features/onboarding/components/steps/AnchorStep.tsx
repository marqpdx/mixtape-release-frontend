"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Field,
  Heading,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

const MAX_CHARS = 280;

interface AnchorStepProps {
  username: string;
  initialQuickIntro: string;
  onNext: () => void;
  onSkip: () => void;
}

export function AnchorStep({
  username,
  initialQuickIntro,
  onNext,
  onSkip,
}: AnchorStepProps) {
  const [quickIntro, setQuickIntro] = useState(initialQuickIntro);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_CHARS - quickIntro.length;

  async function handleContinue() {
    setError(null);
    setSaving(true);
    try {
      await axiosInstance.patch(`/api/members/${username}`, { quick_intro: quickIntro });
      onNext();
    } catch {
      setError("Could not save — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <VStack gap={6} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="2xl" fontWeight="semibold">
          A little about you
        </Heading>
        <Text fontSize="sm" color="gray.500">
          How people in this group will know you. You can always update this later.
        </Text>
      </VStack>

      {error && (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      )}

      <Field.Root>
        <Field.Label>Quick intro</Field.Label>
        <Textarea
          value={quickIntro}
          onChange={(e) => setQuickIntro(e.target.value)}
          placeholder="What brings you here? What are you working on?"
          rows={3}
          maxLength={MAX_CHARS}
          resize="none"
        />
        <Field.HelperText>
          <Box display="flex" justifyContent="space-between">
            <Text>Just a sentence or two is perfect.</Text>
            <Text color={remaining <= 20 ? "red.500" : remaining <= 60 ? "orange.400" : "gray.400"}>
              {remaining} left
            </Text>
          </Box>
        </Field.HelperText>
      </Field.Root>

      <VStack gap={2} align="stretch">
        <Button
          bg="green.500"
          color="white"
          onClick={handleContinue}
          loading={saving}
          loadingText="Saving..."
          _hover={{ bg: "green.600" }}
        >
          Save and enter group →
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip} color="gray.500">
          Skip for now — you can fill this in later
        </Button>
      </VStack>
    </VStack>
  );
}
