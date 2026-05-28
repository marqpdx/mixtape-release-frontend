'use client';

import {
  Box,
  Button,
  HStack,
  Spinner,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { IconArrowLeft, IconDownload, IconExternalLink } from '@tabler/icons-react';
import type { LibraryItem } from '@mixtape/core/types/collectionTypes';
import { useSourceFileContent } from '@mixtape/api/hooks';
import { buildApiUrl } from '@mixtape/api/lib/axiosInstance';
import { useWritingPiece } from '@mixtape/api/hooks/useWriting';
import { TipTapRenderer } from '@components/tiptap/TipTapRenderer';
import type { TipTapDocument } from '@components/tiptap/TipTapRenderer';
import { PdfDocumentViewer } from './PdfDocumentViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CollectionItemReaderProps {
  item: LibraryItem;
  onBack: () => void;
  groupSlug?: string;
}

type SourceFileLikeContent = {
  id?: string;
  filename?: string;
} | null;

function getSourceFileContent(item: LibraryItem): SourceFileLikeContent {
  return ((item as { content?: SourceFileLikeContent }).content ?? null);
}

function getSourceFileTitle(item: LibraryItem) {
  return 'title' in item ? item.title : '';
}

function getDisplayName(item: LibraryItem) {
  if (item.content_type === 'writing_piece') {
    return item.content.title;
  }

  return getSourceFileContent(item)?.filename || getSourceFileTitle(item) || 'Untitled file';
}

function getFilenameExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isMarkdownLike(filename: string) {
  const ext = getFilenameExtension(filename);
  return ['md', 'markdown', 'txt', 'text'].includes(ext);
}

function isPdf(filename: string) {
  return getFilenameExtension(filename) === 'pdf';
}

function isWordDoc(filename: string) {
  const ext = getFilenameExtension(filename);
  return ext === 'doc' || ext === 'docx';
}

function SourceFileReader({ item, onBack }: { item: LibraryItem; onBack: () => void }) {
  const sourceFileId = getSourceFileContent(item)?.id || null;
  const filename = getDisplayName(item);
  const { text, ingestionStatus, isLoading, error } = useSourceFileContent(sourceFileId);
  const originalUrl = sourceFileId
    ? buildApiUrl(`/api/stackroom/source-files/${sourceFileId}/download`)
    : '';
  const previewUrl = sourceFileId
    ? `/api/stackroom/source-files/${sourceFileId}/preview.pdf`
    : '';

  const markdownLike = isMarkdownLike(filename);
  const pdfFile = isPdf(filename);
  const wordDoc = isWordDoc(filename);
  const previewableDocument = pdfFile || wordDoc;

  return (
    <VStack align="stretch" gap={0}>
      <Box pb={5}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            color="theme.textSecondary"
            px={0}
            _hover={{ color: 'theme.text' }}
          >
            <IconArrowLeft size={14} />
            <Text ml={1} fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase">
              Back to collection
            </Text>
          </Button>

          {sourceFileId && (
            <HStack gap={2}>
              <Box asChild>
                <a href={originalUrl} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm" color="theme.textSecondary" _hover={{ color: 'theme.text' }}>
                    <IconExternalLink size={14} />
                    <Text ml={1}>Open original</Text>
                  </Button>
                </a>
              </Box>
              <Box asChild>
                <a href={originalUrl} download>
                  <Button variant="ghost" size="sm" color="theme.textSecondary" _hover={{ color: 'theme.text' }}>
                    <IconDownload size={14} />
                    <Text ml={1}>Download original</Text>
                  </Button>
                </a>
              </Box>
            </HStack>
          )}
        </HStack>
      </Box>

      <Box pb={6} mb={6} borderBottom="1px solid" borderColor="theme.border">
        <Text fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1" letterSpacing="-0.02em" color="theme.text" mb={3}>
          {filename}
        </Text>
        <HStack gap={2} flexWrap="wrap">
          <Badge colorPalette="blue" variant="subtle">
            {markdownLike ? 'Markdown' : pdfFile ? 'PDF' : wordDoc ? 'Word document' : 'Document'}
          </Badge>
          {pdfFile && (
            <Badge colorPalette="gray" variant="outline">
              Original PDF
            </Badge>
          )}
          {wordDoc && (
            <Badge colorPalette="gray" variant="outline">
              PDF preview
            </Badge>
          )}
          {ingestionStatus && ingestionStatus !== 'complete' && (
            <Badge colorPalette={ingestionStatus === 'failed' ? 'red' : 'yellow'} variant="subtle">
              {ingestionStatus}
            </Badge>
          )}
        </HStack>
      </Box>

      {previewableDocument && sourceFileId ? (
        <Box maxW="960px">
          <PdfDocumentViewer
            filename={filename}
            sourceFileId={sourceFileId}
            downloadUrl={wordDoc ? previewUrl : undefined}
          />
        </Box>
      ) : isLoading ? (
        <Box py={16} textAlign="center">
          <Spinner size="lg" color="theme.accent" />
          <Text mt={4} color="theme.textSecondary">Loading document…</Text>
        </Box>
      ) : error ? (
        <Box py={12}>
          <Text color="red.500" mb={3}>This document could not be loaded.</Text>
          <Text color="theme.textSecondary" fontSize="sm">
            {error.message}
          </Text>
        </Box>
      ) : ingestionStatus && ingestionStatus !== 'complete' ? (
        <Box py={12}>
          <Text color="theme.text" mb={3}>
            {ingestionStatus === 'unsupported'
              ? 'Readable text is not available for this file type.'
              : ingestionStatus === 'failed'
              ? 'Readable text could not be extracted from this file.'
              : 'Readable text is still being prepared.'}
          </Text>
          <Text color="theme.textSecondary" fontSize="sm">
            The original file is still available from the actions above.
          </Text>
        </Box>
      ) : (
        <Box
          maxW="860px"
          fontSize="md"
          lineHeight="1.85"
          color="theme.text"
          css={{
            '& p + p': { marginTop: '1.15em' },
            '& ul, & ol': { paddingLeft: '1.5rem', marginTop: '1rem' },
            '& li + li': { marginTop: '0.35rem' },
            '& h1, & h2, & h3': { marginTop: '1.5rem', marginBottom: '0.75rem' },
            '& blockquote': {
              borderLeft: '3px solid var(--chakra-colors-border-muted, #d7d7d7)',
              paddingLeft: '1rem',
              color: 'inherit',
              opacity: 0.9,
            },
            '& code': {
              background: 'rgba(127,127,127,0.08)',
              padding: '0.1rem 0.3rem',
              borderRadius: '4px',
            },
            '& pre': {
              background: 'rgba(127,127,127,0.08)',
              padding: '1rem',
              borderRadius: '8px',
              overflowX: 'auto',
            },
          }}
        >
          {markdownLike ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            <>
              {wordDoc && (
                <Text mb={6} color="theme.textSecondary" fontStyle="italic">
                  This inline view is showing extracted readable text from the uploaded file.
                </Text>
              )}
              <Text whiteSpace="pre-wrap">{text}</Text>
            </>
          )}
        </Box>
      )}
    </VStack>
  );
}

