"use client";

import { useState } from "react";
import { Box, Flex, Text, Button, Input } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { Moiety, Formation } from "./fieldData";

interface LikenessModalProps {
  selectedIds: string[];
  moieties: Moiety[];
  onConfirm: (name: string, formation: Formation, memberIds: string[]) => void;
  onCancel: () => void;
}

const FORMATIONS: { value: Formation; label: string; desc: string }[] = [
  { value: "circle", label: "Circle", desc: "Arranged in a ring" },
  { value: "row",    label: "Row",    desc: "Linear left-to-right" },
  { value: "cluster", label: "Cluster", desc: "Compact grid" },
];

export function LikenessModal({ selectedIds, moieties, onConfirm, onCancel }: LikenessModalProps) {
  const [name, setName] = useState("");
  const [formation, setFormation] = useState<Formation>("circle");

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const overlayBg = "rgba(0,0,0,0.4)";
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const bodyColor = useColorModeValue("gray.700", "gray.200");
  const chipBg = useColorModeValue("gray.100", "gray.700");
  const activeFormBg = useColorModeValue("indigo.50", "indigo.900");
  const activeFormBorder = useColorModeValue("indigo.400", "indigo.500");

  const members = moieties.filter(m => selectedIds.includes(m.id));

  return (
    <Box
      position="fixed" inset={0} zIndex={50}
      display="flex" alignItems="center" justifyContent="center"
      bg={overlayBg}
      onClick={onCancel}
    >
      <Box
        bg={bgColor} borderWidth="1px" borderColor={borderColor}
        borderRadius="lg" p={6} w="420px" maxW="90vw"
        boxShadow="xl"
        onClick={e => e.stopPropagation()}
      >
        <Text fontSize="lg" fontWeight="700" mb={4}>Create Likeness</Text>

        <Box mb={4}>
          <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={1}>
            Name
          </Text>
          <Input
            size="sm"
            placeholder="e.g. Cabot Renewal Draft"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </Box>

        <Box mb={4}>
          <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={2}>
            Formation
          </Text>
          <Flex gap={2}>
            {FORMATIONS.map(f => (
              <Box
                key={f.value}
                flex={1}
                p={2}
                borderWidth="1.5px"
                borderRadius="md"
                borderColor={formation === f.value ? activeFormBorder : borderColor}
                bg={formation === f.value ? activeFormBg : "transparent"}
                cursor="pointer"
                onClick={() => setFormation(f.value)}
                textAlign="center"
              >
                <Text fontSize="sm" fontWeight={formation === f.value ? "700" : "500"} color={bodyColor}>
                  {f.label}
                </Text>
                <Text fontSize="10px" color={labelColor}>{f.desc}</Text>
              </Box>
            ))}
          </Flex>
        </Box>

        <Box mb={5}>
          <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="wider" mb={2}>
            Members ({members.length})
          </Text>
          <Flex gap={1} flexWrap="wrap">
            {members.map(m => (
              <Box key={m.id} px={2} py={0.5} bg={chipBg} borderRadius="md" fontSize="xs" color={bodyColor}>
                {m.name}
              </Box>
            ))}
          </Flex>
        </Box>

        <Flex gap={2} justify="flex-end">
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm" colorPalette="indigo"
            disabled={!name.trim() || members.length === 0}
            onClick={() => name.trim() && onConfirm(name.trim(), formation, selectedIds)}
          >
            Create Likeness
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
