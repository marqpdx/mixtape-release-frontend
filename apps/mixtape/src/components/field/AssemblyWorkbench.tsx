"use client";

import { useState } from "react";
import { Box, Flex, Text, Button, Textarea } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconX, IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import type { Moiety } from "./fieldData";

interface AssemblyWorkbenchProps {
  selectedIds: string[];
  moieties: Moiety[];
  onClose: () => void;
}

export function AssemblyWorkbench({ selectedIds, moieties, onClose }: AssemblyWorkbenchProps) {
  const [order, setOrder] = useState<string[]>(selectedIds);
  const [instruction, setInstruction] = useState(
    "Craft a coherent Markdown document from these pieces. Preserve factual claims and source distinctions."
  );
  const [output, setOutput] = useState<string | null>(null);

  const bgColor = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const bodyColor = useColorModeValue("gray.700", "gray.200");
  const rowBg = useColorModeValue("gray.50", "gray.800");
  const rowBorderColor = useColorModeValue("gray.100", "gray.700");
  const outputBg = useColorModeValue("gray.50", "gray.800");

  const moietyMap = new Map(moieties.map(m => [m.id, m]));

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  }

  function craftMarkdown() {
    const pieces = order.map((id, i) => {
      const m = moietyMap.get(id);
      if (!m) return "";
      return `## ${i + 1}. ${m.name}\n\n${m.distillate}`;
    }).filter(Boolean).join("\n\n---\n\n");

    const trail = order.map((id, i) => {
      const m = moietyMap.get(id);
      return `${i + 1}. ${m?.name ?? id}`;
    }).join("\n");

    setOutput(
      `# Working Assembly\n\n*Instruction: ${instruction}*\n\n---\n\n${pieces}\n\n---\n\n### Source trail\n\n${trail}`
    );
  }

  return (
    <Box
      position="fixed" inset={0} zIndex={40}
      bg={bgColor}
      display="flex" flexDirection="column"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        px={6} py={4} align="center" justify="space-between"
        borderBottomWidth="1px" borderColor={borderColor}
      >
        <Text fontSize="lg" fontWeight="700" color={headingColor} letterSpacing="wider" textTransform="uppercase">
          Assembly
        </Text>
        <Button size="sm" variant="ghost" onClick={onClose} gap={1}>
          <IconX size={14} /> Close
        </Button>
      </Flex>

      <Flex flex={1} overflow="hidden">
        {/* Left — ordered pieces */}
        <Box w="420px" borderRightWidth="1px" borderColor={borderColor} overflowY="auto" p={4}>
          <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={3}>
            Sequence — {order.length} pieces
          </Text>
          <Flex direction="column" gap={2}>
            {order.map((id, i) => {
              const m = moietyMap.get(id);
              if (!m) return null;
              return (
                <Box
                  key={id}
                  bg={rowBg}
                  borderWidth="1px"
                  borderColor={rowBorderColor}
                  borderRadius="md"
                  p={3}
                >
                  <Flex align="flex-start" gap={2}>
                    <Text fontSize="xs" fontWeight="700" color={labelColor} w="20px" mt={0.5}>
                      {i + 1}
                    </Text>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="600" color={headingColor} mb={1}>
                        {m.name}
                      </Text>
                      <Text fontSize="xs" color={bodyColor} lineHeight={1.5}>
                        {m.distillate.slice(0, 80)}{m.distillate.length > 80 ? "…" : ""}
                      </Text>
                    </Box>
                    <Flex direction="column" gap={1} ml={1}>
                      <Button size="2xs" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                        <IconArrowUp size={11} />
                      </Button>
                      <Button size="2xs" variant="ghost" onClick={() => move(i, 1)} disabled={i === order.length - 1}>
                        <IconArrowDown size={11} />
                      </Button>
                    </Flex>
                  </Flex>
                </Box>
              );
            })}
          </Flex>

          <Box mt={4}>
            <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={2}>
              Instruction
            </Text>
            <Textarea
              size="sm"
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              rows={3}
              fontSize="sm"
            />
          </Box>

          <Button
            mt={4} w="full" colorPalette="indigo"
            disabled={order.length === 0}
            onClick={craftMarkdown}
          >
            Craft Markdown →
          </Button>
        </Box>

        {/* Right — output */}
        <Box flex={1} overflowY="auto" p={6}>
          {output ? (
            <Box>
              <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={3}>
                Output
              </Text>
              <Box
                bg={outputBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                p={4}
                fontFamily="mono"
                fontSize="sm"
                color={bodyColor}
                lineHeight={1.7}
                whiteSpace="pre-wrap"
              >
                {output}
              </Box>
            </Box>
          ) : (
            <Flex h="full" align="center" justify="center">
              <Text fontSize="sm" color={labelColor} fontStyle="italic">
                Order your pieces and click Craft Markdown to generate output.
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
