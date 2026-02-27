'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Box, Input, Text, Textarea } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import type { MindMapNode } from '@mixtape/core/types/mindmapTypes';

type NoteNodeData = {
  node: MindMapNode;
  onContentChange?: (nodeId: string, data: { title?: string; text?: string }) => void;
};

type NoteNodeType = Node<NoteNodeData, 'note'>;

export default function NoteNode({ data, selected }: NodeProps<NoteNodeType>) {
  const { node, onContentChange } = data;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(node.title ?? '');
  const [text, setText] = useState(node.text ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    selected ? 'blue.400' : 'gray.200',
    selected ? 'blue.400' : 'gray.600'
  );

  useEffect(() => {
    setTitle(node.title ?? '');
    setText(node.text ?? '');
  }, [node.title, node.text]);

  const debouncedSave = useCallback(
    (newTitle: string, newText: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onContentChange?.(node.id, { title: newTitle, text: newText });
      }, 500);
    },
    [node.id, onContentChange]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    debouncedSave(val, text);
  };

  const handleTextChange = (val: string) => {
    setText(val);
    debouncedSave(title, val);
  };

  const nodeStyle = node.style ?? {};
  const bgOverride = (nodeStyle.background as string) ?? bg;

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Box
        bg={bgOverride}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        p={3}
        minW="180px"
        maxW="320px"
        shadow={selected ? 'md' : 'sm'}
        onDoubleClick={() => setEditing(true)}
        cursor={editing ? 'text' : 'grab'}
      >
        {editing ? (
          <>
            <Input
              size="sm"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Title"
              mb={1}
              fontWeight="semibold"
              variant="flushed"
              autoFocus
            />
            <Textarea
              size="sm"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Notes..."
              rows={3}
              variant="flushed"
              onBlur={() => setEditing(false)}
            />
          </>
        ) : (
          <>
            {title && (
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                {title}
              </Text>
            )}
            <Text fontSize="xs" color="gray.500" whiteSpace="pre-wrap">
              {text || 'Double-click to edit'}
            </Text>
          </>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
