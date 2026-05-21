"use client";

import { useEffect, useState } from "react";
import { Box, Dialog, HStack, Text, VStack } from "@chakra-ui/react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { GroupPreviewStep } from "./steps/GroupPreviewStep";
import { AnchorStep } from "./steps/AnchorStep";

interface TourModalProps {
  groupSlug: string;
  groupTitle: string;
  groupEmblemUrl?: string;
  username: string;
  quickIntro: string;
  isOpen: boolean;
  onComplete: (skipHighlight?: boolean) => void;
}

const TOTAL_STEPS = 3;

export function TourModal({
  groupSlug,
  groupTitle,
  groupEmblemUrl,
  username,
  quickIntro,
  isOpen,
  onComplete,
}: TourModalProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  function transition(newStep: number) {
    setVisible(false);
    setTimeout(() => {
      setStep(newStep);
      setVisible(true);
    }, 150);
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      transition(step + 1);
    } else {
      // Final step "continue" completes the tour
      onComplete(false);
    }
  }

  function skip() {
    onComplete(true);
  }

  const stepContent = (() => {
    switch (step) {
      case 0:
        return (
          <WelcomeStep
            groupSlug={groupSlug}
            groupTitle={groupTitle}
            groupEmblemUrl={groupEmblemUrl}
            onNext={next}
          />
        );
      case 1:
        return (
          <GroupPreviewStep
            groupTitle={groupTitle}
            onNext={next}
          />
        );
      case 2:
        return (
          <AnchorStep
            username={username}
            initialQuickIntro={quickIntro}
            onNext={next}
            onSkip={skip}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <Dialog.Root
      open={isOpen}
      closeOnInteractOutside={false}
      closeOnEscape={false}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="480px" borderRadius="xl" overflow="hidden">
          <Dialog.Body p={8}>
            <VStack gap={6} align="stretch">
              {/* Step dots */}
              <HStack justify="center" gap={2}>
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <Box
                    key={i}
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={i === step ? "green.500" : "gray.200"}
                    transition="background 0.2s"
                  />
                ))}
              </HStack>

              {/* Step content with fade transition */}
              <Box
                opacity={visible ? 1 : 0}
                transition="opacity 0.15s ease"
              >
                {stepContent}
              </Box>

              {/* Skip tour link — not shown on final step (has its own skip) */}
              {step < TOTAL_STEPS - 1 && (
                <Text
                  fontSize="xs"
                  color="gray.400"
                  textAlign="center"
                  cursor="pointer"
                  onClick={skip}
                  _hover={{ color: "gray.600" }}
                  userSelect="none"
                >
                  Skip tour
                </Text>
              )}
            </VStack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
