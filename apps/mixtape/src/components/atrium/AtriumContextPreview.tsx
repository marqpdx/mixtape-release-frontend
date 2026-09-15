"use client";

import { useState } from "react";
import { Box, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { IconChevronDown, IconChevronRight, IconSparkles } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAtriumSessionContext } from "@mixtape/api/hooks/atrium";

interface AtriumContextPreviewProps {
  sessionId: string;
}

export function AtriumContextPreview({ sessionId }: AtriumContextPreviewProps) {
  const [open, setOpen] = useState(false);
  const { context, sources, isLoading } = useAtriumSessionContext(sessionId);

  const borderColor = useColorModeValue("gray.100", "gray.700");
  const bgColor = useColorModeValue("gray.50", "gray.850");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const iconColor = useColorModeValue("blue.400", "blue.300");
  const textColor = useColorModeValue("gray.700", "gray.300");
  const chipBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Box borderTopWidth="1px" borderColor={borderColor}>
      {/* Toggle row — always visible */}
      <Flex
        px={4}
        py={2}
        align="center"
        gap={2}
        cursor="pointer"
        onClick={() => setOpen((v) => !v)}
        _hover={{ bg: bgColor }}
        transition="background 0.1s"
      >
        <Box color={iconColor} flexShrink={0}>
          <IconSparkles size={13} />
        </Box>
        <Text fontSize="xs" color={labelColor} flex="1" userSelect="none">
          Clio context
          {sources.length > 0 && (
            <Text as="span" color={labelColor}>
              {" "}· {sources.join(", ")}
            </Text>
          )}
        </Text>
        {isLoading ? (
          <Spinner size="xs" color={labelColor} />
        ) : (
          <Box color={labelColor}>
            {open ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
          </Box>
        )}
      </Flex>

      {/* Expanded preview */}
      {open && context && (
        <Box px={4} pb={3} bg={bgColor}>
          <Stack gap={1}>
            {context.split("\n").map((line, i) => {
              const [label, ...rest] = line.split(": ");
              const value = rest.join(": ");
              if (!value) return null;
              return (
                <Flex key={i} gap={2} align="baseline" wrap="wrap">
                  <Box
                    as="span"
                    fontSize="xs"
                    fontWeight="medium"
                    color={labelColor}
                    bg={chipBg}
                    px={1.5}
                    py={0.5}
                    borderRadius="sm"
                    flexShrink={0}
                  >
                    {label}
                  </Box>
                  <Text fontSize="xs" color={textColor}>
                    {value}
                  </Text>
                </Flex>
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
