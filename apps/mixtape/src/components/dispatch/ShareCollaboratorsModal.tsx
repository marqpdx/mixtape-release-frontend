// src/components/dispatch/ShareCollaboratorsModal.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Spinner,
  Badge,
  IconButton,
  Dialog,
  Avatar,
} from "@chakra-ui/react";
import { toaster } from "@mixtape/core/lib/toaster";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { IconX, IconUserPlus } from "@tabler/icons-react";

interface User {
  id: string;
  username: string;
  email: string;
  profile?: {
    display_name?: string;
    avatar?: string;
  };
}

interface ShareCollaboratorsModalProps {
  open: boolean;
  onClose: () => void;
  documentSlug: string;
}

export default function ShareCollaboratorsModal({
  open,
  onClose,
  documentSlug,
}: ShareCollaboratorsModalProps) {
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && documentSlug) {
      fetchCollaborators();
    }
  }, [open, documentSlug]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/api/dispatch/content/${documentSlug}/collaborators`,
      );
      setCollaborators(res.data.collaborators || []);
      setAvailableUsers(res.data.available_users || []);
    } catch (error) {
      console.error("Failed to fetch collaborators:", error);
      toaster.create({
        title: "Failed to load collaborators",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCollaborator = async (userId: string) => {
    try {
      setAdding(true);
      await axiosInstance.post(
        `/api/dispatch/content/${documentSlug}/collaborators`,
        {
          user_ids: [userId],
        },
      );
      await fetchCollaborators();
      toaster.create({
        title: "Collaborator added",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to add collaborator:", error);
      toaster.create({
        title: error.response?.data?.error || "Failed to add collaborator",
        type: "error",
      });
    } finally {
      setAdding(false);
    }
  };

  const removeCollaborator = async (userId: string) => {
    try {
      await axiosInstance.delete(
        `/api/dispatch/content/${documentSlug}/collaborators`,
        {
          data: { user_ids: [userId] },
        },
      );
      await fetchCollaborators();
      toaster.create({
        title: "Collaborator removed",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to remove collaborator:", error);
      toaster.create({
        title: error.response?.data?.error || "Failed to remove collaborator",
        type: "error",
      });
    }
  };

  const collaboratorIds = new Set(collaborators.map((c) => c.id));
  const filteredAvailableUsers = availableUsers
    .filter((u) => !collaboratorIds.has(u.id))
    .filter((u) =>
      searchTerm
        ? u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.profile?.display_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
        : true,
    );

  const getDisplayName = (user: User) =>
    user.profile?.display_name || user.username;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Content maxW="2xl">
        <Dialog.Header>
          <Heading size="md">Share Document</Heading>
        </Dialog.Header>
        <Dialog.CloseTrigger />

        <Dialog.Body>
          {loading ? (
            <Flex justify="center" py={8}>
              <Spinner />
            </Flex>
          ) : (
            <VStack align="stretch" gap={6}>
              {/* Current Collaborators */}
              <Box>
                <Text fontWeight="semibold" mb={3}>
                  Current Collaborators ({collaborators.length})
                </Text>
                <VStack align="stretch" gap={2}>
                  {collaborators.map((user) => (
                    <Flex
                      key={user.id}
                      p={3}
                      borderWidth={1}
                      borderRadius="md"
                      justify="space-between"
                      align="center"
                    >
                      <HStack gap={3}>
                        {/* ✅ Chakra v3 Avatar API */}
                        <Avatar.Root size="sm">
                          <Avatar.Fallback name={getDisplayName(user)} />
                          {user.profile?.avatar && (
                            <Avatar.Image src={user.profile.avatar} />
                          )}
                        </Avatar.Root>

                        <Box>
                          <Text fontWeight="medium">
                            {getDisplayName(user)}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {user.email}
                          </Text>
                        </Box>
                      </HStack>
                      <IconButton
                        aria-label="Remove collaborator"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCollaborator(user.id)}
                      >
                        <IconX size={16} />
                      </IconButton>
                    </Flex>
                  ))}
                  {collaborators.length === 0 && (
                    <Text color="gray.500" fontSize="sm">
                      No collaborators yet
                    </Text>
                  )}
                </VStack>
              </Box>

              {/* Add Collaborators */}
              {availableUsers.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={3}>
                    Add Collaborators
                  </Text>
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    mb={3}
                  />
                  <VStack
                    align="stretch"
                    gap={2}
                    maxH="300px"
                    overflowY="auto"
                  >
                    {filteredAvailableUsers.map((user) => (
                      <Flex
                        key={user.id}
                        p={3}
                        borderWidth={1}
                        borderRadius="md"
                        justify="space-between"
                        align="center"
                        _hover={{ bg: "gray.50" }}
                      >
                        <HStack gap={3}>
                          {/* ✅ Chakra v3 Avatar API */}
                          <Avatar.Root size="sm">
                            <Avatar.Fallback name={getDisplayName(user)} />
                            {user.profile?.avatar && (
                              <Avatar.Image src={user.profile.avatar} />
                            )}
                          </Avatar.Root>

                          <Box>
                            <Text fontWeight="medium">
                              {getDisplayName(user)}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {user.email}
                            </Text>
                          </Box>
                        </HStack>
                        <Button
                          size="sm"
                          onClick={() => addCollaborator(user.id)}
                          disabled={adding}
                        >
                          <IconUserPlus
                            size={16}
                            style={{ marginRight: "4px" }}
                          />
                          Add
                        </Button>
                      </Flex>
                    ))}
                    {filteredAvailableUsers.length === 0 && (
                      <Text
                        color="gray.500"
                        fontSize="sm"
                        textAlign="center"
                        py={4}
                      >
                        {searchTerm
                          ? "No members found"
                          : "All group members are already collaborators"}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}
            </VStack>
          )}
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Root>
  );
}
