// components/puddlejump/panels/OverviewPanel.tsx

'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Spinner,
  Badge,
  Button,
  Collapsible,
} from '@chakra-ui/react';
import {
  DocumentTextIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useLibraryHealth, usePersonalPuddlejump } from '@mixtape/api/hooks/stackroom';
import ExportDialog from '../ExportDialog';

interface OverviewPanelProps {
  libraryId: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function CoverageBar({
  label,
  percentage,
  count,
  total,
}: {
  label: string;
  percentage: number;
  count: number;
  total: number;
}) {
  const barColor =
    percentage >= 80 ? 'green.400' :
    percentage >= 50 ? 'yellow.400' :
    'red.400';

  return (
    <Box>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="sm" color="theme.text" fontWeight="medium">
          {label}
        </Text>
        <Text fontSize="sm" color="theme.textSecondary">
          {count} / {total} ({percentage}%)
        </Text>
      </HStack>
      <Box
        h="8px"
        bg="theme.border"
        borderRadius="full"
        overflow="hidden"
      >
        <Box
          h="100%"
          w={`${percentage}%`}
          bg={barColor}
          borderRadius="full"
          transition="width 0.3s"
        />
      </Box>
    </Box>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      flex="1"
      p={4}
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="lg"
      bg="theme.surface"
    >
      <HStack gap={3}>
        <Box color="theme.textSecondary">{icon}</Box>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="theme.text" lineHeight="1.2">
            {value}
          </Text>
          <Text fontSize="xs" color="theme.textSecondary">
            {label}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}

export default function OverviewPanel({ libraryId }: OverviewPanelProps) {
  const { health, isLoading, error } = useLibraryHealth(libraryId);
  const { puddlejump } = usePersonalPuddlejump();
  const [showExport, setShowExport] = useState(false);

  const libraryTitle = puddlejump?.title || 'Puddlejump Library';

  if (!libraryId) {
    return (
      <Box py={12} textAlign="center">
        <Text color="theme.textSecondary">No Puddlejump library found.</Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box py={12} textAlign="center">
        <Spinner size="lg" color="theme.accent" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        p={6}
        borderWidth="1px"
        borderColor="red.300"
        borderRadius="lg"
        bg="red.50"
      >
        <Text color="red.600">Failed to load health data: {error.message}</Text>
      </Box>
    );
  }

  if (!health) return null;

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between" align="start">
        <Box>
          <Heading size="lg" color="theme.text" mb={1}>
            Library Overview
          </Heading>
          <Text color="theme.textSecondary" fontSize="sm">
            Health metrics for your Puddlejump archive
          </Text>
        </Box>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowExport(true)}
        >
          <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
          Export Bundle
        </Button>
      </HStack>

      {libraryId && (
        <ExportDialog
          open={showExport}
          onClose={() => setShowExport(false)}
          libraryId={libraryId}
          libraryTitle={libraryTitle}
        />
      )}

      {/* Stat Cards */}
      <HStack gap={4} flexWrap="wrap">
        <StatCard
          icon={<DocumentTextIcon style={{ width: 24, height: 24 }} />}
          label="Files"
          value={String(health.file_count)}
        />
        <StatCard
          icon={<FolderIcon style={{ width: 24, height: 24 }} />}
          label="Total size"
          value={formatBytes(health.total_size_bytes)}
        />
        <StatCard
          icon={<FolderIcon style={{ width: 24, height: 24 }} />}
          label="Folder depth"
          value={String(health.folder_depth)}
        />
      </HStack>

      {/* Coverage Bars */}
      <Box
        p={5}
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="lg"
        bg="theme.surface"
      >
        <Text fontWeight="semibold" color="theme.text" mb={4}>
          Coverage
        </Text>
        <VStack gap={4} align="stretch">
          <CoverageBar
            label="Canonical"
            percentage={health.canon_coverage.percentage}
            count={health.canon_coverage.canonical_items ?? 0}
            total={health.canon_coverage.total_items ?? 0}
          />
          <CoverageBar
            label="Summaries"
            percentage={health.summary_coverage.percentage}
            count={health.summary_coverage.with_summary ?? 0}
            total={health.summary_coverage.total_artifacts ?? 0}
          />
          <CoverageBar
            label="Keywords"
            percentage={health.keyword_coverage.percentage}
            count={health.keyword_coverage.with_keywords ?? 0}
            total={health.keyword_coverage.total_artifacts ?? 0}
          />
        </VStack>
      </Box>

      {/* Ingestion Status */}
      <Box
        p={5}
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="lg"
        bg="theme.surface"
      >
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="semibold" color="theme.text">
            Ingestion
          </Text>
          <Badge
            colorPalette={
              health.ingestion_status.percentage_complete === 100 ? 'green' :
              health.ingestion_status.failed_embedding > 0 ? 'red' :
              'yellow'
            }
          >
            {health.ingestion_status.percentage_complete === 100
              ? 'Complete'
              : health.ingestion_status.failed_embedding > 0
                ? `${health.ingestion_status.failed_embedding} failed`
                : `${health.ingestion_status.percentage_complete}% embedded`}
          </Badge>
        </HStack>
        <Box
          h="8px"
          bg="theme.border"
          borderRadius="full"
          overflow="hidden"
        >
          <Box
            h="100%"
            w={`${health.ingestion_status.percentage_complete}%`}
            bg="blue.400"
            borderRadius="full"
            transition="width 0.3s"
          />
        </Box>
        <Text fontSize="xs" color="theme.textSecondary" mt={2}>
          {health.ingestion_status.fully_embedded} of {health.ingestion_status.total_source_files} files embedded
          {health.ingestion_status.pending_embedding > 0 &&
            ` (${health.ingestion_status.pending_embedding} pending)`}
        </Text>
      </Box>

      {/* Missing Summaries */}
      {health.missing_summaries.length > 0 && (
        <Collapsible.Root>
          <Collapsible.Trigger
            w="100%"
            p={4}
            borderWidth="1px"
            borderColor="yellow.300"
            borderRadius="lg"
            bg="yellow.50"
            cursor="pointer"
            _hover={{ bg: 'yellow.100' }}
          >
            <HStack gap={2}>
              <ExclamationTriangleIcon style={{ width: 18, height: 18, color: '#ca8a04' }} />
              <Text fontWeight="medium" color="yellow.800">
                {health.missing_summaries.length} file{health.missing_summaries.length !== 1 ? 's' : ''} missing summaries
              </Text>
            </HStack>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box
              mt={-1}
              p={4}
              pt={5}
              borderWidth="1px"
              borderTopWidth="0"
              borderColor="yellow.300"
              borderBottomRadius="lg"
            >
              <VStack align="stretch" gap={1}>
                {health.missing_summaries.map((ms) => (
                  <Text key={ms.artifact_id} fontSize="sm" color="theme.textSecondary">
                    {ms.filename}
                  </Text>
                ))}
              </VStack>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      )}

      {/* Overdue Reviews */}
      {health.overdue_reviews.length > 0 && (
        <Collapsible.Root>
          <Collapsible.Trigger
            w="100%"
            p={4}
            borderWidth="1px"
            borderColor="red.300"
            borderRadius="lg"
            bg="red.50"
            cursor="pointer"
            _hover={{ bg: 'red.100' }}
          >
            <HStack gap={2}>
              <ExclamationTriangleIcon style={{ width: 18, height: 18, color: '#dc2626' }} />
              <Text fontWeight="medium" color="red.800">
                {health.overdue_reviews.length} overdue review{health.overdue_reviews.length !== 1 ? 's' : ''}
              </Text>
            </HStack>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box
              mt={-1}
              p={4}
              pt={5}
              borderWidth="1px"
              borderTopWidth="0"
              borderColor="red.300"
              borderBottomRadius="lg"
            >
              <VStack align="stretch" gap={2}>
                {health.overdue_reviews.map((or) => (
                  <HStack key={or.library_item_id} justify="space-between">
                    <Text fontSize="sm" color="theme.textSecondary">
                      {or.filename}
                    </Text>
                    <Text fontSize="xs" color="red.500">
                      {or.days_overdue} days overdue
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      )}

      {/* All Good */}
      {health.missing_summaries.length === 0 && health.overdue_reviews.length === 0 && (
        <HStack
          p={4}
          borderWidth="1px"
          borderColor="green.300"
          borderRadius="lg"
          bg="green.50"
          gap={2}
        >
          <CheckCircleIcon style={{ width: 18, height: 18, color: '#16a34a' }} />
          <Text color="green.800" fontWeight="medium">
            No maintenance alerts
          </Text>
        </HStack>
      )}
    </VStack>
  );
}
