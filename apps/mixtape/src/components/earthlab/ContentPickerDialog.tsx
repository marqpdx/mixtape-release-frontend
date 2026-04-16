// apps/mixtape/src/components/earthlab/ContentPickerDialog.tsx

'use client';

import { useState } from 'react';
import { Box, VStack, HStack, Text, Button, Input, Badge } from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
  DialogBackdrop,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { fetchAvailableContent } from '@mixtape/api/clients/earthlab/earthlabApi';

interface ContentPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupSlug: string;
  existingContentIds: Set<string>;
  onAdd: (contentType: string, contentId: string) => void;
}

export function ContentPickerDialog({
  isOpen,
  onClose,
  groupSlug,
  existingContentIds,
  onAdd,
}: ContentPickerDialogProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['earthlab', 'available-content', groupSlug],
    queryFn: () => fetchAvailableContent(groupSlug),
    enabled: isOpen,
  });

  const filterText = search.toLowerCase();

  const filteredLessons = (data?.lessons || []).filter(
    (l) => l.title.toLowerCase().includes(filterText) && !existingContentIds.has(l.id)
  );

  const filteredCollections = (data?.collections || []).filter(
    (collection) => collection.title.toLowerCase().includes(filterText) && !existingContentIds.has(collection.id)
  );

  const handleAdd = (contentType: string, contentId: string) => {
    onAdd(contentType, contentId);
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Course Outline</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch" gap={4}>
            <Input
              placeholder="Search lessons and modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="sm"
            />

            {isLoading && <Text color="gray.500" fontSize="sm">Loading...</Text>}

            {filteredLessons.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>Lessons</Text>
                <VStack align="stretch" gap={1}>
                  {filteredLessons.map((lesson) => (
                    <HStack
                      key={lesson.id}
                      p={2}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      justify="space-between"
                      _hover={{ bg: 'gray.50' }}
                    >
                      <HStack gap={2}>
                        <Badge colorScheme="blue" size="sm">Lesson</Badge>
                        <Text fontSize="sm">{lesson.title}</Text>
                      </HStack>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleAdd('lesson', lesson.id)}
                      >
                        Add
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {filteredCollections.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>Modules (Collections)</Text>
                <VStack align="stretch" gap={1}>
                  {filteredCollections.map((collection) => (
                    <HStack
                      key={collection.id}
                      p={2}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      justify="space-between"
                      _hover={{ bg: 'gray.50' }}
                    >
                      <HStack gap={2}>
                        <Badge colorScheme="purple" size="sm">Module</Badge>
                        <Text fontSize="sm">{collection.title}</Text>
                        {collection.scope && (
                          <Text fontSize="xs" color="gray.500">({collection.scope})</Text>
                        )}
                      </HStack>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleAdd('collection', collection.id)}
                      >
                        Add
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {!isLoading && filteredLessons.length === 0 && filteredCollections.length === 0 && (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                {search ? 'No matching content found' : 'No available content to add'}
              </Text>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} size="sm">Close</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
