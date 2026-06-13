'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

const pdfWorkerSrc = '/app/pdfjs/pdf.worker.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PdfDocumentViewerProps {
  filename: string;
  sourceFileId: string;
  downloadUrl?: string;
}

export function PdfDocumentViewer({ filename, sourceFileId, downloadUrl }: PdfDocumentViewerProps) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

  const isConvertedDoc = !!downloadUrl;
  const fileLabel = isConvertedDoc ? `PDF preview of ${filename}` : `PDF: ${filename}`;
  const loadingLabel = isConvertedDoc ? 'Loading PDF preview…' : 'Loading PDF…';
  const loadErrorLabel = isConvertedDoc
    ? 'The PDF preview of this document could not be loaded inline.'
    : 'The original PDF could not be loaded inline.';
  const renderErrorLabel = isConvertedDoc
    ? 'This document\'s PDF preview could not be rendered inline. Use Open original or Download original.'
    : 'This PDF could not be rendered inline. Use Open original or Download original.';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(760);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
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
    let cancelled = false;

    setPdfData(null);
    setLoadError(null);
    setNumPages(null);
    setPageNumber(1);

    axiosInstance
      .get(resolvedDownloadUrl, {
        responseType: 'arraybuffer',
      })
      .then((response) => {
        if (cancelled) return;
        setPdfData(new Uint8Array(response.data));
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'The PDF could not be loaded.');
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedDownloadUrl]);

  const pageWidth = Math.min(containerWidth, 920) * scale;
  const pdfFile = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData]);

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
        {!pdfData ? (
          <Box py={16} textAlign="center">
            {loadError ? (
              <>
                <Text color="red.500" mb={3}>{loadErrorLabel}</Text>
                <Text color="theme.textSecondary" fontSize="sm">{loadError}</Text>
              </>
            ) : (
              <>
                <Spinner size="lg" color="theme.accent" />
                <Text mt={4} color="theme.textSecondary">{loadingLabel}</Text>
              </>
            )}
          </Box>
        ) : pdfFile ? (
          <Box display="inline-block" minW="100%">
            <Document
              file={pdfFile}
              loading={
                <Box py={16} textAlign="center">
                  <Spinner size="lg" color="theme.accent" />
                </Box>
              }
              error={
                <Text color="red.500">
                  {renderErrorLabel}
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
        ) : null}
      </Box>

      <Text color="theme.textSecondary" fontSize="xs">
        Viewing {fileLabel}
      </Text>
    </VStack>
  );
}
