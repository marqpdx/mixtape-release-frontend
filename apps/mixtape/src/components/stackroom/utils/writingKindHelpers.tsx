// Helpers for WritingPiece kind badges and icons

import {
  IconFileText,
  IconNews,
  IconMessages,
  IconSpeakerphone,
  IconFile,
  IconCalendar,
} from '@tabler/icons-react';

export type WritingKind = 'dispatch' | 'article' | 'post' | 'announcement' | 'page' | 'forum' | 'almanac' | 'other';

export interface WritingKindInfo {
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  colorScheme: string;
  emoji: string;
}

export const WRITING_KIND_INFO: Record<WritingKind, WritingKindInfo> = {
  dispatch: {
    label: 'Collaborative',
    icon: IconMessages,
    colorScheme: 'purple',
    emoji: '📝',
  },
  article: {
    label: 'Article',
    icon: IconNews,
    colorScheme: 'blue',
    emoji: '📰',
  },
  post: {
    label: 'Post',
    icon: IconFileText,
    colorScheme: 'green',
    emoji: '✍️',
  },
  announcement: {
    label: 'Announcement',
    icon: IconSpeakerphone,
    colorScheme: 'orange',
    emoji: '📢',
  },
  page: {
    label: 'Page',
    icon: IconFile,
    colorScheme: 'gray',
    emoji: '📄',
  },
  forum: {
    label: 'Forum',
    icon: IconMessages,
    colorScheme: 'teal',
    emoji: '💬',
  },
  almanac: {
    label: 'Event',
    icon: IconCalendar,
    colorScheme: 'pink',
    emoji: '📅',
  },
  other: {
    label: 'Document',
    icon: IconFile,
    colorScheme: 'gray',
    emoji: '📄',
  },
};

/**
 * Get display info for a writing kind
 */
export function getWritingKindInfo(kind: string): WritingKindInfo {
  return WRITING_KIND_INFO[kind as WritingKind] || WRITING_KIND_INFO.other;
}

/**
 * Get badge label for writing kind
 */
export function getWritingKindLabel(kind: string): string {
  return getWritingKindInfo(kind).label;
}

/**
 * Get color scheme for writing kind badge
 */
export function getWritingKindColor(kind: string): string {
  return getWritingKindInfo(kind).colorScheme;
}

/**
 * Get emoji for writing kind
 */
export function getWritingKindEmoji(kind: string): string {
  return getWritingKindInfo(kind).emoji;
}

/**
 * Get icon component for writing kind
 */
export function getWritingKindIcon(kind: string): React.ComponentType<{ className?: string; size?: number }> {
  return getWritingKindInfo(kind).icon;
}
