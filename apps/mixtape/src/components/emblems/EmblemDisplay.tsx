// apps/mixtape/src/components/emblems/EmblemDisplay.tsx
"use client";
import { Box, Image, Spinner } from "@chakra-ui/react";
import { getBestEmblemUrl, type EmblemInline } from '@mixtape/core/types/emblemTypes';

export function EmblemDisplay({
  emblem,
  size = 48,
  fallbackText = "?",
  showLoading = false,
}: {
  emblem?: EmblemInline | null;   // <- accept the shared shape (nullable fields)
  size?: number;
  fallbackText?: string;
  showLoading?: boolean;
}) {
  if (!emblem) {
    return <FallbackBox size={size} text={fallbackText} />;
  }

  // Prefer server-resolved URLs; falls back to keys if needed
  const imageUrl = getBestEmblemUrl(emblem, size);

  if (imageUrl) {
    return (
      <Box
        width={`${size}px`}
        height={`${size}px`}
        maxWidth={`${size}px`}
        maxHeight={`${size}px`}
        objectFit="contain"
        rounded="md"
        display="block"
      >
        <Image
          src={imageUrl}
          alt="emblem"
          width={`${size}px`}
          height={`${size}px`}
          maxWidth={`${size}px`}
          maxHeight={`${size}px`}
          objectFit="contain"
          rounded="md"
          display="block"
        />
      </Box>
    );
  }

  // Loading placeholder while lazy-rendering happens
  if (showLoading && (emblem.seed || emblem.initials)) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={`${size}px`}
        height={`${size}px`}
        bg="gray.100"
        rounded="md"
      >
        <Spinner size="sm" />
      </Box>
    );
  }

  // Fallback to initials if present
  if (emblem.initials) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={`${size}px`}
        height={`${size}px`}
        bg={emblem.bg ?? "gray.300"}
        color={emblem.fg ?? "white"}
        fontSize={size > 64 ? "2xl" : size > 32 ? "md" : "sm"}
        fontWeight="bold"
        rounded="md"
      >
        {emblem.initials}
      </Box>
    );
  }

  return <FallbackBox size={size} text={fallbackText} />;
}

function FallbackBox({ size, text }: { size: number; text: string }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      width={`${size}px`}
      height={`${size}px`}
      bg="gray.200"
      color="gray.500"
      fontSize={size > 64 ? "2xl" : size > 32 ? "md" : "sm"}
      fontWeight="bold"
      rounded="md"
    >
      {text}
    </Box>
  );
}
