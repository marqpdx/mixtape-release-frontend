// apps/mixtape/src/app/(authenticated)/puddlejump/page.tsx

'use client';

import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  HStack,
  Button,
  Spinner,
} from '@chakra-ui/react';
import {
  FolderIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { usePersonalPuddlejump } from '@mixtape/api/hooks/stackroom';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function PuddlejumpPage() {
  const { puddlejump, isLoading, error } = usePersonalPuddlejump();

  const files = puddlejump?.items.filter(item => !item.is_folder) || [];
  const folders = puddlejump?.items.filter(item => item.is_folder) || [];

  return (
    <Container maxWidth="900px" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2} color="theme.text">
            Puddlejump
          </Heading>
          <Text color="theme.textSecondary" fontSize="lg">
            Your canonical archive
          </Text>
        </Box>

        {/* Intro Section */}
        <Box
          bg="theme.surface"
          borderWidth="1px"
          borderColor="theme.border"
          borderRadius="lg"
          p={6}
        >
          <VStack align="stretch" gap={4}>
            <Text color="theme.text" lineHeight="tall">
              This is what you stand behind. Your go-bag. The distilled, portable
              archive of things that matter enough to commit to.
            </Text>
            <Text color="theme.textSecondary" lineHeight="tall">
              Puddlejump is intentionally small, intentionally portable, intentionally
              human-governed. Files here sync with your filesystem, can be versioned
              in git, and are always exportable. Nothing is trapped.
            </Text>
            <Box pt={2}>
              <Text color="theme.textSecondary" fontSize="sm" fontWeight="medium" mb={2}>
                Some people keep:
              </Text>
              <VStack align="stretch" gap={1} pl={4}>
                <Text color="theme.textSecondary" fontSize="sm">
                  &bull; Distilled notes from projects and collaborations
                </Text>
                <Text color="theme.textSecondary" fontSize="sm">
                  &bull; Decisions and their rationale
                </Text>
                <Text color="theme.textSecondary" fontSize="sm">
                  &bull; Personal glossaries and canonical definitions
                </Text>
                <Text color="theme.textSecondary" fontSize="sm">
                  &bull; Curated outputs from Mixtape&apos;s agents
                </Text>
              </VStack>
            </Box>
            <Text color="theme.textSecondary" fontSize="sm" fontStyle="italic" pt={2}>
              Nothing here yet? That&apos;s fine. When something matters enough to
              commit to, you&apos;ll know.
            </Text>
          </VStack>
        </Box>

        {/* Actions */}
        <HStack gap={3}>
          <Button size="sm" variant="outline">
            <HStack gap={2}>
              <ArrowUpTrayIcon style={{ width: 16, height: 16 }} />
              <span>Import Bundle</span>
            </HStack>
          </Button>
          <Button size="sm" variant="outline">
            <HStack gap={2}>
              <PlusIcon style={{ width: 16, height: 16 }} />
              <span>Add File</span>
            </HStack>
          </Button>
        </HStack>

        {/* Files Section */}
        <Box>
          {isLoading ? (
            <Box textAlign="center" py={12}>
              <Spinner size="lg" color="theme.accent" />
            </Box>
          ) : error ? (
            <Box
              borderWidth="1px"
              borderColor="red.300"
              borderRadius="lg"
              p={8}
              textAlign="center"
              bg="red.50"
            >
              <Text color="red.600">
                Failed to load Puddlejump: {error.message}
              </Text>
            </Box>
          ) : files.length === 0 && folders.length === 0 ? (
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
                <Text color="theme.textSecondary">
                  Your Puddlejump is empty
                </Text>
                <Text color="theme.textSecondary" fontSize="sm">
                  Import a bundle or add files to get started
                </Text>
              </VStack>
            </Box>
          ) : (
            <VStack align="stretch" gap={2}>
              {/* Folders */}
              {folders.map((folder) => (
                <Box
                  key={folder.id}
                  p={4}
                  borderWidth="1px"
                  borderColor="theme.border"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: 'theme.bgSecondary' }}
                >
                  <HStack gap={3}>
                    <FolderIcon style={{ width: 20, height: 20 }} />
                    <Text fontWeight="medium">{folder.title}</Text>
                  </HStack>
                </Box>
              ))}
              {/* Files */}
              {files.map((file) => (
                <Box
                  key={file.id}
                  p={4}
                  borderWidth="1px"
                  borderColor="theme.border"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: 'theme.bgSecondary' }}
                >
                  <HStack gap={3} justify="space-between">
                    <HStack gap={3}>
                      <DocumentTextIcon style={{ width: 20, height: 20 }} />
                      <Text>{file.filename || file.title || 'Untitled'}</Text>
                    </HStack>
                    {file.size_bytes && (
                      <Text fontSize="xs" color="theme.textSecondary">
                        {formatBytes(file.size_bytes)}
                      </Text>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {/* Sync Status */}
        <Box pt={4} borderTopWidth="1px" borderColor="theme.border">
          <HStack justify="space-between">
            <Text color="theme.textSecondary" fontSize="xs">
              {puddlejump?.file_count || 0} files &bull; {formatBytes(puddlejump?.total_size_bytes || 0)}
            </Text>
            <Text color="theme.textSecondary" fontSize="xs">
              Last synced: {puddlejump?.last_synced_at
                ? new Date(puddlejump.last_synced_at).toLocaleDateString()
                : 'never'}
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Container>
  );
}
