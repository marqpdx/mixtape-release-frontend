// src/components/dispatch/DispatchDocumentCard.tsx

"use client";

import React from "react";
import { Box, Text, HStack, LinkBox, LinkOverlay, Avatar, AvatarGroup } from "@chakra-ui/react";
import NextLink from "next/link";
import { DispatchDocument } from "./interfaces";

interface DispatchDocumentCardProps {
  document: DispatchDocument;
  onClick?: (slug: string) => void;
}

export default function DispatchDocumentCard({ document, onClick }: DispatchDocumentCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(document.slug);
    }
  };

  // If onClick is provided, use it for WorkArea navigation
  // Otherwise, fall back to default link behavior
  if (onClick) {
    return (
      <Box
        borderWidth={1}
        borderRadius="xl"
        p={4}
        _hover={{ shadow: "md", cursor: "pointer" }}
        onClick={handleClick}
      >
        <HStack justify="space-between">
          <Box>
            <Text fontSize="lg" fontWeight="semibold">
              {document.title}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Updated {new Date(document.updated_at).toLocaleString()}
            </Text>
          </Box>
          <HStack gap="2">
            {document.collaborators?.slice(0, 3).map((member) => (
              <AvatarGroup size="sm" key={member.id}>
                <Avatar.Root>
                  {member.profile?.avatar ? (
                    <Avatar.Image
                      src={member.profile.avatar}
                      alt={member.profile?.display_name || member.username}
                    />
                  ) : (
                    <Avatar.Fallback>
                      {member.profile?.display_name
                        ? member.profile.display_name.charAt(0)
                        : member.username?.charAt(0) || "?"}
                    </Avatar.Fallback>
                  )}
                </Avatar.Root>
              </AvatarGroup>
            ))}
          </HStack>
        </HStack>
      </Box>
    );
  }

  // Default behavior with link
  return (
    <LinkBox
      borderWidth={1}
      borderRadius="xl"
      p={4}
      _hover={{ shadow: "md" }}
    >
      <HStack justify="space-between">
        <Box>
          <LinkOverlay as={NextLink} href={`/dispatch/${document.slug}`}>
            <Text fontSize="lg" fontWeight="semibold">
              {document.title}
            </Text>
          </LinkOverlay>
          <Text fontSize="sm" color="gray.500">
            Updated {new Date(document.updated_at).toLocaleString()}
          </Text>
        </Box>
        <HStack gap="2">
          {document.collaborators?.slice(0, 3).map((member) => (
            <AvatarGroup size="sm" key={member.id}>
              <Avatar.Root>
                {member.profile?.avatar ? (
                  <Avatar.Image
                    src={member.profile.avatar}
                    alt={member.profile?.display_name || member.username}
                  />
                ) : (
                  <Avatar.Fallback>
                    {member.profile?.display_name
                      ? member.profile.display_name.charAt(0)
                      : member.username?.charAt(0) || "?"}
                  </Avatar.Fallback>
                )}
              </Avatar.Root>
            </AvatarGroup>
          ))}
        </HStack>
      </HStack>
    </LinkBox>
  );
}