'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconMinus,
  IconPlus,
} from '@tabler/icons-react';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfDocumentViewerProps {
  filename: string;
  sourceFileId: string;
  downloadUrl?: string;
}

export function PdfDocumentViewer({ filename, sourceFileId, downloadUrl }: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(760);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setContainerWidth(Math.max(280, Math.floor(element.getBoundingClientRect().width)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const resolvedDownloadUrl = downloadUrl ?? `/api/stackroom/source-files/${sourceFileId}/download`;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    setPdfUrl(null);
    setLoadError(null);
    setNumPages(null);
    setPageNumber(1);

    axiosInstance
      .get(resolvedDownloadUrl, {
        responseType: 'blob',
      })
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setPdfUrl(objectUrl);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'The PDF could not be loaded.');
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resolvedDownloadUrl]);

  const pageWidth = Math.min(containerWidth, 920) * scale;

  return (
    <VStack ref={containerRef} align="stretch" gap={4} maxW="960px">
      <HStack
        justify="space-between"
        gap={3}
        flexWrap="wrap"
        border="1px solid"
        borderColor="theme.border"
        borderRadius="8px"
        px={3}
        py={2}
      >
        <HStack gap={2}>
          <Button
            size="sm"
            variant="ghost"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
          >
            <IconChevronLeft size={16} />
          </Button>
          <Text color="theme.textSecondary" fontSize="sm">
            Page {pageNumber}
            {numPages ? ` of ${numPages}` : ''}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            disabled={numPages ? pageNumber >= numPages : true}
            onClick={() => setPageNumber((current) => Math.min(numPages || current, current + 1))}
          >
            <IconChevronRight size={16} />
          </Button>
        </HStack>

        <HStack gap={2}>
          <Button
            size="sm"
            variant="ghost"
            disabled={scale <= 0.75}
            onClick={() => setScale((current) => Math.max(0.75, current - 0.25))}
          >
            <IconMinus size={16} />
          </Button>
          <Text color="theme.textSecondary" fontSize="sm" minW="48px" textAlign="center">
            {Math.round(scale * 100)}%
          </Text>
          <Button
            size="sm"
            variant="ghost"
            disabled={scale >= 1.75}
            onClick={() => setScale((current) => Math.min(1.75, current + 0.25))}
          >
            <IconPlus size={16} />
          </Button>
        </HStack>
      </HStack>

      <Box
        overflow="auto"
        border="1px solid"
        borderColor="theme.border"
        borderRadius="8px"
        bg="gray.50"
        minH={{ base: '70vh', md: '78vh' }}
        p={{ base: 2, md: 5 }}
      >
        {!pdfUrl ? (
          <Box py={16} textAlign="center">
            {loadError ? (
              <>
                <Text color="red.500" mb={3}>The original PDF could not be loaded inline.</Text>
                <Text color="theme.textSecondary" fontSize="sm">{loadError}</Text>
              </>
            ) : (
              <>
                <Spinner size="lg" color="theme.accent" />
                <Text mt={4} color="theme.textSecondary">Loading PDF...</Text>
              </>
            )}
          </Box>
        ) : (
          <Box display="inline-block" minW="100%">
            <Document
              file={pdfUrl}
              loading={
                <Box py={16} textAlign="center">
                  <Spinner size="lg" color="theme.accent" />
                </Box>
              }
              error={
                <Text color="red.500">
                  This PDF could not be rendered inline. Use Open original or Download original.
                </Text>
              }
              onLoadSuccess={({ numPages: nextNumPages }: { numPages: number }) => {
                setNumPages(nextNumPages);
                setPageNumber((current) => Math.min(current, nextNumPages));
              }}
            >
              <Box display="flex" justifyContent="center">
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={
                    <Box py={16} textAlign="center">
                      <Spinner size="lg" color="theme.accent" />
                    </Box>
                  }
                />
              </Box>
            </Document>
          </Box>
        )}
      </Box>

      <Text color="theme.textSecondary" fontSize="xs">
        Viewing original PDF: {filename}
      </Text>
    </VStack>
  );
}
