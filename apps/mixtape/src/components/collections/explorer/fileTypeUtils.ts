import type { LibraryItem } from '@mixtape/core/types/collectionTypes';

export type FileDisplayType = 'pdf' | 'doc' | 'img' | 'video' | 'audio' | 'sheet' | 'md';

interface FileTypeConfig {
  label: string;
  kind: string;
  color: string;
}

export const FILE_TYPES: Record<FileDisplayType, FileTypeConfig> = {
  pdf:   { label: 'PDF', kind: 'PDF Document',    color: '#D7443E' },
  doc:   { label: 'DOC', kind: 'Word Document',   color: '#2B6CB0' },
  img:   { label: 'IMG', kind: 'Image',            color: '#7C3AED' },
  video: { label: 'MP4', kind: 'Video',            color: '#DB2777' },
  audio: { label: 'MP3', kind: 'Audio',            color: '#C77216' },
  sheet: { label: 'XLS', kind: 'Spreadsheet',     color: '#2F855A' },
  md:    { label: 'MD',  kind: 'Markdown',         color: '#566173' },
};

export function detectFileType(item: LibraryItem): FileDisplayType {
  if (item.content_type === 'writing_piece') return 'doc';
  if (item.content_type === 'collection') return 'doc';
  if (item.content_type === 'source_file') {
    const mime = item.content?.content_type || '';
    const filename = (item.content?.filename || '').toLowerCase();
    const ext = filename.split('.').pop() || '';
    if (mime.startsWith('image/')) return 'img';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (ext === 'md' || ext === 'markdown') return 'md';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
    return 'doc';
  }
  return 'doc';
}

export function getItemDisplayName(item: LibraryItem): string {
  if (item.is_folder) return item.title;
  if (item.content_type === 'writing_piece') return item.content.title;
  if (item.content_type === 'source_file') {
    return item.content?.filename || 'Untitled';
  }
  if (item.content_type === 'collection') return item.content.title;
  return 'Untitled';
}

export function getItemKind(item: LibraryItem): string {
  if (item.is_folder) return 'Folder';
  return FILE_TYPES[detectFileType(item)]?.kind || 'File';
}

export function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getItemSize(item: LibraryItem): string {
  if (item.content_type === 'source_file') {
    return formatBytes(item.content?.size_bytes);
  }
  return '';
}
