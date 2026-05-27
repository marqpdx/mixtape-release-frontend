// apps/mixtape/src/components/groups/tabs/FilesTab.tsx

"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { fetchGroupFiles, uploadGroupFile } from "@mixtape/api/clients/group/groupApi";
import { toaster } from "@mixtape/core/lib/toaster";
import { canUserAdminGroup } from "@mixtape/core/types/groupTypes";
import type { Group } from "@mixtape/core/types/groupTypes";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function FilesTab({ group }: { group: Group }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isEditor = canUserAdminGroup(group);

  const {
    data: files,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["group-files", group.slug],
    queryFn: () => fetchGroupFiles(group.slug),
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadGroupFile(group.slug, file);
      await refetch();
      toaster.success({ title: "File uploaded", description: file.name });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toaster.error({ title: "File already exists", description: file.name });
      } else {
        toaster.error({ title: "Upload failed", description: "Could not upload file." });
      }
    } finally {
      setIsUploading(false);
      // Reset so the same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Box>
      <HStack mb={4} justify="space-between" align="center">
        <Text fontWeight="semibold" fontSize="lg">
          Files & Resources
        </Text>
        {isEditor && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              colorScheme="blue"
              loading={isUploading}
              onClick={handleUploadClick}
            >
              Upload
            </Button>
          </>
        )}
      </HStack>

      {isLoading && (
        <VStack gap={2} align="stretch">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height="44px" borderRadius="md" />
          ))}
        </VStack>
      )}

      {isError && (
        <Text color="red.500" fontSize="sm">
          Could not load files.
        </Text>
      )}

      {!isLoading && !isError && files && files.length === 0 && (
        <Text color="gray.500" fontSize="sm">
          No files uploaded yet.
        </Text>
      )}

      {!isLoading && !isError && files && files.length > 0 && (
        <VStack gap={2} align="stretch">
          {files.map((file) => (
            <HStack
              key={file.id}
              px={3}
              py={2}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              justify="space-between"
              align="center"
            >
              <HStack gap={2} flex={1} minWidth={0}>
                <Text fontSize="sm" fontWeight="medium" truncate>
                  {file.filename}
                </Text>
                {file.content_type === "application/pdf" && (
                  <Badge colorScheme="red" size="sm" flexShrink={0}>
                    PDF
                  </Badge>
                )}
              </HStack>
              <HStack gap={3} flexShrink={0}>
                <Text fontSize="xs" color="gray.500">
                  {formatBytes(file.size_bytes)}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {formatDate(file.created_at)}
                </Text>
              </HStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
