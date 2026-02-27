'use client';

import { useCallback, useState } from 'react';
import { Box, Button, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import {
  IconNote,
  IconLink,
  IconPhoto,
  IconLeaf,
  IconQuestionMark,
} from '@tabler/icons-react';
import { useReactFlow } from '@xyflow/react';
import type { NodeCreateData } from '@mixtape/core/types/mindmapTypes';

interface MindMapToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onAddNode: (data: NodeCreateData) => void;
}

export default function MindMapToolbar({
  title,
  onTitleChange,
  onAddNode,
}: MindMapToolbarProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [showHelp, setShowHelp] = useState(false);
  const { getViewport } = useReactFlow();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getCenterPosition = useCallback(() => {
    const vp = getViewport();
    // Place node at center of current viewport
    return {
      x: (-vp.x + window.innerWidth / 2) / vp.zoom,
      y: (-vp.y + window.innerHeight / 2) / vp.zoom,
    };
  }, [getViewport]);

  const handleAddNote = () => {
    const pos = getCenterPosition();
    onAddNode({
      node_type: 'note',
      pos_x: pos.x,
      pos_y: pos.y,
      backing_kind: 'inline',
      title: '',
      text: '',
    });
  };

  const handleAddLink = () => {
    const url = window.prompt('Enter URL:');
    if (!url) return;
    const pos = getCenterPosition();
    onAddNode({
      node_type: 'link',
      pos_x: pos.x,
      pos_y: pos.y,
      backing_kind: 'inline',
      primary_url: url,
      title: url,
    });
  };

  const handleAddImage = () => {
    const url = window.prompt('Enter image URL:');
    if (!url) return;
    const pos = getCenterPosition();
    onAddNode({
      node_type: 'image',
      pos_x: pos.x,
      pos_y: pos.y,
      backing_kind: 'inline',
      primary_url: url,
    });
  };

  const handleAddLeaf = () => {
    const leafId = window.prompt('Enter Leaf ID:');
    if (!leafId) return;
    const pos = getCenterPosition();
    onAddNode({
      node_type: 'leaf',
      pos_x: pos.x,
      pos_y: pos.y,
      backing_kind: 'leaf',
      leaf: leafId,
    });
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (titleDraft.trim() !== title) {
      onTitleChange(titleDraft.trim());
    }
  };

  const helpBg = useColorModeValue('blue.50', 'blue.900');
  const helpColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Box
      px={4}
      py={2}
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      zIndex={10}
    >
      <HStack justify="space-between">
        <Box flex={1}>
          {editingTitle ? (
            <Input
              size="sm"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleBlur();
              }}
              autoFocus
              maxW="300px"
              fontWeight="semibold"
            />
          ) : (
            <Text
              fontWeight="semibold"
              cursor="pointer"
              onClick={() => {
                setTitleDraft(title);
                setEditingTitle(true);
              }}
            >
              {title || 'Untitled'}
            </Text>
          )}
        </Box>

        <HStack gap={1}>
          <Button size="xs" variant="ghost" onClick={handleAddNote} title="Add Note">
            <IconNote size={16} />
          </Button>
          <Button size="xs" variant="ghost" onClick={handleAddLink} title="Add Link">
            <IconLink size={16} />
          </Button>
          <Button size="xs" variant="ghost" onClick={handleAddImage} title="Add Image">
            <IconPhoto size={16} />
          </Button>
          <Button size="xs" variant="ghost" onClick={handleAddLeaf} title="Link Leaf">
            <IconLeaf size={16} />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setShowHelp((v) => !v)}
            title="Help"
          >
            <IconQuestionMark size={16} />
          </Button>
        </HStack>
      </HStack>

      {showHelp && (
        <Box mt={2} p={3} bg={helpBg} borderRadius="md" fontSize="xs" color={helpColor}>
          <VStack align="start" gap={1}>
            <Text fontWeight="semibold" fontSize="sm">How Mind Maps Work</Text>
            <Text><strong>Add Note</strong> — Creates a text node. Double-click to edit title and notes.</Text>
            <Text><strong>Add Link</strong> — Creates a URL card. Enter a web address when prompted.</Text>
            <Text><strong>Add Image</strong> — Creates an image node from a URL.</Text>
            <Text><strong>Link Leaf</strong> — Attaches an existing Leaf (from your Storyline) by its ID.</Text>
            <Text mt={1} fontWeight="semibold">Canvas controls:</Text>
            <Text>Drag nodes to reposition. Connect nodes by dragging from one handle to another.</Text>
            <Text>Select a node or edge and press Delete/Backspace to remove it.</Text>
            <Text>Click the title above to rename your mind map.</Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
