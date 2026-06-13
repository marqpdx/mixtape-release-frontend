"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  HStack,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
import { fetchGroupFiles, deleteGroupFile } from "@mixtape/api/clients/group/groupApi";
import { getFileTypeInfo } from "@/components/stackroom/utils/fileTypeHelpers";
import { formatBytes } from "@/components/collections/explorer/fileTypeUtils";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@/components/ui/toaster";
import { useColorModeValue } from "@components/ui/color-mode";

async function openFileInTab(slug: string, fileId: string, filename: string) {
  try {
    const response = await axiosInstance.get(
      `/api/groups/${slug}/files/${fileId}/download/`,
      { responseType: "arraybuffer" }
    );
    const contentType = String(response.headers?.["content-type"] || "application/octet-stream");
    const blob = new Blob([response.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    // Don't set a.download — lets PDFs open inline in the browser
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    toaster.create({ type: "error", title: "Could not open file." });
  }
}

export default function GroupLibraryPage() {
  const { slug } = useParams();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);
  const queryClient = useQueryClient();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.900", "gray.100");
  const rowHover = useColorModeValue("gray.50", "gray.800");

  const { data: files, isLoading, error } = useQuery({
    queryKey: ["group-files", slugStr],
    queryFn: () => fetchGroupFiles(slugStr),
    enabled: !!slugStr,
    staleTime: 2 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteGroupFile(slugStr, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-files", slugStr] });
      setConfirmDeleteId(null);
      toaster.create({ type: "success", title: "File deleted." });
    },
    onError: () => {
      toaster.create({ type: "error", title: "Delete failed. You may not have permission." });
      setConfirmDeleteId(null);
    },
  });

  return (
    <Box className="grp-lib-root" maxW="860px" mx="auto" px={{ base: 4, md: 8 }} py={10}>
      <Heading size="lg" color={headingColor} mb={6}>
        Files
      </Heading>

      {isLoading && (
        <Box py={12} textAlign="center">
          <Spinner size="lg" />
        </Box>
      )}

      {error && (
        <Text color="red.500" fontSize="sm">
          Failed to load files.
        </Text>
      )}

      {!isLoading && !error && files && files.length === 0 && (
        <Text color={metaColor} fontSize="sm">
          No files yet.
        </Text>
      )}

      {!isLoading && !error && files && files.length > 0 && (
        <VStack gap={0} align="stretch">
          {files.map((file) => {
            const typeInfo = getFileTypeInfo(file.filename, file.content_type);
            const Icon = typeInfo.icon;
            const isConfirming = confirmDeleteId === file.id;
            const isDeleting = deleteMutation.isPending && confirmDeleteId === file.id;

            return (
              <Box
                key={file.id}
                py={3}
                px={2}
                borderBottomWidth="1px"
                borderColor={borderColor}
                _hover={{ bg: rowHover }}
                borderRadius="md"
              >
                <HStack justify="space-between" gap={3} flexWrap="wrap">
                  <HStack gap={3} minW={0} flex={1}>
                    <Box color={`${typeInfo.colorScheme}.500`} flexShrink={0}>
                      <Icon size={18} />
                    </Box>
                    <VStack gap={0} align="start" minW={0}>
                      <Text fontWeight="medium" fontSize="sm" lineClamp={1}>
                        {file.filename}
                      </Text>
                      <HStack gap={2} fontSize="xs" color={metaColor}>
                        <Text>{formatBytes(file.size_bytes)}</Text>
                        <Text>·</Text>
                        <Text>{format(new Date(file.created_at), "MMM d, yyyy")}</Text>
                      </HStack>
                    </VStack>
                  </HStack>

                  <HStack gap={2} flexShrink={0}>
                    {isConfirming ? (
                      <>
                        <Text fontSize="xs" color={metaColor}>Delete?</Text>
                        <Button
                          size="xs"
                          colorPalette="red"
                          loading={isDeleting}
                          onClick={() => deleteMutation.mutate(file.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => openFileInTab(slugStr, file.id, file.filename)}
                        >
                          <ExternalLink size={14} />
                          Open
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          color="red.500"
                          onClick={() => setConfirmDeleteId(file.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </HStack>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
