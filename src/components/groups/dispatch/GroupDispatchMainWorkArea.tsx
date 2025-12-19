// src/components/groups/dispatch/GroupDispatchMainWorkArea.tsx

"use client";

import { Box, Flex, Heading, Button, Text, Spinner } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import DispatchFolderList from "@components/dispatch/DispatchFolderList";
import { DispatchDocument } from "@components/dispatch/interfaces";

interface GroupDispatchMainWorkAreaProps {
  groupSlug: string;
  groupId?: string;
  groupTitle?: string;
  canCreateDispatch?: boolean;
  canManageDispatch?: boolean;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
}

export default function GroupDispatchMainWorkArea({
  groupSlug,
  groupId,
  groupTitle,
  canCreateDispatch = true,
  canManageDispatch = false,
  setActiveSection,
}: GroupDispatchMainWorkAreaProps) {
  // Fetch documents for THIS group only
  const { data: documents, isLoading, error } = useQuery<DispatchDocument[]>({
    queryKey: ["dispatch-documents", groupSlug],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/dispatch/content`, {
        params: { group_slug: groupSlug }, // Filter by group
      });
      return res.data;
    },
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // Consider data immediately stale to trigger refetch
  });

  const handleCreate = () => {
    setActiveSection("dispatch");
  };

  const handleOpenDocument = (slug: string) => {
    setActiveSection("dispatch", { document: slug });
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">Loading dispatch documents...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">Error loading dispatch documents</Text>
      </Box>
    );
  }

  return (
    <Box maxW="6xl" mx="auto" py={10} px={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">
          {groupTitle ? `${groupTitle} - Dispatch Documents` : "Dispatch Documents"}
        </Heading>
        {canCreateDispatch && (
          <Button onClick={handleCreate} colorScheme="blue">
            <IconPlus size={18} style={{ marginRight: '8px' }} />
            New Document
          </Button>
        )}
      </Flex>

      {!documents || documents.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text color="gray.500" mb={4}>
            No dispatch documents yet
          </Text>
          {canCreateDispatch && (
            <Button onClick={handleCreate} variant="outline">
              <IconPlus size={18} style={{ marginRight: '8px' }} />
              Create your first document
            </Button>
          )}
        </Box>
      ) : (
        <DispatchFolderList
          documents={documents}
          onDocumentClick={handleOpenDocument}
        />
      )}
    </Box>
  );
}
