"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { IconLayoutSidebarRight } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAtriumSponsorContext } from "@mixtape/api/hooks/atrium";
import { AtriumDialogSurface } from "./AtriumDialogSurface";

interface AtriumSidebarWrapperProps {
  groupSlug?: string;
}

export function AtriumSidebarWrapper({ groupSlug }: AtriumSidebarWrapperProps) {
  const { sponsorContext } = useAtriumSponsorContext(groupSlug);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [trackedItems, setTrackedItems] = useState<string[]>([]);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const trackedFetched = useRef(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sidebarOpen]);

  const sidebarBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const itemColor = useColorModeValue("gray.700", "gray.200");
  const activeInitiativeColor = useColorModeValue("blue.600", "blue.300");
  const handleColor = useColorModeValue("gray.400", "gray.500");

  const isExpanded = sidebarOpen || hovered;

  const initiatives = sponsorContext?.initiatives ?? [];
  const drafts = sponsorContext?.recent_drafts ?? [];
  const hasContent = trackedItems.length > 0 || initiatives.length > 0 || drafts.length > 0;

  return (
    <Flex className="asw-root" align="flex-start">
      {/* Main dialog surface */}
      <Box className="asw-surface" flex={1} minW={0}>
        <AtriumDialogSurface
          groupSlug={groupSlug}
          selectedInitiativeId={selectedInitiativeId}
          onInitiativeSessionChange={setSelectedInitiativeId}
          onTrackedFetch={(items) => {
            setTrackedItems(items);
            trackedFetched.current = true;
          }}
        />
      </Box>

      {/* Sidebar */}
      <Box
        className="asw-sidebar"
        flexShrink={0}
        w={sidebarOpen ? "40%" : hovered ? "180px" : "32px"}
        transition="width 0.18s ease"
        overflow="hidden"
        borderLeftWidth="1px"
        borderColor={borderColor}
        bg={sidebarBg}
        alignSelf="stretch"
        onMouseEnter={() => !sidebarOpen && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (!sidebarOpen) setSidebarOpen(true); }}
        cursor={sidebarOpen ? "default" : "pointer"}
        role={sidebarOpen ? undefined : "button"}
        aria-label={sidebarOpen ? undefined : "Open context sidebar"}
      >
        {/* Thin handle */}
        {!isExpanded && (
          <Flex h="100%" minH="120px" align="center" justify="center">
            <Box color={handleColor}>
              <IconLayoutSidebarRight size={14} />
            </Box>
          </Flex>
        )}

        {/* Expanded panel */}
        {isExpanded && (
          <Box p={3} onClick={(e) => e.stopPropagation()}>
            {/* Close button — only when fully open */}
            {sidebarOpen && (
              <Flex justify="flex-end" mb={2}>
                <Text
                  fontSize="xs"
                  color={labelColor}
                  cursor="pointer"
                  onClick={() => setSidebarOpen(false)}
                  _hover={{ color: itemColor }}
                  userSelect="none"
                >
                  ✕
                </Text>
              </Flex>
            )}

            {/* Tracked items */}
            {(trackedItems.length > 0 || trackedFetched.current) && (
              <Box mb={4}>
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  color={labelColor}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={1.5}
                >
                  Tracked
                </Text>
                {trackedItems.length > 0 ? (
                  <VStack align="stretch" gap={1}>
                    {trackedItems.slice(0, sidebarOpen ? 20 : 5).map((item, i) => (
                      <Text key={i} fontSize="xs" color={itemColor} lineClamp={1} title={item}>
                        {item}
                      </Text>
                    ))}
                  </VStack>
                ) : (
                  <Text fontSize="xs" color={labelColor}>No tracked items yet.</Text>
                )}
              </Box>
            )}

            {/* Initiatives */}
            {initiatives.length > 0 && (
              <Box mb={4}>
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  color={labelColor}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={1.5}
                >
                  Initiatives
                </Text>
                <VStack align="stretch" gap={1}>
                  {initiatives.slice(0, sidebarOpen ? 10 : 4).map((item) => {
                    const isActive = selectedInitiativeId === item.id;
                    return (
                      <Text
                        key={item.id}
                        fontSize="xs"
                        color={isActive ? activeInitiativeColor : itemColor}
                        fontWeight={isActive ? "600" : "400"}
                        lineClamp={1}
                        title={item.title}
                        cursor="pointer"
                        _hover={{ color: activeInitiativeColor }}
                        onClick={() => setSelectedInitiativeId(isActive ? null : item.id)}
                      >
                        {isActive ? "→ " : ""}{item.title}
                      </Text>
                    );
                  })}
                </VStack>
              </Box>
            )}

            {/* Recent Drafts */}
            {drafts.length > 0 && (
              <Box>
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  color={labelColor}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={1.5}
                >
                  Recent Drafts
                </Text>
                <VStack align="stretch" gap={1}>
                  {drafts.slice(0, sidebarOpen ? 5 : 3).map((draft) => (
                    <Text key={draft.id} fontSize="xs" color={itemColor} lineClamp={1} title={draft.title || "Untitled"}>
                      {draft.title || "Untitled"}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Empty state — only show when open, not hover preview */}
            {sidebarOpen && !hasContent && (
              <Text fontSize="xs" color={labelColor}>
                No initiatives or drafts yet.
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
}
