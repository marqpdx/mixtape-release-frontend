"use client";

import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { useCreateRadarInitiative } from "@mixtape/api/hooks/radar";

export function AtriumInitiationCard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const { mutateAsync: createInitiative, isPending } = useCreateRadarInitiative();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hintColor = useColorModeValue("gray.400", "gray.500");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const created = await createInitiative({ title: title.trim() });
    router.push(`/radar/${created.id}`);
  };

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      py={5}
      px={5}
      h="100%"
    >
      <Flex align="center" gap={2} mb={4}>
        <Box color="gray.400">
          <IconPlus size={16} />
        </Box>
        <Text fontSize="sm" fontWeight="medium" color="gray.600">
          Start something new
        </Text>
      </Flex>

      <form onSubmit={handleSubmit}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name your initiative…"
          size="md"
          mb={2}
        />

        <Text fontSize="xs" color={hintColor} mb={4}>
          Name it loosely — you can refine later.
        </Text>

        <Button
          type="submit"
          size="sm"
          variant="outline"
          loading={isPending}
          disabled={!title.trim()}
          width="100%"
        >
          Create initiative
        </Button>
      </form>
    </Box>
  );
}
