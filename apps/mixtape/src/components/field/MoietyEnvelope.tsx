"use client";

import { Box, Flex, Text, Button, IconButton } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconX, IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import type { Moiety, LikenessRecord } from "./fieldData";

interface MoietyEnvelopeProps {
  moiety: Moiety;
  likenesses: LikenessRecord[];
  effectiveGravity: number;
  standInId: string | null;
  onClose: () => void;
  onIncreaseGravity: (id: string) => void;
  onLetDrift: (id: string) => void;
  onRestorePosition: (id: string) => void;
  onNudge: (id: string, dx: number, dy: number) => void;
  onStandIn: (id: string) => void;
}

export function MoietyEnvelope({
  moiety, likenesses, effectiveGravity, standInId,
  onClose, onIncreaseGravity, onLetDrift, onRestorePosition, onNudge, onStandIn,
}: MoietyEnvelopeProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const bodyColor = useColorModeValue("gray.700", "gray.200");
  const chipBg = useColorModeValue("gray.100", "gray.700");

  const myLikenesses = likenesses.filter(l => l.memberIds.includes(moiety.id));
  const isStandIn = standInId === moiety.id;

  function section(label: string, children: React.ReactNode) {
    return (
      <Box borderTopWidth="1px" borderColor={borderColor} pt={3} pb={3} px={4}>
        <Text fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={2}>
          {label}
        </Text>
        {children}
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" h="full" overflow="hidden">
      {/* Header */}
      <Flex px={4} pt={4} pb={3} align="flex-start" gap={2} justify="space-between">
        <Box flex={1}>
          <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={1}>
            {moiety.kind}{moiety.temporal ? " · ⏱ " + moiety.temporal : ""}
          </Text>
          <Text fontSize="md" fontWeight="700" color={headingColor} lineHeight={1.3}>
            {moiety.name}
          </Text>
        </Box>
        <IconButton aria-label="Close" size="xs" variant="ghost" onClick={onClose} mt={1}>
          <IconX size={14} />
        </IconButton>
      </Flex>

      <Box flex={1} overflowY="auto">
        {/* Distillate */}
        {section("Distillate",
          <Text fontSize="sm" color={bodyColor} lineHeight={1.6}>{moiety.distillate}</Text>
        )}

        {/* Why here */}
        {section("Why here",
          <Flex direction="column" gap={1}>
            {moiety.why_here.map((w, i) => (
              <Text key={i} fontSize="xs" color={bodyColor}>· {w}</Text>
            ))}
          </Flex>
        )}

        {/* Gravity */}
        {section("Gravity",
          <Box>
            <Flex align="center" gap={2} mb={3}>
              <Box
                w="full"
                h="6px"
                bg={useColorModeValue("gray.200", "gray.600")}
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  w={`${effectiveGravity}%`}
                  h="full"
                  bg={effectiveGravity >= 80 ? "indigo.500" : effectiveGravity >= 55 ? "blue.400" : "blue.300"}
                  borderRadius="full"
                  transition="width 0.2s"
                />
              </Box>
              <Text fontSize="xs" fontWeight="700" color={headingColor} w="28px" textAlign="right">
                {effectiveGravity}
              </Text>
            </Flex>
            <Flex gap={2}>
              <Button size="xs" colorPalette="indigo" variant="outline" onClick={() => onIncreaseGravity(moiety.id)}>
                ↑ Gravity
              </Button>
              <Button size="xs" variant="ghost" onClick={() => onLetDrift(moiety.id)}>
                Let drift
              </Button>
            </Flex>
          </Box>
        )}

        {/* Likenesses */}
        {myLikenesses.length > 0 && section("Likenesses",
          <Flex direction="column" gap={1}>
            {myLikenesses.map(l => (
              <Flex key={l.id} align="center" gap={2}>
                <Box px={2} py={0.5} bg={chipBg} borderRadius="md" fontSize="xs" color={bodyColor}>
                  {l.name}
                </Box>
                <Text fontSize="xs" color={labelColor}>{l.formation}</Text>
              </Flex>
            ))}
          </Flex>
        )}

        {/* Location */}
        {section("Location",
          <Box>
            <Text fontSize="xs" color={bodyColor} mb={2}>
              x: {Math.round(moiety.x)}, y: {Math.round(moiety.y)}
              {moiety.human_placed
                ? " · Human placed"
                : ` · System (home: ${moiety.home_x}, ${moiety.home_y})`}
            </Text>
            <Flex gap={2} align="center">
              <Text fontSize="xs" color={labelColor}>Nudge:</Text>
              <IconButton aria-label="Left" size="2xs" variant="outline" onClick={() => onNudge(moiety.id, -20, 0)}>
                <IconArrowLeft size={11} />
              </IconButton>
              <IconButton aria-label="Right" size="2xs" variant="outline" onClick={() => onNudge(moiety.id, 20, 0)}>
                <IconArrowRight size={11} />
              </IconButton>
              <IconButton aria-label="Up" size="2xs" variant="outline" onClick={() => onNudge(moiety.id, 0, -20)}>
                <IconArrowUp size={11} />
              </IconButton>
              <IconButton aria-label="Down" size="2xs" variant="outline" onClick={() => onNudge(moiety.id, 0, 20)}>
                <IconArrowDown size={11} />
              </IconButton>
            </Flex>
            {moiety.human_placed && (
              <Button size="xs" variant="ghost" mt={2} onClick={() => onRestorePosition(moiety.id)}>
                Restore suggested position
              </Button>
            )}
          </Box>
        )}

        {/* Stand In */}
        {section("Viewpoint",
          <Button
            size="xs"
            variant={isStandIn ? "solid" : "outline"}
            colorPalette={isStandIn ? "indigo" : undefined}
            onClick={() => onStandIn(moiety.id)}
          >
            {isStandIn ? "Standing in this — exit" : "Stand in"}
          </Button>
        )}

        {/* Tags */}
        {moiety.tags.length > 0 && section("Tags",
          <Flex gap={1} flexWrap="wrap">
            {moiety.tags.map(t => (
              <Box key={t} px={2} py={0.5} bg={chipBg} borderRadius="md" fontSize="xs" color={labelColor}>
                {t}
              </Box>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
