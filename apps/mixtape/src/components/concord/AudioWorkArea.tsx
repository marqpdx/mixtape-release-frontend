// apps/mixtape/src/components/concord/AudioWorkArea.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Card,
  Button,
  Input,
  Spinner,
  Badge,
  Progress,
  Separator,
  Menu,
  Portal,
} from '@chakra-ui/react';
import {
  IconMicrophone,
  IconUpload,
  IconPlayerPlay,
  IconClock,
  IconTrash,
  IconRefresh,
  IconFolder,
  IconFile,
  IconFiles,
  IconWand,
  IconFileText,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroupRecordings,
  uploadFiles,
  archiveRecording,
  triggerTranscription,
  fetchRecordingTranscriptions,
  fetchTranscription,
  type UploadResult,
} from '@mixtape/api/clients';
import { toaster } from '@/components/ui/toaster';
import type { RecordingListItem, RecordingStatus, Transcription } from '@mixtape/core/types/concordTypes';

interface AudioWorkAreaProps {
  groupSlug: string;
  groupTitle: string;
}

const STATUS_COLORS: Record<RecordingStatus, string> = {
  uploaded: 'gray',
  transcribing: 'blue',
  interpreting: 'purple',
  ready: 'green',
  accepted: 'teal',
  promoted: 'cyan',
  archived: 'gray',
  failed: 'red',
};

const STATUS_LABELS: Record<RecordingStatus, string> = {
  uploaded: 'Uploaded',
  transcribing: 'Transcribing...',
  interpreting: 'Interpreting...',
  ready: 'Ready for Review',
  accepted: 'Accepted',
  promoted: 'Promoted',
  archived: 'Archived',
  failed: 'Failed',
};

