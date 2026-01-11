// File type icon helpers for Collections

import {
  IconFile,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeCsv,
  IconPhoto,
  IconMusic,
  IconVideo,
  IconFileCode,
  IconFileZip,
  IconFileText,
} from '@tabler/icons-react';

export interface FileTypeInfo {
  icon: typeof IconFile;
  colorScheme: string;
  label: string;
}

/**
 * Get file type icon and metadata based on filename or content type
 */
export function getFileTypeInfo(filename: string, contentType?: string): FileTypeInfo {
  // Get file extension
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  // PDF files
  if (extension === 'pdf' || contentType?.includes('pdf')) {
    return {
      icon: IconFileTypePdf,
      colorScheme: 'red',
      label: 'PDF',
    };
  }

  // Word documents
  if (
    ['doc', 'docx'].includes(extension) ||
    contentType?.includes('msword') ||
    contentType?.includes('wordprocessing')
  ) {
    return {
      icon: IconFileTypeDoc,
      colorScheme: 'blue',
      label: 'Document',
    };
  }

  // Spreadsheets
  if (
    ['csv', 'xls', 'xlsx'].includes(extension) ||
    contentType?.includes('spreadsheet') ||
    contentType?.includes('csv')
  ) {
    return {
      icon: IconFileTypeCsv,
      colorScheme: 'green',
      label: 'Spreadsheet',
    };
  }

  // Images
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(extension) ||
    contentType?.startsWith('image/')
  ) {
    return {
      icon: IconPhoto,
      colorScheme: 'purple',
      label: 'Image',
    };
  }

  // Audio files
  if (
    ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension) ||
    contentType?.startsWith('audio/')
  ) {
    return {
      icon: IconMusic,
      colorScheme: 'pink',
      label: 'Audio',
    };
  }

  // Video files
  if (
    ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'].includes(extension) ||
    contentType?.startsWith('video/')
  ) {
    return {
      icon: IconVideo,
      colorScheme: 'orange',
      label: 'Video',
    };
  }

  // Code files
  if (
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'rb', 'php', 'swift'].includes(extension)
  ) {
    return {
      icon: IconFileCode,
      colorScheme: 'cyan',
      label: 'Code',
    };
  }

  // Archives
  if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(extension)) {
    return {
      icon: IconFileZip,
      colorScheme: 'yellow',
      label: 'Archive',
    };
  }

  // Text files
  if (
    ['txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'html', 'css'].includes(extension) ||
    contentType?.startsWith('text/')
  ) {
    return {
      icon: IconFileText,
      colorScheme: 'gray',
      label: 'Text',
    };
  }

  // Default for unknown types
  return {
    icon: IconFile,
    colorScheme: 'gray',
    label: 'File',
  };
}
