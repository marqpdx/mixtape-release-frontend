"use client";

import { useState } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { Tooltip } from "@components/ui/tooltip";
import { useColorModeValue } from "@components/ui/color-mode";
import { GroupSurfaceLeftRail } from "./GroupSurfaceLeftRail";

type GroupSurface = "reception" | "workshop" | "atrium" | "catalyst";

const SURFACE_LABELS: Record<GroupSurface, string> = {
  reception: "Reception",
  workshop: "Home Workshop",
  atrium: "Atrium",
  catalyst: "Catalyst",
};

type GroupSurfaceShellProps = {
  groupSlug: string;
  groupTitle?: string;
  currentSurface: GroupSurface;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomBar?: React.ReactNode;
};

export function GroupSurfaceShell({
  groupSlug,
  groupTitle,
  currentSurface,
  children,
  rightPanel,
  bottomBar,
}: GroupSurfaceShellProps) {
  const [dimmed, setDimmed] = useState(false);

  const bg = useColorModeValue("gray.50", "gray.950");
  const topBg = useColorModeValue("white", "gray.900");
  const topBorder = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.400", "gray.500");
  const surfaceLabel = useColorModeValue("gray.700", "gray.200");
  const dimToggleColor = useColorModeValue("gray.300", "gray.600");
  const dimToggleActiveColor = useColorModeValue("indigo.400", "indigo.500");

  return (
    <Box className="gss-root" display="flex" flexDirection="column" minH="calc(100vh - 56px)" bg={bg}>
      {/* Top bar — reduced height + opacity when dimmed */}
      <Box
        className="gss-top"
        as="header"
        h={dimmed ? "28px" : "44px"}
        opacity={dimmed ? 0.4 : 1}
        bg={topBg}
        borderBottom="1px solid"
        borderColor={topBorder}
        px={4}
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        transition="height 0.2s ease, opacity 0.2s ease"
        _hover={dimmed ? { opacity: 0.85 } : undefined}
      >
        <HStack className="gss-top-breadcrumb" gap={2} fontSize="sm">
          {groupTitle && (
            <>
              <Text color={mutedText} fontWeight="400">{groupTitle}</Text>
              <Text color={mutedText}>/</Text>
            </>
          )}
          <Text color={surfaceLabel} fontWeight="500">
            {SURFACE_LABELS[currentSurface]}
          </Text>
        </HStack>

        {/* Dim toggle */}
        <Tooltip content={dimmed ? "Restore outer rim" : "Dim outer rim"} positioning={{ placement: "left" }} openDelay={400}>
          <Box
            className="gss-dim-toggle"
            as="button"
            onClick={() => setDimmed((d) => !d)}
            display="flex"
            alignItems="center"
            px={1}
            py={1}
            borderRadius="sm"
            color={dimmed ? dimToggleActiveColor : dimToggleColor}
            _hover={{ color: dimmed ? dimToggleActiveColor : mutedText }}
            transition="color 0.15s"
            aria-label={dimmed ? "Restore outer rim" : "Dim outer rim"}
            aria-pressed={dimmed}
          >
            <Text fontSize="xs" lineHeight="1" userSelect="none">
              {dimmed ? "◉" : "◎"}
            </Text>
          </Box>
        </Tooltip>
      </Box>

      {/* Body: left rail + main + right */}
      <Box className="gss-body" display="flex" flex="1" overflow="hidden">
        {/* Left rail — icon-only + reduced opacity when dimmed */}
        <Box
          className="gss-left-wrap"
          opacity={dimmed ? 0.3 : 1}
          transition="opacity 0.2s ease, width 0.2s ease"
          _hover={dimmed ? { opacity: 0.75 } : undefined}
          flexShrink={0}
        >
          <GroupSurfaceLeftRail groupSlug={groupSlug} dimmed={dimmed} />
        </Box>

        {/* Main content */}
        <Box className="gss-main" flex="1" overflowY="auto" display="flex" flexDirection="column">
          {children}
        </Box>

        {/* Right panel — surface-specific context */}
        {rightPanel && (
          <Box
            className="gss-right"
            w={{ base: "0", lg: "240px" }}
            display={{ base: "none", lg: "block" }}
            borderLeft="1px solid"
            borderColor={topBorder}
            overflowY="auto"
            bg={topBg}
            flexShrink={0}
            opacity={dimmed ? 0.3 : 1}
            transition="opacity 0.2s ease"
          >
            {rightPanel}
          </Box>
        )}
      </Box>

      {/* Bottom bar — surface-local controls */}
      {bottomBar && (
        <Box
          className="gss-bottom"
          borderTop="1px solid"
          borderColor={topBorder}
          bg={topBg}
          flexShrink={0}
          opacity={dimmed ? 0.3 : 1}
          transition="opacity 0.2s ease"
        >
          {bottomBar}
        </Box>
      )}
    </Box>
  );
}
