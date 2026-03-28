// @mixtape/content - TipTapRenderer
// Read-only renderer for TipTap/ProseMirror body_json documents.
// Shared across crossroads and workbench apps.

import {
  Box,
  Text,
  Heading,
  Code,
  Image,
  Blockquote,
  HStack,
} from '@chakra-ui/react'
import { useColorModeValue } from '@mixtape/core'
import { JSX, useRef, useEffect } from 'react'

// --- Types (exported for consumers) ---

export interface TipTapMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface TipTapTextNode {
  type: 'text'
  text: string
  marks?: TipTapMark[]
}

export interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: (TipTapNode | TipTapTextNode)[]
  text?: string
  marks?: TipTapMark[]
}

export interface TipTapDocument {
  type: 'doc'
  content?: TipTapNode[]
}

export interface TipTapRenderIssue {
  kind: 'unknown_node' | 'unknown_mark' | 'render_error'
  detail: string
}

interface TipTapRendererProps {
  content: TipTapDocument
  /** Show inline fallback badges and a summary banner for unknown/failed nodes. */
  showNodeWarnings?: boolean
  /** Called after render with any issues found. Useful for import previews to surface counts. */
  onRenderIssues?: (issues: TipTapRenderIssue[]) => void
}

export function TipTapRenderer({ content, showNodeWarnings = false, onRenderIssues }: TipTapRendererProps) {
  const codeBlockBg = useColorModeValue('gray.100', 'gray.900')
  const blockquoteBg = useColorModeValue('gray.50', 'gray.800')
  const blockquoteBorderColor = useColorModeValue('gray.300', 'gray.600')
  const inlineCodeBg = useColorModeValue('gray.200', 'gray.700')
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600')
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.800')
  const warningBg = useColorModeValue('orange.50', 'orange.900')
  const warningBorderColor = useColorModeValue('orange.300', 'orange.600')
  const warningTextColor = useColorModeValue('orange.800', 'orange.200')

  // Collect issues during the render pass (mutable, not state — intentional).
  const issuesRef = useRef<TipTapRenderIssue[]>([])
  issuesRef.current = []

  const recordIssue = (issue: TipTapRenderIssue) => {
    issuesRef.current.push(issue)
  }

  useEffect(() => {
    if (onRenderIssues && issuesRef.current.length > 0) {
      onRenderIssues([...issuesRef.current])
    }
  })

  if (!content?.content) {
    return null
  }

  const headingSizes: Record<number, 'xl' | 'lg' | 'md' | 'sm' | 'xs'> = {
    1: 'xl', 2: 'lg', 3: 'md', 4: 'sm', 5: 'xs', 6: 'xs',
  }

  const UnknownNodeBadge = ({ nodeType }: { nodeType: string }) => (
    <Box
      as="span"
      display="inline-block"
      px={1}
      py={0}
      borderRadius="sm"
      fontSize="xs"
      fontFamily="mono"
      bg={warningBg}
      color={warningTextColor}
      borderWidth="1px"
      borderColor={warningBorderColor}
      title={`Unsupported node type: ${nodeType}`}
    >
      [{nodeType}]
    </Box>
  )

  const renderTextNode = (node: TipTapTextNode, key: number): JSX.Element => {
    const linkMark = node.marks?.find((m) => m.type === 'link')
    const styleProps: Record<string, unknown> = {}

    node.marks?.forEach((mark) => {
      if (mark.type === 'bold') styleProps.fontWeight = 'bold'
      else if (mark.type === 'italic') styleProps.fontStyle = 'italic'
      else if (mark.type === 'code') {
        styleProps.bg = inlineCodeBg
        styleProps.px = 1
        styleProps.borderRadius = 'sm'
        styleProps.fontFamily = 'mono'
        styleProps.fontSize = 'sm'
      }
      else if (mark.type === 'strike' || mark.type === 'strikethrough') styleProps.textDecoration = 'line-through'
      else if (mark.type === 'underline') styleProps.textDecoration = 'underline'
      else if (mark.type !== 'link') {
        // Unknown mark — record but don't crash
        recordIssue({ kind: 'unknown_mark', detail: mark.type })
      }
    })

    const inner = <Box as="span" {...styleProps}>{node.text}</Box>

    if (linkMark) {
      return (
        <a
          key={key}
          href={linkMark.attrs?.href as string}
          target={linkMark.attrs?.target as string || '_blank'}
          rel="noopener noreferrer"
          style={{ color: 'var(--chakra-colors-blue-500)', textDecoration: 'underline' }}
        >
          {inner}
        </a>
      )
    }

    return <Box key={key} as="span" {...styleProps}>{node.text}</Box>
  }

  const renderContent = (nodes?: (TipTapNode | TipTapTextNode)[]): JSX.Element => {
    if (!nodes) return <></>
    return (
      <>
        {nodes.map((node, i) => {
          if (node.type === 'text') return renderTextNode(node as TipTapTextNode, i)
          if (node.type === 'hardBreak') return <br key={i} />
          if (node.type === 'paragraph') return renderContent((node as TipTapNode).content)
          return renderNode(node as TipTapNode, i)
        })}
      </>
    )
  }

  const renderListItemContent = (item: TipTapNode): JSX.Element => {
    const children = item.content || []
    return (
      <>
        {children.map((child, i) => {
          const node = child as TipTapNode
          if (node.type === 'paragraph') return <span key={i}>{renderContent(node.content)}</span>
          if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
            return renderNode(node, i)
          }
          if (child.type === 'text') return renderTextNode(child as TipTapTextNode, i)
          return null
        })}
      </>
    )
  }

  const renderNode = (node: TipTapNode, index: number): JSX.Element | null => {
    if (!node) return null

    try {
      switch (node.type) {
        case 'heading': {
          const level = (node.attrs?.level as number) || 2
          return (
            <Heading key={index} size={headingSizes[level] ?? 'md'} mt={6} mb={2}>
              {renderContent(node.content)}
            </Heading>
          )
        }

        case 'paragraph':
          return (
            <Text key={index} mb={4} lineHeight="1.8">
              {renderContent(node.content)}
            </Text>
          )

        case 'bulletList':
          return (
            <Box key={index} as="ul" mb={4} ml={5} listStyleType="disc">
              {node.content?.map((item, i) => (
                <Box key={i} as="li" mb={1}>
                  {renderListItemContent(item as TipTapNode)}
                </Box>
              ))}
            </Box>
          )

        case 'orderedList':
          return (
            <Box key={index} as="ol" mb={4} ml={5} listStyleType="decimal">
              {node.content?.map((item, i) => (
                <Box key={i} as="li" mb={1}>
                  {renderListItemContent(item as TipTapNode)}
                </Box>
              ))}
            </Box>
          )

        case 'taskList':
          return (
            <Box key={index} as="ul" mb={4} ml={2} listStyleType="none">
              {node.content?.map((item, i) => {
                const taskNode = item as TipTapNode
                const checked = Boolean(taskNode.attrs?.checked)
                return (
                  <Box key={i} as="li" mb={1} display="flex" alignItems="flex-start" gap={2}>
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      style={{ marginTop: '3px', flexShrink: 0 }}
                    />
                    <Box opacity={checked ? 0.5 : 1} textDecoration={checked ? 'line-through' : 'none'}>
                      {renderListItemContent(taskNode)}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )

        case 'codeBlock':
          return (
            <Box key={index} bg={codeBlockBg} p={4} borderRadius="md" mb={4} overflow="auto" borderWidth="1px">
              <Code whiteSpace="pre-wrap" fontFamily="mono" fontSize="sm">
                {(node.content?.[0] as TipTapTextNode)?.text || ''}
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
                src={node.attrs?.src as string}
                alt={(node.attrs?.alt as string) || ''}
                maxW="100%"
                borderRadius="md"
              />
            </Box>
          )

        case 'horizontalRule':
          return <Box key={index} as="hr" my={6} borderColor={tableBorderColor} />

        case 'hardBreak':
          return <br key={index} />

        case 'table':
          return (
            <Box key={index} mb={6} overflowX="auto">
              <Box
                as="table"
                w="full"
                borderCollapse="collapse"
                fontSize="sm"
                borderWidth="1px"
                borderColor={tableBorderColor}
              >
                <Box as="tbody">
                  {node.content?.map((row, i) => renderNode(row as TipTapNode, i))}
                </Box>
              </Box>
            </Box>
          )

        case 'tableRow':
          return (
            <Box key={index} as="tr">
              {node.content?.map((cell, i) => renderNode(cell as TipTapNode, i))}
            </Box>
          )

        case 'tableHeader':
          return (
            <Box
              key={index}
              as="th"
              px={3}
              py={2}
              bg={tableHeaderBg}
              borderWidth="1px"
              borderColor={tableBorderColor}
              textAlign="left"
              fontWeight="semibold"
            >
              {renderContent(node.content)}
            </Box>
          )

        case 'tableCell':
          return (
            <Box
              key={index}
              as="td"
              px={3}
              py={2}
              borderWidth="1px"
              borderColor={tableBorderColor}
              verticalAlign="top"
            >
              {renderContent(node.content)}
            </Box>
          )

        default: {
          recordIssue({ kind: 'unknown_node', detail: node.type })
          if (showNodeWarnings) {
            return (
              <Box key={index} display="inline-block" mb={2}>
                <UnknownNodeBadge nodeType={node.type} />
              </Box>
            )
          }
          return null
        }
      }
    } catch (err) {
      const detail = `${node.type}: ${err instanceof Error ? err.message : String(err)}`
      recordIssue({ kind: 'render_error', detail })
      if (showNodeWarnings) {
        return (
          <Box
            key={index}
            p={2}
            mb={2}
            borderRadius="sm"
            bg={warningBg}
            borderWidth="1px"
            borderColor={warningBorderColor}
          >
            <Text fontSize="xs" fontFamily="mono" color={warningTextColor}>
              render error: {detail}
            </Text>
          </Box>
        )
      }
      return null
    }
  }

  const rendered = content.content.map((node, index) => renderNode(node, index))

  // Deduplicate issues for the summary banner
  const unknownNodeTypes = [...new Set(
    issuesRef.current.filter((i) => i.kind === 'unknown_node').map((i) => i.detail)
  )]
  const unknownMarkTypes = [...new Set(
    issuesRef.current.filter((i) => i.kind === 'unknown_mark').map((i) => i.detail)
  )]
  const renderErrors = issuesRef.current.filter((i) => i.kind === 'render_error')

  const hasIssues = issuesRef.current.length > 0

  return (
    <Box className="tiptap-content">
      {rendered}
      {showNodeWarnings && hasIssues && (
        <Box
          mt={6}
          p={3}
          borderRadius="md"
          bg={warningBg}
          borderWidth="1px"
          borderColor={warningBorderColor}
        >
          <Text fontSize="xs" fontWeight="semibold" color={warningTextColor} mb={1}>
            Render warnings — some content may not display correctly
          </Text>
          {unknownNodeTypes.length > 0 && (
            <HStack gap={1} flexWrap="wrap" mb={1}>
              <Text fontSize="xs" color={warningTextColor}>Unknown nodes:</Text>
              {unknownNodeTypes.map((t) => (
                <Box
                  key={t}
                  as="span"
                  px={1}
                  borderRadius="sm"
                  fontSize="xs"
                  fontFamily="mono"
                  bg={warningBorderColor}
                  color={warningTextColor}
                >
                  {t}
                </Box>
              ))}
            </HStack>
          )}
          {unknownMarkTypes.length > 0 && (
            <HStack gap={1} flexWrap="wrap" mb={1}>
              <Text fontSize="xs" color={warningTextColor}>Unknown marks:</Text>
              {unknownMarkTypes.map((t) => (
                <Box
                  key={t}
                  as="span"
                  px={1}
                  borderRadius="sm"
                  fontSize="xs"
                  fontFamily="mono"
                  bg={warningBorderColor}
                  color={warningTextColor}
                >
                  {t}
                </Box>
              ))}
            </HStack>
          )}
          {renderErrors.length > 0 && (
            <Text fontSize="xs" color={warningTextColor}>
              {renderErrors.length} node{renderErrors.length > 1 ? 's' : ''} failed to render.
            </Text>
          )}
        </Box>
      )}
    </Box>
  )
}
