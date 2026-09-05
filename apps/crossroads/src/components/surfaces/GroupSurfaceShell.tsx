"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
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
  const bg = useColorModeValue("gray.50", "gray.950");
  const topBg = useColorModeValue("white", "gray.900");
  const topBorder = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.400", "gray.500");
  const surfaceLabel = useColorModeValue("gray.700", "gray.200");

  return (
    <Box className="gss-root" display="flex" flexDirection="column" minH="calc(100vh - 56px)" bg={bg}>
      {/* Top bar */}
      <Box
        className="gss-top"
        as="header"
        h="44px"
        bg={topBg}
        borderBottom="1px solid"
        borderColor={topBorder}
        px={4}
        flexShrink={0}
        display="flex"
        alignItems="center"
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
      </Box>

      {/* Body: left rail + main + right */}
      <Box className="gss-body" display="flex" flex="1" overflow="hidden">
        <GroupSurfaceLeftRail groupSlug={groupSlug} />

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
        >
          {bottomBar}
        </Box>
      )}
    </Box>
  );
}
