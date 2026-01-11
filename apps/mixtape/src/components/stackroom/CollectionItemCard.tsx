// Collection Item Card - Handles both SourceFile and WritingPiece types

'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  Group,
} from '@chakra-ui/react';
import {
  IconFile,
  IconTrash,
  IconPencil,
  IconStar,
  IconStarFilled,
  IconGripVertical,
  IconFolder,
  IconChevronDown,
  IconChevronRight,
  IconLink,
} from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LibraryItem } from '@mixtape/core/types/collectionTypes';
import { getWritingKindInfo } from './utils/writingKindHelpers';
import { getFileTypeInfo } from './utils/fileTypeHelpers';
import { formatBytes } from '@/lib/formatBytes';
import { formatDistanceToNow } from 'date-fns';

interface CollectionItemCardProps {
  item: LibraryItem;
  onEdit?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
  onToggleFeatured?: (itemId: string) => void;
  onToggleExpand?: (itemId: string) => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
}

export function CollectionItemCard({
  item,
  onEdit,
  onRemove,
  onToggleFeatured,
  onToggleExpand,
  isExpanded = false,
  hasChildren = false,
}: CollectionItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Drag-and-drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Type-specific rendering
  const renderContent = () => {
    // Handle folder rendering
    if (item.is_folder) {
      return (
        <VStack align="start" gap={2} flex={1}>
          <HStack>
            {/* Expand/Collapse icon (only if folder has children) */}
            {hasChildren && onToggleExpand ? (
              <IconButton
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                size="xs"
                variant="ghost"
                onClick={() => onToggleExpand(item.id)}
              >
                {isExpanded ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
              </IconButton>
            ) : (
              <Box width="24px" /> // Spacer for alignment
            )}
            <Box color="var(--chakra-colors-blue-500)">
              <IconFolder size={20} />
            </Box>
            <Text fontWeight="medium" fontSize="md">
              📁 {item.title || 'Untitled Folder'}
            </Text>
          </HStack>
          {item.notes && (
            <Text fontSize="sm" color="gray.600" lineClamp={2}>
              {item.notes}
            </Text>
          )}
        </VStack>
      );
    }
    if (item.content_type === 'source_file') {
      const { content } = item;
      const fileTypeInfo = getFileTypeInfo(content.filename, content.content_type);
      const FileIcon = fileTypeInfo.icon;

      return (
        <VStack align="start" gap={2} flex={1}>
          <HStack>
            <Box color={`var(--chakra-colors-${fileTypeInfo.colorScheme}-500)`}>
              <FileIcon size={20} />
            </Box>
            <Text fontWeight="medium" fontSize="md">
              {content.filename}
            </Text>
          </HStack>
          <HStack gap={2} fontSize="sm" color="gray.600">
            <Badge colorPalette={fileTypeInfo.colorScheme} size="sm">
              {fileTypeInfo.label}
            </Badge>
            <Badge colorPalette="gray" size="sm">
              {formatBytes(content.size_bytes)}
            </Badge>
            <Badge colorPalette="blue" size="sm">
              {content.origin}
            </Badge>
            <Text fontSize="xs">
              Added {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
            </Text>
          </HStack>
        </VStack>
      );
    }

    if (item.content_type === 'writing_piece') {
      const { content } = item;
      const kindInfo = getWritingKindInfo(content.writing_kind);
      const KindIcon = kindInfo.icon;

      return (
        <VStack align="start" gap={2} flex={1}>
          <HStack>
            <Box color="gray.500">
              <KindIcon size={20} />
            </Box>
            <Text fontWeight="medium" fontSize="md">
              {content.title}
            </Text>
          </HStack>
          {content.summary && (
            <Text fontSize="sm" color="gray.600" lineClamp={2}>
              {content.summary}
            </Text>
          )}
          <HStack gap={2} fontSize="sm">
            <Badge colorPalette={kindInfo.colorScheme} size="sm">
              {kindInfo.emoji} {kindInfo.label}
            </Badge>
            {content.author_name && (
              <Text fontSize="xs" color="gray.600">
                by {content.author_name}
              </Text>
            )}
            {content.published_at && (
              <Text fontSize="xs" color="gray.600">
                {formatDistanceToNow(new Date(content.published_at), { addSuffix: true })}
              </Text>
            )}
          </HStack>
        </VStack>
      );
    }

    // Handle linked collection rendering
    if (item.content_type === 'collection') {
      const { content } = item;

      return (
        <VStack align="start" gap={2} flex={1}>
          <HStack>
            <Box color="var(--chakra-colors-blue-500)">
              <IconLink size={20} />
            </Box>
            <Box color="var(--chakra-colors-blue-500)">
              <IconFolder size={20} />
            </Box>
            <Text fontWeight="medium" fontSize="md">
              🔗 {content.title}
            </Text>
            <Badge colorPalette="blue" size="sm">
              Linked
            </Badge>
          </HStack>
          {content.summary && (
            <Text fontSize="sm" color="gray.600" lineClamp={2}>
              {content.summary}
            </Text>
          )}
          <HStack gap={2} fontSize="sm" color="gray.600">
            <HStack gap={1}>
              <IconFile size={16} />
              <Text fontWeight="medium">{content.item_count}</Text>
              <Text>items</Text>
            </HStack>
            <Badge colorPalette="gray" size="sm">
              {content.sponsor_type}
            </Badge>
            <Text fontSize="xs">
              Linked {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
            </Text>
          </HStack>
          <Box bg="blue.50" p={2} borderRadius="md" fontSize="xs" color="blue.700" width="full">
            <Text>
              ✨ This collection is linked. Changes to the source collection will appear here automatically.
            </Text>
          </Box>
        </VStack>
      );
    }

    return null;
  };

  return (
    <Card.Root
      ref={setNodeRef}
      style={style}
      size="sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      borderWidth={item.is_featured ? '2px' : '1px'}
      borderColor={item.is_featured ? 'yellow.400' : 'gray.200'}
      bg={item.is_hidden ? 'gray.50' : 'white'}
    >
      <Card.Body>
        <HStack justify="space-between" align="start" gap={2}>
          {/* Drag Handle */}
          <Box
            {...attributes}
            {...listeners}
            cursor="grab"
            color="gray.400"
            _hover={{ color: 'gray.600' }}
            _active={{ cursor: 'grabbing' }}
            py={1}
          >
            <IconGripVertical size={20} />
          </Box>

          {renderContent()}

          {/* Actions */}
          <Group gap={1} opacity={isHovered ? 1 : 0} transition="opacity 0.2s">
            {onToggleFeatured && (
              <IconButton
                aria-label="Toggle featured"
                size="sm"
                variant="ghost"
                onClick={() => onToggleFeatured(item.id)}
              >
                {item.is_featured ? (
                  <Box color="yellow.500">
                    <IconStarFilled size={20} />
                  </Box>
                ) : (
                  <IconStar size={20} />
                )}
              </IconButton>
            )}
            {onEdit && (
              <IconButton
                aria-label="Edit item"
                size="sm"
                variant="ghost"
                onClick={() => onEdit(item.id)}
              >
                <IconPencil size={20} />
              </IconButton>
            )}
            {onRemove && (
              <IconButton
                aria-label="Remove from collection"
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => onRemove(item.id)}
              >
                <IconTrash size={20} />
              </IconButton>
            )}
          </Group>
        </HStack>

        {/* Tags and Notes */}
        {(item.tags.length > 0 || item.notes || item.folder_path) && (
          <VStack align="start" mt={3} gap={1}>
            {item.folder_path && (
              <Text fontSize="xs" color="gray.500">
                📁 {item.folder_path}
              </Text>
            )}
            {item.tags.length > 0 && (
              <HStack gap={1} flexWrap="wrap">
                {item.tags.map((tag) => (
                  <Badge key={tag} size="xs" colorPalette="purple">
                    {tag}
                  </Badge>
                ))}
              </HStack>
            )}
            {item.notes && (
              <Text fontSize="xs" color="gray.600" fontStyle="italic">
                {item.notes}
              </Text>
            )}
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}
