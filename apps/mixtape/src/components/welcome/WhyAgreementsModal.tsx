// apps/mixtape/src/components/welcome/WhyAgreementsModal.tsx

"use client";

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogCloseTrigger,
} from "@/components/ui/dialog";

interface WhyAgreementsModalProps {
  open: boolean;
  onClose: () => void;
}

export function WhyAgreementsModal({ open, onClose }: WhyAgreementsModalProps) {
  return (
    <DialogRoot open={open} onOpenChange={({ open: next }) => { if (!next) onClose(); }}>
      <DialogContent
        maxW="lg"
        bg="theme.surface"
        borderRadius="xl"
        border="1px solid"
        borderColor="theme.border"
        p={0}
      >
        <DialogHeader px={6} pt={5} pb={3}>
          <DialogTitle>Why these agreements?</DialogTitle>
          <DialogCloseTrigger onClick={onClose} />
        </DialogHeader>

        <DialogBody px={6} pb={6}>
          <VStack align="start" gap={4}>
            <Text color="theme.textSecondary" lineHeight="1.8">
              Crossroads is an intentional community platform. We believe that healthy spaces require shared commitments — not rules handed down from on high, but agreements we make together about how we want to show up.
            </Text>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Respect &amp; Care
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Technology tends to strip away humanity. We choose the opposite: every person on this platform is a full human being whose dignity and experience matter.
              </Text>
            </Box>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Consent &amp; Privacy
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                Crossroads is not a surveillance product. We ask members to honor one another's boundaries because trust is what makes real connection possible.
              </Text>
            </Box>

            <Box>
              <Heading as="h4" size="sm" color="theme.text" mb={1}>
                Place &amp; Belonging
              </Heading>
              <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
                We are not interested in a frictionless, placeless internet. Rooting ourselves in real places, cultures, and living systems is what gives this work meaning.
              </Text>
            </Box>

            <Text color="theme.textSecondary" fontSize="sm" lineHeight="1.8">
              These aren&apos;t terms of service — they&apos;re a shared foundation. We ask everyone who joins to read them and mean it.
            </Text>

            <Button variant="outline" size="sm" onClick={onClose} alignSelf="flex-end">
              Got it
            </Button>
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
