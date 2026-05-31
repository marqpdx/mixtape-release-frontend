"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useProjectCreate, useProjectsList } from "@mixtape/api/hooks/projects";
import NextLink from "next/link";

export default function ProjectsListPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const loadGroup = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/groups/${slug}`);
      setGroupId(response.data.id);
      setGroupError(null);
    } catch {
      setGroupError("Could not load group. You may not have permission.");
    } finally {
      setGroupLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadGroup();
    }
  }, [slug, authLoading, isAuthenticated, loadGroup]);

  const listParams = useMemo(
    () =>
      groupId
        ? { sponsor_type: "group", sponsor_object_id: groupId }
        : null,
    [groupId]
  );

  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    addProject,
  } = useProjectsList(listParams);

  const {
    createProject,
    isCreating,
    error: createError,
    clearError: clearCreateError,
  } = useProjectCreate();

  async function handleCreate() {
    if (!newTitle.trim() || !groupId) return;
    clearCreateError();
    try {
      const project = await createProject({
        title: newTitle.trim(),
        summary: newSummary.trim(),
        mode: "project",
        sponsor_content_type: "group",
        sponsor_object_id: groupId,
      });
      addProject(project);
      setNewTitle("");
      setNewSummary("");
    } catch {
      // error handled by hook
    }
  }

  if (authLoading || groupLoading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>You must be logged in to view this page.</Text>
      </Box>
    );
  }

  if (groupError) {
    return (
      <Box maxW="3xl" mx="auto" px="6" py="10">
        <Text color="red.500">{groupError}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="3xl" mx="auto" px="6" py="10">
      <HStack mb="6" justify="space-between" align="center">
        <Heading size="lg">Projects</Heading>
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${slug}`}>Back to group</NextLink>
        </ChakraLink>
      </HStack>

      <VStack gap="3" align="stretch" mb="8">
        <Text fontWeight="600">Create a project</Text>
        <Input
          size="sm"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Project title"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTitle.trim()) handleCreate();
          }}
        />
        <Textarea
          size="sm"
          value={newSummary}
          onChange={(e) => setNewSummary(e.target.value)}
          placeholder="Summary (optional)"
          rows={2}
        />
        {createError && (
          <Text fontSize="sm" color="red.500">
            {createError}
          </Text>
        )}
        <HStack>
          <Button
            size="sm"
            colorPalette="blue"
            onClick={handleCreate}
            loading={isCreating}
            disabled={!newTitle.trim()}
          >
            Create project
          </Button>
        </HStack>
      </VStack>

      <Text fontWeight="600" mb="3">
        Your projects
      </Text>

      {projectsLoading && (
        <HStack>
          <Spinner size="sm" />
          <Text fontSize="sm" color={mutedColor}>
            Loading...
          </Text>
        </HStack>
      )}

      {projectsError && (
        <Text fontSize="sm" color="red.500">
          {projectsError}
        </Text>
      )}

      {!projectsLoading && projects.length === 0 && (
        <Box
          p="6"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          bg={cardBg}
          textAlign="center"
        >
          <Text color={mutedColor}>No projects yet. Create one above.</Text>
        </Box>
      )}

      <VStack gap="2" align="stretch">
        {projects.map((project) => (
          <ChakraLink
            asChild
            key={project.id}
            _hover={{ textDecoration: "none" }}
          >
            <NextLink href={`/group/${slug}/admin/projects/${project.id}/board`}>
              <Box
                p="4"
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                bg={cardBg}
                _hover={{ borderColor: "blue.300" }}
                transition="border-color 0.15s"
                cursor="pointer"
              >
                <Text fontWeight="500">{project.title}</Text>
                {project.summary && (
                  <Text fontSize="sm" color={mutedColor}>
                    {project.summary}
                  </Text>
                )}
              </Box>
            </NextLink>
          </ChakraLink>
        ))}
      </VStack>
    </Box>
  );
}
