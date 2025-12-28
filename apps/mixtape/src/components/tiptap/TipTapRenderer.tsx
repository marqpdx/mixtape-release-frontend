// src/components/tiptap/TipTapRenderer.tsx

import {
  Box,
  Text,
  Heading,
  ListItem,
  Code,
  Image,
  Blockquote,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { JSX } from 'react'

interface TipTapRendererProps {
  content: any
}

export function TipTapRenderer({ content }: TipTapRendererProps) {
  const codeBlockBg = useColorModeValue('gray.100', 'gray.900')
  const blockquoteBg = useColorModeValue('gray.50', 'gray.800')
  const blockquoteBorderColor = useColorModeValue('gray.300', 'gray.600')

  if (!content?.content) {
    return null
  }

  const renderNode = (node: any, index: number): JSX.Element | null => {
    if (!node) return null

    switch (node.type) {
      case 'heading':
        const level = node.attrs?.level || 1
        const headingSizes: Record<number, '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'> = {
          1: '2xl',
          2: 'xl',
          3: 'lg',
          4: 'md',
          5: 'sm',
          6: 'xs',
        }
        return (
          <Heading
            key={index}
            size={headingSizes[level] || 'md'}
            mt={4}
            mb={2}
          >
            {renderContent(node.content)}
          </Heading>
        )

      case 'paragraph':
        return (
          <Text key={index} mb={4} lineHeight="1.8">
            {renderContent(node.content)}
          </Text>
        )

      case 'bulletList':
        return (
          <Box key={index} as="ul" mb={4} ml={4}>
            {node.content?.map((item: any, i: number) => (
              <ListItem key={i} mb={2}>
                {renderContent(item.content)}
              </ListItem>
            ))}
          </Box>
        )

      case 'orderedList':
        return (
          <Box key={index} as="ol" mb={4} ml={4}>
            {node.content?.map((item: any, i: number) => (
              <ListItem key={i} mb={2}>
                {renderContent(item.content)}
              </ListItem>
            ))}
          </Box>
        )

      case 'codeBlock':
        return (
          <Box
            key={index}
            bg={codeBlockBg}
            p={4}
            borderRadius="md"
            mb={4}
            overflow="auto"
            borderWidth="1px"
          >
            <Code whiteSpace="pre-wrap" fontFamily="mono">
              {node.content?.[0]?.text || ''}
            </Code>
          </Box>
        )

      case 'blockquote':
        return (
          <Blockquote.Root key={index} mb={4}>
            <Blockquote.Content
              bg={blockquoteBg}
              pl={4}
              py={2}
              borderLeftWidth="4px"
              borderLeftColor={blockquoteBorderColor}
            >
              {renderContent(node.content)}
            </Blockquote.Content>
          </Blockquote.Root>
        )

      case 'image':
        return (
          <Box key={index} mb={4} maxW="100%">
            <Image
              src={node.attrs?.src}
              alt={node.attrs?.alt || ''}
              maxW="100%"
              borderRadius="md"
            />
          </Box>
        )

      case 'horizontalRule':
        return <Box key={index} as="hr" my={4} />

      case 'hardBreak':
        return <Box key={index} mb={2} />

      default:
        return null
    }
  }

  const renderContent = (content: any[]): JSX.Element => {
    if (!content) return <></>

    return (
      <>
        {content.map((node: any, i: number) => {
          if (node.type === 'text') {
            let markup: any = {}

            // Apply marks (bold, italic, code, link, etc.)
            if (node.marks) {
              node.marks.forEach((mark: any) => {
                if (mark.type === 'bold') markup.fontWeight = 'bold'
                if (mark.type === 'italic') markup.fontStyle = 'italic'
                if (mark.type === 'code') {
                  markup.bg = useColorModeValue('gray.200', 'gray.700')
                  markup.px = 1
                  markup.borderRadius = 'sm'
                  markup.fontFamily = 'mono'
                  markup.fontSize = 'sm'
                }
                if (mark.type === 'link') {
                  markup.as = 'a'
                  markup.href = mark.attrs?.href
                  markup.target = '_blank'
                  markup.color = 'blue.500'
                  markup._hover = { textDecoration: 'underline' }
                }
                if (mark.type === 'strikethrough') markup.textDecoration = 'line-through'
                if (mark.type === 'underline') markup.textDecoration = 'underline'
              })
            }

            return (
              <Box key={i} as="span" {...markup}>
                {node.text}
              </Box>
            )
          }
          return null
        })}
      </>
    )
  }

  return (
    <Box className="tiptap-content">
      {content.content.map((node: any, index: number) => renderNode(node, index))}
    </Box>
  )
}