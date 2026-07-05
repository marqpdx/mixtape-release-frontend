import type { ComponentType } from 'react';
import { IconFile, IconLink, IconVideo } from '@tabler/icons-react';
import type { LibraryItem } from '@mixtape/core/types/collectionTypes';
import { getFileTypeInfo } from '@/components/stackroom/utils/fileTypeHelpers';
import { getWritingKindInfo } from '@/components/stackroom/utils/writingKindHelpers';

export interface ItemTypeInfo {
  icon: ComponentType<{ size?: number; className?: string }>;
  colorScheme: string;
  label: string;
}

function getSourceFileTitle(item: LibraryItem): string {
  return 'title' in item ? (item as { title?: string }).title || '' : '';
}

export function getItemDisplayName(item: LibraryItem): string {
  if (item.is_folder) return item.title;
  if (item.content_type === 'writing_piece') return item.content.title;
  if (item.content_type === 'source_file') {
    return item.content?.filename || getSourceFileTitle(item) || 'Untitled file';
  }
  if (item.content_type === 'collection') return item.content.title;
  if (item.content_type === 'media_capture') return item.content.title || 'Untitled screencast';
  return 'Untitled';
}

/**
 * Icon / color / label for a file-list item — mirrors the admin collection
 * detail view (CollectionItemCard) so members see the same chip and pill
 * per file type, just inside the member explorer's row/card layout.
 */
export function getItemTypeInfo(item: LibraryItem): ItemTypeInfo {
  if (item.content_type === 'source_file') {
    const info = getFileTypeInfo(getItemDisplayName(item), item.content?.content_type);
    return { icon: info.icon, colorScheme: info.colorScheme, label: info.label };
  }
  if (item.content_type === 'writing_piece') {
    const info = getWritingKindInfo(item.content.writing_kind);
    return { icon: info.icon, colorScheme: info.colorScheme, label: info.label };
  }
  if (item.content_type === 'collection') {
    return { icon: IconLink, colorScheme: 'blue', label: 'Collection' };
  }
  if (item.content_type === 'media_capture') {
    return { icon: IconVideo, colorScheme: 'purple', label: 'Screencast' };
  }
  return { icon: IconFile, colorScheme: 'gray', label: 'File' };
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
