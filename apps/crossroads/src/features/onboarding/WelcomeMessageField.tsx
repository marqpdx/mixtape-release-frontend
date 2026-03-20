"use client";

import { Text } from "@chakra-ui/react";

interface WelcomeMessageFieldProps {
  message: string;
  // Future: groupSlug?: string; (for fetching from API when welcome_message is on Group model)
}

export const WelcomeMessageField = ({ message }: WelcomeMessageFieldProps) => (
  <Text fontSize="md" color="gray.600" lineHeight="tall">
    {message}
  </Text>
);
