import type { ReactNode } from "react";
import { Avatar, HStack, VStack, Text, Box, Button, Badge, Heading } from "@chakra-ui/react";
import Link from "next/link";
import { extractTextFromProseMirror, NoticeboardItem, timeAgo } from "@components/groups/writing/useNoticeboard";

type ProseMirrorNode = {
  type?: string;
  text?: string;
  content?: ProseMirrorNode[];
  attrs?: { level?: number };
};

type ProseMirrorDoc = {
  content?: ProseMirrorNode[];
};

export function NoticeCard({ item, groupSlug }: { item: NoticeboardItem; groupSlug: string }) {
  // Extract excerpt from piece data or body_json
  const excerpt = item.piece.excerpt || extractTextFromProseMirror(item.piece.body_json);

  return (
    <Box p={3} borderWidth="1px" borderRadius="md" _hover={{ bg: "gray.50" }}>
      <HStack mb={2} justify="space-between">
        <HStack>
          <Avatar.Root size="sm">
            <Avatar.Fallback>{item.author_name?.[0] ?? "M"}</Avatar.Fallback>
          </Avatar.Root>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" fontWeight="bold">
              {item.author_name || "Member"}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {timeAgo(item.created_at)}
              {item.visibility !== "public" ? ` · ${item.visibility}` : ""}
            </Text>
          </VStack>
        </HStack>
        <HStack gap={1}>
          {item.is_pinned && <Badge colorScheme="blue" size="sm">Pinned</Badge>}
          {item.piece.writing_kind === "announcement" && (
            <Badge colorScheme="orange" size="sm">Announcement</Badge>
          )}
        </HStack>
      </HStack>

      {item.piece.title && (
        <Text fontWeight="semibold" mb={1} fontSize="md">
          {item.piece.title}
        </Text>
      )}

      {excerpt && (
        <Text fontSize="sm" color="gray.700" lineClamp={3}>
          {excerpt}
        </Text>
      )}

      {/* Footer: engagement and read more */}
      <HStack mt={3} justify="space-between">
        <HStack gap={3} fontSize="xs" color="gray.600">
          {item.piece.comment_count > 0 && (
            <Text>{item.piece.comment_count} comments</Text>
          )}
          {item.piece.view_count > 0 && (
            <Text>{item.piece.view_count} views</Text>
          )}
        </HStack>
        <Button size="xs" variant="ghost">
          <Link href={`/groups/${groupSlug}/writing/${item.piece.id}`}>Read more</Link>
        </Button>
      </HStack>
    </Box>
  );
}



// Helper to render ProseMirror JSON as readable content
export function renderProseMirrorContent(bodyJson: ProseMirrorDoc | null): ReactNode {
  if (!bodyJson?.content) return <Text color="gray.500">No content available</Text>;

  const renderNode = (node: ProseMirrorNode, index: number): ReactNode => {
    switch (node.type) {
      case 'paragraph':
        const paragraphContent = node.content?.map((child: ProseMirrorNode, childIndex: number) => {
          if (child.type === 'text') {
            return child.text;
          }
          if (child.type === 'hardBreak') {
            return <br key={childIndex} />;
          }
          return null;
        });

        return (
          <Text key={index} mb={4} lineHeight="tall">
            {paragraphContent}
          </Text>
        );

      case 'heading':
        const headingContent = node.content?.map((child: ProseMirrorNode) => child.text).join('') || '';
        const level = node.attrs?.level || 1;

        return (
          <Heading key={index} size={level <= 2 ? 'lg' : 'md'} mb={3} mt={6}>
            {headingContent}
          </Heading>
        );

      case 'bulletList':
      case 'orderedList':
        const ListComponent = node.type === 'bulletList' ? 'ul' : 'ol';
        return (
          <Box key={index} as={ListComponent} pl={6} mb={4}>
            {node.content?.map((listItem: ProseMirrorNode, itemIndex: number) => (
              <Box as="li" key={itemIndex} mb={1}>
                {listItem.content?.map((para: ProseMirrorNode, paraIndex: number) =>
                  renderNode(para, paraIndex)
                )}
              </Box>
            ))}
          </Box>
        );

      default:
        // Fallback for unknown node types - extract text content
        const extractText = (n: ProseMirrorNode): string => {
          if (n.type === 'text') return n.text || '';
          if (n.content) return n.content.map(extractText).join('');
          return '';
        };

        const textContent = extractText(node);
        return textContent ? (
          <Text key={index} mb={2}>
            {textContent}
          </Text>
        ) : null;
    }
  };

  return (
    <Box>
      {bodyJson.content.map((node: ProseMirrorNode, index: number) => renderNode(node, index))}
    </Box>
  );
}
