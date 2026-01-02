// apps/mixtape/src/components/stackroom/FileUpload.tsx

'use client';

import { useCallback, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Card,
} from '@chakra-ui/react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { FileUploadProgress } from '@mixtape/core/types/stackroomTypes';
import { uploadFile } from '@mixtape/api/clients/stackroom/stackroomApi';

interface FileUploadProps {
  libraryId: string;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
}

export function FileUpload({
  libraryId,
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = [
    '.pdf',
    '.txt',
    '.md',
    '.doc',
    '.docx',
    '.html',
    '.json',
    '.csv',
  ],
  maxFileSizeMB = 50,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<FileUploadProgress[]>([]);

  // Perform actual file upload
  const performUpload = useCallback(async (file: File, fileId: string) => {
    try {
      // Update status to uploading
      setUploadQueue((prev) =>
        prev.map((upload) =>
          upload.file_id === fileId
            ? { ...upload, status: 'uploading', progress: 0 }
            : upload
        )
      );

      // Upload with progress tracking
      const response = await uploadFile(libraryId, file, (progress) => {
        setUploadQueue((prev) =>
          prev.map((upload) =>
            upload.file_id === fileId ? { ...upload, progress } : upload
          )
        );
      });

      // Mark as complete
      setUploadQueue((prev) =>
        prev.map((upload) =>
          upload.file_id === fileId
            ? {
                ...upload,
                status: 'complete',
                progress: 100,
                source_file_id: response.source_file_id,
                ingestion_run_id: response.ingestion_run_id,
              }
            : upload
        )
      );

      onUploadComplete?.(response.source_file_id);
    } catch (err) {
      // Type-safe error handling
      const error = err as { isDuplicate?: boolean; source_file_id?: string; message?: string };

      // Check if this is a duplicate file error
      if (error.isDuplicate) {
        setUploadQueue((prev) =>
          prev.map((upload) =>
            upload.file_id === fileId
              ? {
                  ...upload,
                  status: 'already_uploaded',
                  progress: 100,
                  source_file_id: error.source_file_id,
                }
              : upload
          )
        );
        // Don't call onUploadError for duplicates - it's not really an error
        return;
      }

      // Mark as failed for other errors
      const errorMessage = error instanceof Error ? error.message : error.message || 'Upload failed';

      setUploadQueue((prev) =>
        prev.map((upload) =>
          upload.file_id === fileId
            ? {
                ...upload,
                status: 'failed',
                error: errorMessage,
              }
            : upload
        )
      );

      onUploadError?.(errorMessage);
    }
  }, [libraryId, onUploadComplete, onUploadError]);

  // Process files
  const handleFiles = useCallback(
    (files: File[]) => {
      const maxSize = maxFileSizeMB * 1024 * 1024;

      const validFiles = files.filter((file) => {
        // Check file size
        if (file.size > maxSize) {
          onUploadError?.(`File ${file.name} exceeds ${maxFileSizeMB}MB limit`);
          return false;
        }

        // Check file type
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFileTypes.includes(extension)) {
          onUploadError?.(
            `File type ${extension} not supported for ${file.name}`
          );
          return false;
        }

        return true;
      });

      // Add to upload queue
      const newUploads: FileUploadProgress[] = validFiles.map((file) => ({
        file_id: `${Date.now()}-${file.name}`,
        filename: file.name,
        status: 'pending',
        progress: 0,
      }));

      setUploadQueue((prev) => [...prev, ...newUploads]);

      // Upload files
      validFiles.forEach((file, index) => {
        performUpload(file, newUploads[index].file_id);
      });
    },
    [acceptedFileTypes, maxFileSizeMB, onUploadError, performUpload]
  );

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  // Handle file selection
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  // Get status icon
  const getStatusIcon = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon style={{ width: '20px', height: '20px' }} />;
      case 'already_uploaded':
        return <CheckCircleIcon style={{ width: '20px', height: '20px' }} />;
      case 'failed':
        return <XCircleIcon style={{ width: '20px', height: '20px' }} />;
      default:
        return <DocumentIcon style={{ width: '20px', height: '20px' }} />;
    }
  };

  // Get status color
  const getStatusColor = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'complete':
        return 'green.500';
      case 'already_uploaded':
        return 'orange.500';
      case 'failed':
        return 'red.500';
      case 'uploading':
        return 'blue.500';
      default:
        return 'gray.500';
    }
  };

  // Get status text
  const getStatusText = (upload: FileUploadProgress) => {
    if (upload.status === 'uploading') {
      return `${upload.progress}%`;
    }
    if (upload.status === 'already_uploaded') {
      return 'Already uploaded';
    }
    // Capitalize first letter
    return upload.status.charAt(0).toUpperCase() + upload.status.slice(1);
  };

  return (
    <VStack gap={6} align="stretch">
      {/* Drop Zone */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={isDragActive ? 'blue.500' : 'gray.300'}
        borderRadius="lg"
        p={12}
        bg={isDragActive ? 'blue.50' : 'gray.50'}
        transition="all 0.2s"
        cursor="pointer"
        _hover={{
          borderColor: 'blue.400',
          bg: 'blue.50',
        }}
      >
        <VStack gap={4}>
          <Box color={isDragActive ? 'blue.500' : 'gray.400'}>
            <CloudArrowUpIcon style={{ width: '48px', height: '48px' }} />
          </Box>

          <VStack gap={2}>
            <Text fontSize="lg" fontWeight="medium">
              {isDragActive
                ? 'Drop files here'
                : 'Drag and drop files here'}
            </Text>
            <Text fontSize="sm" color="gray.600">
              or
            </Text>
          </VStack>

          <Button
            as="label"
            colorPalette="blue"
            size="md"
            cursor="pointer"
          >
            Browse Files
            <input
              id="file-upload"
              type="file"
              multiple
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </Button>

          <Text fontSize="xs" color="gray.500">
            Supported: {acceptedFileTypes.join(', ')} (max {maxFileSizeMB}MB)
          </Text>
        </VStack>
      </Box>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <VStack gap={3} align="stretch">
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Upload Queue ({uploadQueue.length})
          </Text>

          {uploadQueue.map((upload) => (
            <Card.Root key={upload.file_id} borderWidth="1px">
              <Card.Body p={4}>
                <VStack gap={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack gap={2}>
                      <Box color={getStatusColor(upload.status)}>
                        {getStatusIcon(upload.status)}
                      </Box>
                      <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                        {upload.filename}
                      </Text>
                    </HStack>

                    <Text fontSize="xs" color="gray.500">
                      {getStatusText(upload)}
                    </Text>
                  </HStack>

                  {upload.status === 'uploading' && (
                    <Progress.Root value={upload.progress} size="xs" colorPalette="blue">
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  )}

                  {upload.error && (
                    <Text fontSize="xs" color="red.500">
                      {upload.error}
                    </Text>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

// // apps/mixtape/src/components/stackroom/FileUpload.tsx

// 'use client';

// import { useCallback, useState } from 'react';
// import {
//   Box,
//   VStack,
//   HStack,
//   Text,
//   Button,
//   Progress,
//   Card,
// } from '@chakra-ui/react';
// import {
//   CloudArrowUpIcon,
//   DocumentIcon,
//   CheckCircleIcon,
//   XCircleIcon,
// } from '@heroicons/react/24/outline';
// import type { FileUploadProgress } from '@mixtape/core/types/stackroomTypes';
// import { uploadFile } from '@mixtape/api/clients/stackroom/stackroomApi';

// interface FileUploadProps {
//   libraryId: string;
//   onUploadComplete?: (fileId: string) => void;
//   onUploadError?: (error: string) => void;
//   acceptedFileTypes?: string[];
//   maxFileSizeMB?: number;
// }

// export function FileUpload({
//   libraryId,
//   onUploadComplete,
//   onUploadError,
//   acceptedFileTypes = [
//     '.pdf',
//     '.txt',
//     '.md',
//     '.doc',
//     '.docx',
//     '.html',
//     '.json',
//     '.csv',
//   ],
//   maxFileSizeMB = 50,
// }: FileUploadProps) {
//   const [isDragActive, setIsDragActive] = useState(false);
//   const [uploadQueue, setUploadQueue] = useState<FileUploadProgress[]>([]);

//   // Handle drag events
//   const handleDrag = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === 'dragenter' || e.type === 'dragover') {
//       setIsDragActive(true);
//     } else if (e.type === 'dragleave') {
//       setIsDragActive(false);
//     }
//   }, []);

//   // Handle drop
//   const handleDrop = useCallback(
//     (e: React.DragEvent) => {
//       e.preventDefault();
//       e.stopPropagation();
//       setIsDragActive(false);

//       const files = Array.from(e.dataTransfer.files);
//       handleFiles(files);
//     },
//     [libraryId]
//   );

//   // Handle file selection
//   const handleFileInput = useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       if (e.target.files) {
//         const files = Array.from(e.target.files);
//         handleFiles(files);
//       }
//     },
//     [libraryId]
//   );

//   // Process files
//   const handleFiles = useCallback(
//     (files: File[]) => {
//       const maxSize = maxFileSizeMB * 1024 * 1024;

//       const validFiles = files.filter((file) => {
//         // Check file size
//         if (file.size > maxSize) {
//           onUploadError?.(`File ${file.name} exceeds ${maxFileSizeMB}MB limit`);
//           return false;
//         }

//         // Check file type
//         const extension = '.' + file.name.split('.').pop()?.toLowerCase();
//         if (!acceptedFileTypes.includes(extension)) {
//           onUploadError?.(
//             `File type ${extension} not supported for ${file.name}`
//           );
//           return false;
//         }

//         return true;
//       });

//       // Add to upload queue
//       const newUploads: FileUploadProgress[] = validFiles.map((file) => ({
//         file_id: `${Date.now()}-${file.name}`,
//         filename: file.name,
//         status: 'pending',
//         progress: 0,
//       }));

//       setUploadQueue((prev) => [...prev, ...newUploads]);

//       // Upload files
//       validFiles.forEach((file, index) => {
//         performUpload(file, newUploads[index].file_id);
//       });
//     },
//     [libraryId, acceptedFileTypes, maxFileSizeMB, onUploadError]
//   );

//   // Perform actual file upload
//   const performUpload = async (file: File, fileId: string) => {
//     try {
//       // Update status to uploading
//       setUploadQueue((prev) =>
//         prev.map((upload) =>
//           upload.file_id === fileId
//             ? { ...upload, status: 'uploading', progress: 0 }
//             : upload
//         )
//       );

//       // Upload with progress tracking
//       const response = await uploadFile(libraryId, file, (progress) => {
//         setUploadQueue((prev) =>
//           prev.map((upload) =>
//             upload.file_id === fileId ? { ...upload, progress } : upload
//           )
//         );
//       });

//       // Mark as complete
//       setUploadQueue((prev) =>
//         prev.map((upload) =>
//           upload.file_id === fileId
//             ? {
//                 ...upload,
//                 status: 'complete',
//                 progress: 100,
//                 source_file_id: response.source_file_id,
//                 ingestion_run_id: response.ingestion_run_id,
//               }
//             : upload
//         )
//       );

//       onUploadComplete?.(response.source_file_id);
//     } catch (error: any) {
//       // Check if this is a duplicate file error
//       if (error.isDuplicate) {
//         setUploadQueue((prev) =>
//           prev.map((upload) =>
//             upload.file_id === fileId
//               ? {
//                   ...upload,
//                   status: 'already_uploaded',
//                   progress: 100,
//                   source_file_id: error.source_file_id,
//                 }
//               : upload
//           )
//         );
//         // Don't call onUploadError for duplicates - it's not really an error
//         return;
//       }

//       // Mark as failed for other errors
//       const errorMessage =
//         error instanceof Error ? error.message : 'Upload failed';

//       setUploadQueue((prev) =>
//         prev.map((upload) =>
//           upload.file_id === fileId
//             ? {
//                 ...upload,
//                 status: 'failed',
//                 error: errorMessage,
//               }
//             : upload
//         )
//       );

//       onUploadError?.(errorMessage);
//     }
//   };

//   // Get status icon
//   const getStatusIcon = (status: FileUploadProgress['status']) => {
//     switch (status) {
//       case 'complete':
//         return <CheckCircleIcon style={{ width: '20px', height: '20px' }} />;
//       case 'already_uploaded':
//         return <CheckCircleIcon style={{ width: '20px', height: '20px' }} />;
//       case 'failed':
//         return <XCircleIcon style={{ width: '20px', height: '20px' }} />;
//       default:
//         return <DocumentIcon style={{ width: '20px', height: '20px' }} />;
//     }
//   };

//   // Get status color
//   const getStatusColor = (status: FileUploadProgress['status']) => {
//     switch (status) {
//       case 'complete':
//         return 'green.500';
//       case 'already_uploaded':
//         return 'orange.500';
//       case 'failed':
//         return 'red.500';
//       case 'uploading':
//         return 'blue.500';
//       default:
//         return 'gray.500';
//     }
//   };

//   // Get status text
//   const getStatusText = (upload: FileUploadProgress) => {
//     if (upload.status === 'uploading') {
//       return `${upload.progress}%`;
//     }
//     if (upload.status === 'already_uploaded') {
//       return 'Already uploaded';
//     }
//     // Capitalize first letter
//     return upload.status.charAt(0).toUpperCase() + upload.status.slice(1);
//   };

//   return (
//     <VStack gap={6} align="stretch">
//       {/* Drop Zone */}
//       <Box
//         onDragEnter={handleDrag}
//         onDragLeave={handleDrag}
//         onDragOver={handleDrag}
//         onDrop={handleDrop}
//         borderWidth="2px"
//         borderStyle="dashed"
//         borderColor={isDragActive ? 'blue.500' : 'gray.300'}
//         borderRadius="lg"
//         p={12}
//         bg={isDragActive ? 'blue.50' : 'gray.50'}
//         transition="all 0.2s"
//         cursor="pointer"
//         _hover={{
//           borderColor: 'blue.400',
//           bg: 'blue.50',
//         }}
//       >
//         <VStack gap={4}>
//           <Box color={isDragActive ? 'blue.500' : 'gray.400'}>
//             <CloudArrowUpIcon style={{ width: '48px', height: '48px' }} />
//           </Box>

//           <VStack gap={2}>
//             <Text fontSize="lg" fontWeight="medium">
//               {isDragActive
//                 ? 'Drop files here'
//                 : 'Drag and drop files here'}
//             </Text>
//             <Text fontSize="sm" color="gray.600">
//               or
//             </Text>
//           </VStack>

//           <Button
//             as="label"
//             colorPalette="blue"
//             size="md"
//             cursor="pointer"
//           >
//             Browse Files
//             <input
//               id="file-upload"
//               type="file"
//               multiple
//               accept={acceptedFileTypes.join(',')}
//               onChange={handleFileInput}
//               style={{ display: 'none' }}
//             />
//           </Button>

//           <Text fontSize="xs" color="gray.500">
//             Supported: {acceptedFileTypes.join(', ')} (max {maxFileSizeMB}MB)
//           </Text>
//         </VStack>
//       </Box>

//       {/* Upload Queue */}
//       {uploadQueue.length > 0 && (
//         <VStack gap={3} align="stretch">
//           <Text fontSize="sm" fontWeight="medium" color="gray.700">
//             Upload Queue ({uploadQueue.length})
//           </Text>

//           {uploadQueue.map((upload) => (
//             <Card.Root key={upload.file_id} borderWidth="1px">
//               <Card.Body p={4}>
//                 <VStack gap={3} align="stretch">
//                   <HStack justify="space-between">
//                     <HStack gap={2}>
//                       <Box color={getStatusColor(upload.status)}>
//                         {getStatusIcon(upload.status)}
//                       </Box>
//                       <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
//                         {upload.filename}
//                       </Text>
//                     </HStack>

//                     <Text fontSize="xs" color="gray.500">
//                       {getStatusText(upload)}
//                     </Text>
//                   </HStack>

//                   {upload.status === 'uploading' && (
//                     <Progress.Root value={upload.progress} size="xs" colorPalette="blue">
//                       <Progress.Track>
//                         <Progress.Range />
//                       </Progress.Track>
//                     </Progress.Root>
//                   )}

//                   {upload.error && (
//                     <Text fontSize="xs" color="red.500">
//                       {upload.error}
//                     </Text>
//                   )}
//                 </VStack>
//               </Card.Body>
//             </Card.Root>
//           ))}
//         </VStack>
//       )}
//     </VStack>
//   );
// }
