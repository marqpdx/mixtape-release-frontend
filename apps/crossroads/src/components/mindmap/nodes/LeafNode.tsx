'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Box, Badge, Text } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconLeaf } from '@tabler/icons-react';
import type { MindMapNode } from '@mixtape/core/types/mindmapTypes';

type LeafNodeData = { node: MindMapNode };
type LeafNodeType = Node<LeafNodeData, 'leaf'>;

export default function LeafNode({ data, selected }: NodeProps<LeafNodeType>) {
  const { node } = data;
  const bg = useColorModeValue('green.50', 'green.900');
  const borderColor = useColorModeValue(
    selected ? 'green.500' : 'green.200',
    selected ? 'green.400' : 'green.700'
  );
  const labelColor = useColorModeValue('green.600', 'green.300');

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
        <Badge size="sm" variant="subtle" colorPalette="green" mb={1}>
          <IconLeaf size={12} style={{ display: 'inline', marginRight: 4 }} />
          Leaf
        </Badge>
        {node.title && (
          <Text fontSize="sm" fontWeight="semibold" mb={1}>
            {node.title}
          </Text>
        )}
        {node.text && (
          <Text fontSize="xs" color={labelColor} lineClamp={3}>
            {node.text}
          </Text>
        )}
        {!node.title && !node.text && (
          <Text fontSize="xs" color="gray.400">
            Leaf-backed node
          </Text>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