// Supported file types
const SUPPORTED_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/webm', 'audio/flac'];
const SUPPORTED_VIDEO = ['video/x-matroska', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac', '.mkv', '.mp4', '.mov', '.avi'];

export function AudioWorkArea({ groupSlug, groupTitle }: AudioWorkAreaProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [transcriptVersions, setTranscriptVersions] = useState<Record<string, Transcription[]>>({});
  const [selectedVersion, setSelectedVersion] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch recordings for the group
  const {
    data: recordingsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['concord', 'recordings', groupSlug],
    queryFn: () => fetchGroupRecordings(groupSlug),
  });

  const recordings = recordingsData?.recordings || [];

  // Upload mutation using unified endpoint
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      return uploadFiles(groupSlug, files, {
        autoTranscribe: true,
        whisperModel: 'base',
        sessionTitle: sessionTitle || undefined,
        onProgress: setUploadProgress,
      });
    },
    onSuccess: (result: UploadResult) => {
      queryClient.invalidateQueries({ queryKey: ['concord', 'recordings', groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['concord', 'sessions', groupSlug] });

      if (result.status === 'success') {
        const message = buildSuccessMessage(result);
        toaster.create({
          title: 'Upload complete',
          description: message,
          type: 'success',
          duration: 5000,
        });

        // Show warnings if any
        if (result.warnings.length > 0) {
          toaster.create({
            title: 'Upload warnings',
            description: result.warnings.join('\n'),
            type: 'warning',
            duration: 8000,
          });
        }
      }

      resetUploadForm();
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Upload failed',
        description: error.message,
        type: 'error',
      });
    },
  });

  // Archive recording mutation
  const archiveMutation = useMutation({
    mutationFn: archiveRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concord', 'recordings', groupSlug] });
      toaster.create({
        title: 'Recording archived',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Archive failed',
        description: error.message,
        type: 'error',
      });
    },
  });

  // Re-transcribe mutation
  const transcribeMutation = useMutation({
    mutationFn: async ({ recordingId, model, force }: { recordingId: string; model: string; force: boolean }) => {
      return triggerTranscription(recordingId, { model, force });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['concord', 'recordings', groupSlug] });
      toaster.create({
        title: 'Transcription queued',
        description: `Using ${result.model} model`,
        type: 'success',
      });
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Transcription failed',
        description: error.message,
        type: 'error',
      });
    },
  });

  const handleTranscribe = (recordingId: string, model: string, force: boolean = false) => {
    transcribeMutation.mutate({ recordingId, model, force });
  };

  // Toggle transcript view and load all versions
  const toggleTranscript = async (recordingId: string) => {
    if (expandedTranscript === recordingId) {
      // Collapse
      setExpandedTranscript(null);
      return;
    }

    // Expand and load all transcript versions if not cached
    setExpandedTranscript(recordingId);

    if (!transcriptVersions[recordingId]) {
      try {
        // Get list of transcriptions for this recording
        const listResponse = await fetchRecordingTranscriptions(recordingId);
        if (listResponse.transcriptions.length > 0) {
          // Fetch all versions with full details
          const allVersions = await Promise.all(
            listResponse.transcriptions
              .sort((a, b) => b.version - a.version) // newest first
              .map(t => fetchTranscription(t.id))
          );
          setTranscriptVersions(prev => ({ ...prev, [recordingId]: allVersions }));
          // Default to latest version
          setSelectedVersion(prev => ({ ...prev, [recordingId]: allVersions[0].id }));
        } else {
          setTranscriptVersions(prev => ({ ...prev, [recordingId]: [] }));
        }
      } catch (error) {
        console.error('Failed to load transcripts:', error);
        toaster.create({
          title: 'Failed to load transcripts',
          type: 'error',
        });
        setTranscriptVersions(prev => ({ ...prev, [recordingId]: [] }));
      }
    }
  };

  // Get currently selected transcription for a recording
  const getSelectedTranscription = (recordingId: string): Transcription | null => {
    const versions = transcriptVersions[recordingId];
    if (!versions || versions.length === 0) return null;
    const selectedId = selectedVersion[recordingId];
    return versions.find(v => v.id === selectedId) || versions[0];
  };

  const buildSuccessMessage = (result: UploadResult): string => {
    const parts = [];
    if (result.recordings_created > 0) {
      parts.push(`${result.recordings_created} recording${result.recordings_created > 1 ? 's' : ''}`);
    }
    if (result.sessions_created > 0) {
      parts.push(`${result.sessions_created} session${result.sessions_created > 1 ? 's' : ''}`);
    }
    if (result.transcription_tasks_queued > 0) {
      parts.push(`${result.transcription_tasks_queued} queued for transcription`);
    }
    return parts.join(', ') || 'Upload complete';
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setSelectedFiles([]);
    setSessionTitle('');
    setUploadProgress(0);
    setUploadMode('files');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const isValidFile = (file: File): boolean => {
    // Check by MIME type
    if (SUPPORTED_AUDIO.includes(file.type) || SUPPORTED_VIDEO.includes(file.type)) {
      return true;
    }
    // Check by extension as fallback
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Filter to valid files
    const validFiles = files.filter(isValidFile);
    const skipped = files.length - validFiles.length;

    if (skipped > 0) {
      toaster.create({
        title: `Skipped ${skipped} unsupported file${skipped > 1 ? 's' : ''}`,
        description: 'Only audio and video files are supported',
        type: 'warning',
      });
    }

    // Check total size (2GB limit)
    const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (totalSize > maxSize) {
      toaster.create({
        title: 'Files too large',
        description: `Total size ${formatFileSize(totalSize)} exceeds 2GB limit`,
        type: 'error',
      });
      return;
    }

    setSelectedFiles(validFiles);

    // Auto-set session title for folder uploads
    if (validFiles.length > 0 && uploadMode === 'folder') {
      const firstPath = validFiles[0].webkitRelativePath;
      if (firstPath) {
        const folderName = firstPath.split('/')[0];
        if (!sessionTitle) {
          setSessionTitle(folderName);
        }
      }
    }
  }, [sessionTitle, uploadMode]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toaster.create({
        title: 'No files selected',
        description: 'Please select audio or video files to upload',
        type: 'error',
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(selectedFiles);
    } finally {
      setIsUploading(false);
    }
  };

  const handleArchive = (recordingId: string) => {
    if (window.confirm('Are you sure you want to archive this recording?')) {
      archiveMutation.mutate(recordingId);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatTimestamp = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getFilesSummary = (): string => {
    if (selectedFiles.length === 0) return '';

    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

    // Check if files come from subdirectories
    const paths = selectedFiles.map(f => f.webkitRelativePath || f.name);
    const folders = new Set(paths.map(p => p.split('/')[0]));

    if (folders.size > 1) {
      return `${selectedFiles.length} files in ${folders.size} folders (${formatFileSize(totalSize)})`;
    }

    return `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} (${formatFileSize(totalSize)})`;
  };

  if (isLoading) {
    return (
      <Container maxWidth="1200px" py={8}>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" />
          <Text mt={4} color="gray.600">
            Loading recordings...
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="1200px" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <Box>
            <Heading size="xl" mb={2}>
              Audio Recordings
            </Heading>
            <Text color="gray.600">
              Audio transcription and interpretation for {groupTitle}
            </Text>
          </Box>

          <HStack gap={2}>
            <Button variant="outline" onClick={() => refetch()}>
              <IconRefresh size={20} />
            </Button>
            <Button
              colorPalette="blue"
              onClick={() => setShowUpload(!showUpload)}
            >
              <HStack gap={2}>
                <IconUpload size={20} />
                <Text>Upload</Text>
              </HStack>
            </Button>
          </HStack>
        </HStack>

        {/* Upload Form */}
        {showUpload && (
          <Card.Root>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Heading size="md">Upload Audio/Video Files</Heading>

                <Text fontSize="sm" color="gray.600">
                  Upload files or a folder. Folders with subfolders will create separate sessions for each.
                  Supported: MP3, WAV, M4A, AAC, OGG, WebM, FLAC, MKV, MP4, MOV, AVI
                </Text>

                {/* Upload Mode Toggle */}
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant={uploadMode === 'files' ? 'solid' : 'outline'}
                    colorPalette={uploadMode === 'files' ? 'blue' : 'gray'}
                    onClick={() => {
                      setUploadMode('files');
                      setSelectedFiles([]);
                    }}
                  >
                    <HStack gap={1}>
                      <IconFiles size={16} />
                      <Text>Select Files</Text>
                    </HStack>
                  </Button>
                  <Button
                    size="sm"
                    variant={uploadMode === 'folder' ? 'solid' : 'outline'}
                    colorPalette={uploadMode === 'folder' ? 'blue' : 'gray'}
                    onClick={() => {
                      setUploadMode('folder');
                      setSelectedFiles([]);
                    }}
                  >
                    <HStack gap={1}>
                      <IconFolder size={16} />
                      <Text>Select Folder</Text>
                    </HStack>
                  </Button>
                </HStack>

                {/* File/Folder Input */}
                <Box>
                  {uploadMode === 'files' ? (
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/*,.mkv,.mp4,.mov,.avi"
                      multiple
                      onChange={handleFileSelect}
                      p={1}
                    />
                  ) : (
                    <Input
                      ref={folderInputRef}
                      type="file"
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleFileSelect}
                      p={1}
                    />
                  )}
                </Box>

                {/* Selected Files Summary */}
                {selectedFiles.length > 0 && (
                  <Box p={3} bg="gray.50" borderRadius="md">
                    <HStack gap={2} mb={2}>
                      <IconFile size={16} />
                      <Text fontWeight="medium">{getFilesSummary()}</Text>
                    </HStack>
                    {selectedFiles.length <= 10 && (
                      <VStack align="start" gap={1} pl={6}>
                        {selectedFiles.map((file, idx) => (
                          <Text key={idx} fontSize="sm" color="gray.600">
                            {file.webkitRelativePath || file.name}
                          </Text>
                        ))}
                      </VStack>
                    )}
                    {selectedFiles.length > 10 && (
                      <Text fontSize="sm" color="gray.500" pl={6}>
                        and {selectedFiles.length - 10} more files...
                      </Text>
                    )}
                  </Box>
                )}

                {/* Optional Session Title */}
                {selectedFiles.length > 1 && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Session Title (optional)</Text>
                    <Input
                      placeholder="Leave empty for auto-generated title"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      For folder uploads, subfolder names are used as session titles
                    </Text>
                  </Box>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <Box>
                    <Progress.Root value={uploadProgress}>
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Uploading... {uploadProgress}%
                    </Text>
                  </Box>
                )}

                {/* Actions */}
                <HStack justify="flex-end" gap={2}>
                  <Button
                    variant="ghost"
                    onClick={resetUploadForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorPalette="blue"
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || isUploading}
                    loading={isUploading}
                  >
                    Upload {selectedFiles.length > 0 && `(${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})`}
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Recordings List */}
        {recordings.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <VStack py={12} gap={4}>
                <IconMicrophone size={48} color="gray" />
                <Text color="gray.600" textAlign="center">
                  No recordings yet. Upload audio or video files to get started.
                </Text>
                <Button
                  colorPalette="blue"
                  onClick={() => setShowUpload(true)}
                >
                  <HStack gap={2}>
                    <IconUpload size={20} />
                    <Text>Upload First Recording</Text>
                  </HStack>
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        ) : (
          <VStack gap={4} align="stretch">
            {recordings.map((recording: RecordingListItem) => (
              <Card.Root key={recording.id}>
                <Card.Body>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" gap={2}>
                      <HStack gap={2}>
                        <IconMicrophone size={20} />
                        <Text fontWeight="medium">
                          {recording.title || 'Untitled Recording'}
                        </Text>
                        <Badge colorPalette={STATUS_COLORS[recording.status]}>
                          {STATUS_LABELS[recording.status]}
                        </Badge>
                        {recording.session_id && (
                          <Badge variant="outline" colorPalette="purple">
                            Session
                          </Badge>
                        )}
                      </HStack>

                      <HStack gap={4} color="gray.600" fontSize="sm">
                        {recording.duration_formatted && (
                          <HStack gap={1}>
                            <IconClock size={14} />
                            <Text>{recording.duration_formatted}</Text>
                          </HStack>
                        )}
                        <Text>
                          {new Date(recording.created_at).toLocaleDateString()}
                        </Text>
                        {recording.submitted_by_name && (
                          <Text>by {recording.submitted_by_name}</Text>
                        )}
                      </HStack>
                    </VStack>

                    <HStack gap={2}>
                      {recording.status === 'ready' && (
                        <Button
                          size="sm"
                          colorPalette="green"
                          variant="outline"
                        >
                          <HStack gap={1}>
                            <IconPlayerPlay size={16} />
                            <Text>Review</Text>
                          </HStack>
                        </Button>
                      )}

                      {/* Transcribe / Re-transcribe Menu */}
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            colorPalette={recording.status === 'uploaded' ? 'blue' : 'gray'}
                            loading={transcribeMutation.isPending}
                          >
                            <HStack gap={1}>
                              <IconWand size={16} />
                              <Text>{recording.status === 'uploaded' ? 'Transcribe' : 'Re-transcribe'}</Text>
                            </HStack>
                          </Button>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content>
                              <Menu.Item
                                value="tiny"
                                onClick={() => handleTranscribe(recording.id, 'tiny', recording.status !== 'uploaded')}
                              >
                                <Text fontWeight="medium">Tiny</Text>
                                <Text fontSize="xs" color="gray.500" ml={2}>Fastest, least accurate</Text>
                              </Menu.Item>
                              <Menu.Item
                                value="base"
                                onClick={() => handleTranscribe(recording.id, 'base', recording.status !== 'uploaded')}
                              >
                                <Text fontWeight="medium">Base</Text>
                                <Text fontSize="xs" color="gray.500" ml={2}>Good balance (default)</Text>
                              </Menu.Item>
                              <Menu.Item
                                value="small"
                                onClick={() => handleTranscribe(recording.id, 'small', recording.status !== 'uploaded')}
                              >
                                <Text fontWeight="medium">Small</Text>
                                <Text fontSize="xs" color="gray.500" ml={2}>Better accuracy</Text>
                              </Menu.Item>
                              <Menu.Item
                                value="medium"
                                onClick={() => handleTranscribe(recording.id, 'medium', recording.status !== 'uploaded')}
                              >
                                <Text fontWeight="medium">Medium</Text>
                                <Text fontSize="xs" color="gray.500" ml={2}>High accuracy</Text>
                              </Menu.Item>
                              <Menu.Separator />
                              <Menu.Item
                                value="large-v3"
                                onClick={() => handleTranscribe(recording.id, 'large-v3', recording.status !== 'uploaded')}
                              >
                                <Text fontWeight="medium">Large v3</Text>
                                <Text fontSize="xs" color="gray.500" ml={2}>Best accuracy, slowest</Text>
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>

                      <Button
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleArchive(recording.id)}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </HStack>
                  </HStack>

                  {/* View Transcript Button - show for ready/accepted/promoted */}
                  {['ready', 'accepted', 'promoted'].includes(recording.status) && (
                    <Box mt={3}>
                      <Button
                        size="sm"
                        variant="ghost"
                        width="full"
                        onClick={() => toggleTranscript(recording.id)}
                      >
                        <HStack gap={2}>
                          <IconFileText size={16} />
                          <Text>
                            {expandedTranscript === recording.id ? 'Hide Transcript' : 'View Transcript'}
                          </Text>
                          {expandedTranscript === recording.id ? (
                            <IconChevronUp size={16} />
                          ) : (
                            <IconChevronDown size={16} />
                          )}
                        </HStack>
                      </Button>

                      {/* Expanded Transcript Content */}
                      {expandedTranscript === recording.id && (
                        <Box
                          mt={3}
                          p={4}
                          bg="gray.50"
                          borderRadius="md"
                          maxHeight="500px"
                          overflowY="auto"
                        >
                          {!(recording.id in transcriptVersions) ? (
                            <HStack justify="center" py={4}>
                              <Spinner size="sm" />
                              <Text color="gray.500">Loading transcripts...</Text>
                            </HStack>
                          ) : transcriptVersions[recording.id].length === 0 ? (
                            <Text color="gray.500" textAlign="center">
                              No transcript available
                            </Text>
                          ) : (
                            <VStack align="stretch" gap={3}>
                              {/* Version selector - show if multiple versions */}
                              {transcriptVersions[recording.id].length > 1 && (
                                <Box>
                                  <Text fontSize="xs" color="gray.500" mb={2}>
                                    Compare transcription models:
                                  </Text>
                                  <HStack gap={2} flexWrap="wrap">
                                    {transcriptVersions[recording.id].map((version) => (
                                      <Button
                                        key={version.id}
                                        size="xs"
                                        variant={selectedVersion[recording.id] === version.id ? 'solid' : 'outline'}
                                        colorPalette={selectedVersion[recording.id] === version.id ? 'blue' : 'gray'}
                                        onClick={() => setSelectedVersion(prev => ({ ...prev, [recording.id]: version.id }))}
                                      >
                                        <VStack gap={0}>
                                          <Text>v{version.version} - {version.whisper_model}</Text>
                                        </VStack>
                                      </Button>
                                    ))}
                                  </HStack>
                                </Box>
                              )}

                              {/* Selected transcript metadata */}
                              {(() => {
                                const transcript = getSelectedTranscription(recording.id);
                                if (!transcript) return null;
                                return (
                                  <>
                                    <HStack gap={4} fontSize="xs" color="gray.500" flexWrap="wrap">
                                      <Text fontWeight="medium">
                                        Version {transcript.version} ({transcript.whisper_model})
                                      </Text>
                                      <Text>Language: {transcript.language}</Text>
                                      <Text>{transcript.text.length} chars</Text>
                                      <Text>{transcript.segments?.length || 0} segments</Text>
                                      {transcript.confidence_avg && (
                                        <Text>
                                          Confidence: {(transcript.confidence_avg * 100).toFixed(0)}%
                                        </Text>
                                      )}
                                    </HStack>

                                    <Separator />

                                    {/* Full transcript text */}
                                    <Box>
                                      <Text
                                        whiteSpace="pre-wrap"
                                        fontSize="sm"
                                        lineHeight="tall"
                                      >
                                        {transcript.text}
                                      </Text>
                                    </Box>

                                    {/* Segments (if available) */}
                                    {transcript.segments?.length > 0 && (
                                      <>
                                        <Separator />
                                        <Text fontWeight="medium" fontSize="sm">
                                          Segments ({transcript.segments.length})
                                        </Text>
                                        <VStack align="stretch" gap={2}>
                                          {transcript.segments.map((segment) => (
                                            <HStack
                                              key={segment.id}
                                              align="start"
                                              gap={3}
                                              fontSize="sm"
                                              p={2}
                                              bg="white"
                                              borderRadius="sm"
                                            >
                                              <Text
                                                color="gray.400"
                                                fontFamily="mono"
                                                fontSize="xs"
                                                minWidth="60px"
                                              >
                                                {formatTimestamp(segment.start_ms)}
                                              </Text>
                                              <Text flex="1">{segment.text}</Text>
                                            </HStack>
                                          ))}
                                        </VStack>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </VStack>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
                </Card.Body>
              </Card.Root>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}

export default AudioWorkArea;
