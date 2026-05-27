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
import { IconArrowLeft, IconDownload, IconExternalLink, IconEye, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { fetchGroupFiles, uploadGroupFile, deleteGroupFile } from "@mixtape/api/clients/group/groupApi";
import type { GroupFile } from "@mixtape/api/clients/group/groupApi";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { canUserAdminGroup } from "@mixtape/core/types/groupTypes";
import type { Group } from "@mixtape/core/types/groupTypes";
import { PdfDocumentViewer } from "@components/collections/PdfDocumentViewer";

async function triggerBlobDownload(groupSlug: string, fileId: string, filename: string) {
  const response = await axiosInstance.get(
    `/api/groups/${groupSlug}/files/${fileId}/download/`,
    { responseType: "blob" }
  );
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function openBlobInTab(groupSlug: string, fileId: string) {
  const response = await axiosInstance.get(
    `/api/groups/${groupSlug}/files/${fileId}/download/`,
    { responseType: "blob" }
  );
  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

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

function GroupFilePdfReader({
  file,
  groupSlug,
  onBack,
}: {
  file: GroupFile;
  groupSlug: string;
  onBack: () => void;
}) {
  return (
    <VStack align="stretch" gap={0}>
      <Box pb={5}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            color="theme.textSecondary"
            px={0}
            _hover={{ color: "theme.text" }}
          >
            <IconArrowLeft size={14} />
            <Text ml={1} fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase">
              Back to files
            </Text>
          </Button>

          <HStack gap={2}>
            <Button
              variant="ghost"
              size="sm"
              color="theme.textSecondary"
              _hover={{ color: "theme.text" }}
              onClick={() => openBlobInTab(groupSlug, file.id)}
            >
              <IconExternalLink size={14} />
              <Text ml={1}>Open original</Text>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              color="theme.textSecondary"
              _hover={{ color: "theme.text" }}
              onClick={() => triggerBlobDownload(groupSlug, file.id, file.filename)}
            >
              <IconDownload size={14} />
              <Text ml={1}>Download original</Text>
            </Button>
          </HStack>
        </HStack>
      </Box>

      <Box pb={6} mb={6} borderBottom="1px solid" borderColor="theme.border">
        <Text fontFamily="heading" fontSize={{ base: "2xl", md: "3xl" }} lineHeight="1.1" letterSpacing="-0.02em" color="theme.text" mb={3}>
          {file.filename}
        </Text>
        <Badge colorPalette="red" variant="subtle">PDF</Badge>
      </Box>

      <Box maxW="860px">
        <PdfDocumentViewer
          filename={file.filename}
          sourceFileId={file.id}
          downloadUrl={`/api/groups/${groupSlug}/files/${file.id}/download/`}
        />
      </Box>
    </VStack>
  );
}

export function FilesTab({ group }: { group: Group }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<GroupFile | null>(null);

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (file: GroupFile) => {
    if (!window.confirm(`Delete "${file.filename}"? This cannot be undone.`)) return;
    setDeletingId(file.id);
    try {
      await deleteGroupFile(group.slug, file.id);
      await refetch();
      toaster.success({ title: "File deleted", description: file.filename });
    } catch {
      toaster.error({ title: "Delete failed", description: "Could not delete file." });
    } finally {
      setDeletingId(null);
    }
  };

  if (viewingFile) {
    return (
      <GroupFilePdfReader
        file={viewingFile}
        groupSlug={group.slug}
        onBack={() => setViewingFile(null)}
      />
    );
  }

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
                {file.content_type === "application/pdf" && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="theme.textSecondary"
                    _hover={{ color: "theme.text" }}
                    onClick={() => setViewingFile(file)}
                  >
                    <IconEye size={14} />
                    <Text ml={1}>View</Text>
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  color="theme.textSecondary"
                  _hover={{ color: "theme.text" }}
                  onClick={() => triggerBlobDownload(group.slug, file.id, file.filename)}
                >
                  <IconDownload size={14} />
                  <Text ml={1}>Download</Text>
                </Button>
                {isEditor && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="red.400"
                    _hover={{ color: "red.600" }}
                    loading={deletingId === file.id}
                    onClick={() => handleDelete(file)}
                  >
                    <IconTrash size={14} />
                  </Button>
                )}
              </HStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
