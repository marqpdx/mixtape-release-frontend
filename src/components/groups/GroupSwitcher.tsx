// src/components/groups/GroupSwitcher.tsx

"use client";

import { Box, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { useUserGroups } from "@hooks/useGroups";

interface GroupSwitcherProps {
  currentGroupSlug: string;
}

export function GroupSwitcher({ currentGroupSlug }: GroupSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const {groups: myGroups, isLoading: myGroupsLoading, error: myGroupsError, refetch: myGroupsRefetch } = useUserGroups();

  const currentGroup = myGroups.find(g => g.slug === currentGroupSlug);
  const otherGroups = myGroups.filter(g => g.slug !== currentGroupSlug);

  if (myGroupsLoading || !currentGroup) return null;

  return (
    <Box position="relative">
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        px={3}
        py={2}
        borderRadius="md"
        _hover={{ bg: "gray.100" }}
      >
        <Text fontWeight="medium">{currentGroup.title}</Text>
        <IconChevronDown size={16} />
      </Box>

      {isOpen && otherGroups.length > 0 && (
        <>
          <Box
            position="fixed"
            inset={0}
            zIndex={999}
            onClick={() => setIsOpen(false)}
          />
          <Box
            position="absolute"
            top="100%"
            left={0}
            mt={1}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            boxShadow="lg"
            minW="200px"
            zIndex={1000}
          >
            {otherGroups.map((group) => (
              <Box
                key={group.id}
                px={3}
                py={2}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
                onClick={() => {
                  router.push(`/groups/${group.slug}`);
                  setIsOpen(false);
                }}
              >
                <Text>{group.title}</Text>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}