// components/puddlejump/panels/FilesPanel.tsx

'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Spinner,
  Badge,
  Collapsible,
} from '@chakra-ui/react';
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { usePersonalPuddlejump } from '@mixtape/api/hooks/stackroom';

interface FilesPanelProps {
  libraryId: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface FolderGroup {
  name: string;
  path: string;
  files: Array<{
    id: string;
    filename: string;
    title: string;
    folder_path: string;
    size_bytes?: number;
    is_featured: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
  }>;
}

export default function FilesPanel({ libraryId }: FilesPanelProps) {
  const { puddlejump, isLoading, error } = usePersonalPuddlejump();
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  // Group files by folder
  const folderGroups = useMemo(() => {
    if (!puddlejump?.items) return [];

    const files = puddlejump.items.filter(item => !item.is_folder);
    const groups: Record<string, FolderGroup> = {};

    for (const file of files) {
      const path = file.folder_path || file.filename || '';
      const parts = path.split('/');
      const folderPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      const folderName = folderPath || 'Root';

      if (!groups[folderPath]) {
        groups[folderPath] = {
          name: folderName,
          path: folderPath,
          files: [],
        };
      }
      groups[folderPath].files.push({
        id: file.id,
        filename: file.filename || parts[parts.length - 1] || file.title || 'Untitled',
        title: file.title,
        folder_path: file.folder_path,
        size_bytes: file.size_bytes,
        is_featured: file.is_featured,
        tags: file.tags,
        created_at: file.created_at,
        updated_at: file.updated_at,
      });
    }

    // Sort folders (root first, then alphabetical)
    return Object.values(groups).sort((a, b) => {
      if (a.path === '') return -1;
      if (b.path === '') return 1;
      return a.path.localeCompare(b.path);
    });
  }, [puddlejump?.items]);

  if (!libraryId) {
    return (
      <Box py={12} textAlign="center">
        <Text color="theme.textSecondary">No Puddlejump library found.</Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box py={12} textAlign="center">
        <Spinner size="lg" color="theme.accent" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
        <Text color="red.600">Failed to load files: {error.message}</Text>
      </Box>
    );
  }

  const totalFiles = folderGroups.reduce((sum, g) => sum + g.files.length, 0);

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Files
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          {totalFiles} file{totalFiles !== 1 ? 's' : ''} in {folderGroups.length} folder{folderGroups.length !== 1 ? 's' : ''}
        </Text>
      </Box>

      {totalFiles === 0 ? (
        <Box
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="theme.border"
          borderRadius="lg"
          p={12}
          textAlign="center"
        >
          <VStack gap={3}>
            <Box color="theme.textSecondary">
              <FolderIcon style={{ width: 48, height: 48, strokeWidth: 1 }} />
            </Box>
            <Text color="theme.textSecondary">Your Puddlejump is empty</Text>
            <Text color="theme.textSecondary" fontSize="sm">
              Import a bundle or sync files from the desktop app
            </Text>
          </VStack>
        </Box>
      ) : (
        <VStack align="stretch" gap={4}>
          {folderGroups.map((group) => (
            <Collapsible.Root key={group.path} defaultOpen>
              <Collapsible.Trigger
                w="100%"
                px={3}
                py={2}
                borderRadius="md"
                cursor="pointer"
                _hover={{ bg: 'theme.bgSecondary' }}
              >
                <HStack gap={2}>
                  <FolderOpenIcon style={{ width: 18, height: 18 }} />
                  <Text fontWeight="semibold" color="theme.text" fontSize="sm">
                    {group.name || '/'}
                  </Text>
                  <Text fontSize="xs" color="theme.textSecondary">
                    ({group.files.length})
                  </Text>
                </HStack>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <VStack align="stretch" gap={0} pl={2}>
                  {group.files.map((file) => (
                    <Box key={file.id}>
                      <Box
                        px={3}
                        py={2}
                        cursor="pointer"
                        borderRadius="md"
                        bg={expandedFile === file.id ? 'theme.bgSecondary' : undefined}
                        _hover={{ bg: 'theme.bgSecondary' }}
                        onClick={() =>
                          setExpandedFile(expandedFile === file.id ? null : file.id)
                        }
                      >
                        <HStack gap={3} justify="space-between">
                          <HStack gap={2}>
                            <DocumentTextIcon style={{ width: 16, height: 16 }} />
                            <Text fontSize="sm" color="theme.text">
                              {file.filename}
                            </Text>
                            {file.is_featured && (
                              <Badge size="sm" colorPalette="green">
                                canon
                              </Badge>
                            )}
                          </HStack>
                          <HStack gap={2}>
                            {file.size_bytes != null && (
                              <Text fontSize="xs" color="theme.textSecondary">
                                {formatBytes(file.size_bytes)}
                              </Text>
                            )}
                            <ChevronRightIcon
                              style={{
                                width: 14,
                                height: 14,
                                transform: expandedFile === file.id ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.15s',
                              }}
                            />
                          </HStack>
                        </HStack>
                      </Box>

                      {/* Expanded file detail */}
                      {expandedFile === file.id && (
                        <Box
                          ml={7}
                          mt={1}
                          mb={2}
                          p={3}
                          borderWidth="1px"
                          borderColor="theme.border"
                          borderRadius="md"
                          bg="theme.surface"
                        >
                          <VStack align="stretch" gap={2}>
                            {file.folder_path && (
                              <HStack>
                                <Text fontSize="xs" color="theme.textSecondary" fontWeight="medium" minW="60px">
                                  Path
                                </Text>
                                <Text fontSize="xs" color="theme.text">
                                  {file.folder_path}
                                </Text>
                              </HStack>
                            )}
                            <HStack>
                              <Text fontSize="xs" color="theme.textSecondary" fontWeight="medium" minW="60px">
                                Canonical
                              </Text>
                              <Text fontSize="xs" color="theme.text">
                                {file.is_featured ? 'Yes' : 'No'}
                              </Text>
                            </HStack>
                            {file.tags.length > 0 && (
                              <HStack>
                                <Text fontSize="xs" color="theme.textSecondary" fontWeight="medium" minW="60px">
                                  Tags
                                </Text>
                                <HStack gap={1} flexWrap="wrap">
                                  {file.tags.map((tag) => (
                                    <Badge key={tag} size="sm" variant="subtle">
                                      {tag}
                                    </Badge>
                                  ))}
                                </HStack>
                              </HStack>
                            )}
                            <HStack>
                              <Text fontSize="xs" color="theme.textSecondary" fontWeight="medium" minW="60px">
                                Updated
                              </Text>
                              <Text fontSize="xs" color="theme.text">
                                {new Date(file.updated_at).toLocaleDateString()}
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
