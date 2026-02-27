'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Box, Image, Text } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import type { MindMapNode } from '@mixtape/core/types/mindmapTypes';

type ImageNodeData = { node: MindMapNode };
type ImageNodeType = Node<ImageNodeData, 'image'>;

export default function ImageNode({ data, selected }: NodeProps<ImageNodeType>) {
  const { node } = data;
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    selected ? 'blue.400' : 'gray.200',
    selected ? 'blue.400' : 'gray.600'
  );

  // Find first image attachment
  const imageAtt = node.attachments?.find((a) => a.kind === 'image');
  const imageUrl = imageAtt?.url ?? node.primary_url;

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Box
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        overflow="hidden"
        minW="160px"
        maxW="320px"
        shadow={selected ? 'md' : 'sm'}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={node.title ?? ''}
            maxH="200px"
            w="full"
            objectFit="cover"
          />
        )}
        {node.title && (
          <Text fontSize="xs" fontWeight="medium" p={2}>
            {node.title}
          </Text>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
