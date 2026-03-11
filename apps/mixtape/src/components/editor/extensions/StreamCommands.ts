// extensions/StreamCommands.ts
//
// TipTap extension that provides /new and /renew slash commands
// for artifact stream authoring. Uses @tiptap/suggestion to trigger
// a dropdown when the user types "/" at the start of a line.

import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions } from '@tiptap/suggestion';

export interface StreamCommandItem {
  id: string;
  label: string;
  description: string;
  command: string;
}

export interface StreamCommandsOptions {
  suggestion: Partial<SuggestionOptions<StreamCommandItem>>;
  onNewArtifact?: (type: string, title?: string) => Promise<void>;
  onRenew?: () => void;
}

export const streamCommandsPluginKey = new PluginKey('streamCommands');

const SUPPORTED_TYPES = ['writingpiece', 'event', 'course', 'seed'];
const TYPE_ALIASES: Record<string, string> = {
  article: 'writingpiece',
  post: 'writingpiece',
  writing: 'writingpiece',
  piece: 'writingpiece',
};

export function parseNewCommand(query: string): { type: string; title?: string } | null {
  const trimmed = query.trim();
  if (!trimmed.toLowerCase().startsWith('new')) return null;

  const afterNew = trimmed.slice(3).trim();
  if (!afterNew) return null;

  // Extract type (first word after "new")
  const spaceIdx = afterNew.indexOf(' ');
  const rawType = spaceIdx === -1 ? afterNew : afterNew.slice(0, spaceIdx);
  const normalizedType = rawType.toLowerCase();
  const resolvedType = TYPE_ALIASES[normalizedType] || normalizedType;

  if (!SUPPORTED_TYPES.includes(resolvedType)) return null;

  const title = spaceIdx === -1 ? undefined : afterNew.slice(spaceIdx + 1).trim() || undefined;

  return { type: resolvedType, title };
}

const defaultItems: StreamCommandItem[] = [
  {
    id: 'new-writingpiece',
    label: '/new WritingPiece',
    description: 'Start a new writing piece',
    command: 'new writingpiece',
  },
  {
    id: 'new-event',
    label: '/new Event',
    description: 'Create an event',
    command: 'new event',
  },
  {
    id: 'new-course',
    label: '/new Course',
    description: 'Create a course',
    command: 'new course',
  },
  {
    id: 'new-seed',
    label: '/new Seed',
    description: 'Plant a seed idea',
    command: 'new seed',
  },
  {
    id: 'renew',
    label: '/renew',
    description: 'Return to anchor artifact',
    command: 'renew',
  },
];

export const StreamCommands = Extension.create<StreamCommandsOptions>({
  name: 'streamCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        allowSpaces: true,
        pluginKey: streamCommandsPluginKey,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase();
          return defaultItems.filter(
            (item) =>
              item.command.toLowerCase().includes(q) ||
              item.label.toLowerCase().includes(q)
          );
        },
      },
      onNewArtifact: undefined,
      onRenew: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { onNewArtifact, onRenew } = this.options;

    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        command: ({ editor, range, props }) => {
          const item = props as unknown as StreamCommandItem;

          // Delete the slash command text
          editor.chain().focus().deleteRange(range).run();

          if (item.command === 'renew') {
            onRenew?.();
          } else {
            const parsed = parseNewCommand(item.command);
            if (parsed) {
              onNewArtifact?.(parsed.type, parsed.title);
            }
          }
        },
      }),
    ];
  },
});
