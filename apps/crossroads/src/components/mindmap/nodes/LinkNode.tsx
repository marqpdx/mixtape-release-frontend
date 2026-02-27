'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconLink } from '@tabler/icons-react';
import type { MindMapNode } from '@mixtape/core/types/mindmapTypes';

type LinkNodeData = { node: MindMapNode };
type LinkNodeType = Node<LinkNodeData, 'link'>;

export default function LinkNode({ data, selected }: NodeProps<LinkNodeType>) {
  const { node } = data;
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    selected ? 'blue.400' : 'gray.200',
    selected ? 'blue.400' : 'gray.600'
  );
  const urlColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Box
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        p={3}
        minW="180px"
        maxW="320px"
        shadow={selected ? 'md' : 'sm'}
      >
        {node.title && (
          <Text fontSize="sm" fontWeight="semibold" mb={1}>
            {node.title}
          </Text>
        )}
        {node.primary_url && (
          <HStack gap={1}>
            <IconLink size={14} />
            <Text fontSize="xs" color={urlColor} lineClamp={1}>
              {node.primary_url}
            </Text>
          </HStack>
        )}
        {node.text && (
          <Text fontSize="xs" color="gray.500" mt={1} lineClamp={2}>
            {node.text}
          </Text>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