function WritingPieceReader({
  pieceSlug,
  groupSlug,
  onBack,
}: {
  pieceSlug: string;
  groupSlug?: string;
  onBack: () => void;
}) {
  const { piece, isLoading, error } = useWritingPiece(pieceSlug);

  return (
    <VStack align="stretch" gap={0}>
      <Box pb={5}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            color="theme.textSecondary"
            px={0}
            _hover={{ color: 'theme.text' }}
          >
            <IconArrowLeft size={14} />
            <Text ml={1} fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase">
              Back to collection
            </Text>
          </Button>

          {groupSlug && pieceSlug && (
            <Box asChild>
              <a href={`/groups/${groupSlug}/writing/${pieceSlug}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  color="theme.textSecondary"
                  _hover={{ color: 'theme.text' }}
                >
                  <IconExternalLink size={14} />
                  <Text ml={1}>Open full page</Text>
                </Button>
              </a>
            </Box>
          )}
        </HStack>
      </Box>

      {isLoading ? (
        <Box py={16} textAlign="center">
          <Spinner size="lg" color="theme.accent" />
          <Text mt={4} color="theme.textSecondary">Loading writing…</Text>
        </Box>
      ) : error || !piece ? (
        <Box py={12}>
          <Text color="red.500" mb={3}>This writing piece could not be loaded.</Text>
          {error?.message && (
            <Text color="theme.textSecondary" fontSize="sm">{error.message}</Text>
          )}
        </Box>
      ) : (
        <>
          <Box pb={6} mb={6} borderBottom="1px solid" borderColor="theme.border">
            <Text fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1" letterSpacing="-0.02em" color="theme.text" mb={3}>
              {piece.title}
            </Text>
            {piece.excerpt && (
              <Text fontFamily="serifBody" fontSize={{ base: 'md', md: 'lg' }} fontStyle="italic" color="theme.textSecondary" maxW="760px">
                {piece.excerpt}
              </Text>
            )}
          </Box>

          <Box
            maxW="760px"
            fontSize="md"
            lineHeight="1.85"
            css={{
              '& p + p': { marginTop: '1.25em' },
            }}
          >
            <TipTapRenderer content={piece.body_json as TipTapDocument} />
          </Box>
        </>
      )}
    </VStack>
  );
}

export function CollectionItemReader({
  item,
  onBack,
  groupSlug,
}: CollectionItemReaderProps) {
  if (item.content_type === 'writing_piece' && item.content?.slug) {
    return (
      <WritingPieceReader
        pieceSlug={item.content.slug}
        groupSlug={groupSlug}
        onBack={onBack}
      />
    );
  }

  if (!item.is_folder && (!item.content_type || item.content_type === 'source_file')) {
    return <SourceFileReader item={item} onBack={onBack} />;
  }

  return (
    <VStack align="stretch" gap={4}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        color="theme.textSecondary"
        px={0}
        alignSelf="flex-start"
        _hover={{ color: 'theme.text' }}
      >
        <IconArrowLeft size={14} />
        <Text ml={1} fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase">
          Back to collection
        </Text>
      </Button>
      <Text color="theme.textSecondary">
        This collection item type does not have an inline reader yet.
      </Text>
    </VStack>
  );
}
