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

  const charCount = quickIntro.length;

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
          How people in this group will know you.
        </Text>
      </VStack>

      {error && (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      )}

      {/* Username — read-only; they just set this during invite acceptance */}
      <Field.Root>
        <Field.Label>Username</Field.Label>
        <Text
          px={3}
          py={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          fontSize="sm"
          color="gray.700"
          fontFamily="mono"
        >
          {username}
        </Text>
        <Field.HelperText>You just set this — change it any time from your profile.</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>Quick intro</Field.Label>
        <Textarea
          value={quickIntro}
          onChange={(e) => setQuickIntro(e.target.value)}
          placeholder="What brings you here? What are you working on?"
          rows={3}
          maxLength={280}
          resize="none"
        />
        <Field.HelperText>
          <Box display="flex" justifyContent="space-between">
            <Text>Just a sentence or two is perfect.</Text>
            {charCount >= 200 && (
              <Text color={charCount >= 270 ? "red.500" : "gray.500"}>
                {charCount}/280
              </Text>
            )}
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
          Continue →
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip} color="gray.500">
          Skip for now
        </Button>
      </VStack>
    </VStack>
  );
}
