// apps/mixtape/src/components/lanternmail/NewsletterSignupCard.tsx
"use client";

import { useState } from "react";
import { Box, Button, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@components/ui/toaster";

export default function NewsletterSignupCard() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const newsletterSlug = process.env.NEXT_PUBLIC_DEFAULT_NEWSLETTER_SLUG;

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      if (!newsletterSlug) {
        toaster.create({
          title: "Newsletter list not found",
          description: "Please try again later.",
          type: "error",
          duration: 5000,
          closable: true,
        });
        return;
      }
      await axiosInstance.post("/api/lanternmail/subscribe", {
        email: email.trim(),
        list_slug: newsletterSlug,
        website: "",
      });
      toaster.create({
        title: "Invitation sent",
        description: "Check your inbox to confirm your subscription.",
        type: "success",
        duration: 5000,
        closable: true,
      });
      setEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to subscribe";
      toaster.create({
        title: "Subscription failed",
        description: message,
        type: "error",
        duration: 5000,
        closable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={4}
      bg="white"
      _dark={{ bg: "gray.900", borderColor: "gray.700" }}
    >
      <VStack align="stretch" gap={3}>
        <Text fontWeight="semibold">Crossroads Newsletter</Text>
        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
          Get updates about Crossroads and new releases.
        </Text>
        <HStack gap={2}>
          <Input
            placeholder="your@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            onClick={handleSubmit}
            disabled={!email.trim() || isSubmitting}
            loading={isSubmitting}
          >
            Subscribe
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
