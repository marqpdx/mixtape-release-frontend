// apps/mixtape/src/components/workbench/ListsTab.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  Badge,
  Checkbox,
  IconButton,
} from '@chakra-ui/react';
import { IconArrowsExchange } from '@tabler/icons-react';
import { useLists, useList, useCreateList, useUpdateList, useDeleteList } from '@mixtape/api/hooks/lists';
import { useAutosave } from '@mixtape/api/hooks/useAutosave';
import type { ListDetail } from '@mixtape/api/clients/lists';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { toaster } from '@mixtape/core/lib/toaster';

// Regex to match /list command at start of text
const LIST_COMMAND_REGEX = /^\/list(?:\s+(.*))?$/;

// Line prefixes we auto-continue
const LINE_PREFIXES = ['- ', 'x ', '* ', '  - ', '  x ', '  * '];

type ViewMode = 'code' | 'rendered';

export function ListsTab() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 80/20 UI state
  const [focusedView, setFocusedView] = useState<ViewMode>('code');
  const [leftView, setLeftView] = useState<ViewMode>('code');

  // Fetch lists
  const { lists, isLoading, error, refetch } = useLists();

  // Fetch selected list details
  const { list: selectedList } = useList({
    listId: selectedListId || '',
    enabled: !!selectedListId,
  });

  // Mutations
  const { mutateAsync: createList } = useCreateList();
  const { mutateAsync: updateList } = useUpdateList();
  const { mutate: deleteList, isPending: isDeletePending } = useDeleteList();
  // Local form state
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // For smart editing
  const [justInsertedPrefix, setJustInsertedPrefix] = useState(false);
  const lastPrefixRef = useRef<string>('');
  const justSavedRef = useRef(false); // Prevent sync overwriting local state after save

  // Parse /list Title from body text
  const parseListCommand = useCallback((text: string): { parsedTitle: string | null; bodyWithoutCommand: string } => {
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim() || '';
    const match = firstLine.match(LIST_COMMAND_REGEX);

    if (match) {
      const parsedTitle = match[1]?.trim() || '';
      const bodyWithoutCommand = lines.slice(1).join('\n');
      return { parsedTitle: parsedTitle || null, bodyWithoutCommand };
    }

    return { parsedTitle: null, bodyWithoutCommand: text };
  }, []);

  // Get effective title
  const getEffectiveTitle = useCallback(() => {
    const { parsedTitle } = parseListCommand(bodyText);
    return parsedTitle || title;
  }, [bodyText, title, parseListCommand]);

  const hasTitle = getEffectiveTitle().trim() !== '';
  const hasUnsavedContent = bodyText.trim() !== '' || title.trim() !== '';

  // Autosave handler
  const handleAutosave = useCallback(async (data: { title: string; bodyText: string; listId: string | null }) => {
    const { parsedTitle, bodyWithoutCommand } = parseListCommand(data.bodyText);
    const finalTitle = parsedTitle || data.title;
    const finalBody = parsedTitle !== null ? bodyWithoutCommand : data.bodyText;

    if (!finalTitle.trim()) return;

    if (data.listId) {
      await updateList({
        listId: data.listId,
        payload: { title: finalTitle.trim(), body_text: finalBody.trim() },
      });
    } else {
      const newList = await createList({
        title: finalTitle.trim(),
        body_text: finalBody.trim(),
      });
      setSelectedListId(newList.id);
    }
    setIsDirty(false);
    justSavedRef.current = true; // Prevent sync effect from overwriting local state
    refetch();
  }, [parseListCommand, updateList, createList, refetch]);

  const { status: saveStatus, schedule: scheduleAutosave, saveNow } = useAutosave({
    debounceMs: 2000,
    onSave: handleAutosave,
  });

  // Schedule autosave when content changes
  useEffect(() => {
    if (isDirty && hasTitle) {
      scheduleAutosave({ title, bodyText, listId: selectedListId });
    }
  }, [isDirty, hasTitle, title, bodyText, selectedListId, scheduleAutosave]);

  // Sync form state when selected list loads
  useEffect(() => {
    if (selectedList) {
      // Skip sync if we just saved - prevents overwriting local state with trimmed server state
      if (justSavedRef.current) {
        justSavedRef.current = false;
        return;
      }
      setTitle(selectedList.title);
      setBodyText(selectedList.body_text);
      setIsDirty(false);
    }
  }, [selectedList]);

  // Handle body text change
  const handleBodyTextChange = useCallback((newText: string) => {
    setBodyText(newText);
    setIsDirty(true);
    setJustInsertedPrefix(false);

    const { parsedTitle } = parseListCommand(newText);
    if (parsedTitle !== null && parsedTitle !== '') {
      setTitle(parsedTitle);
    }
  }, [parseListCommand]);

  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setIsDirty(true);

    const lines = bodyText.split('\n');
    const firstLine = lines[0]?.trim() || '';
    if (firstLine.match(LIST_COMMAND_REGEX)) {
      lines[0] = `/list ${newTitle}`;
      setBodyText(lines.join('\n'));
    }
  }, [bodyText]);

  // Handle selecting a list
  const handleSelectList = useCallback(async (listId: string) => {
    if (listId === selectedListId) return;

    if (hasUnsavedContent && isDirty) {
      if (hasTitle) {
        try {
          await saveNow({ title, bodyText, listId: selectedListId });
          setSelectedListId(listId);
        } catch {
          toaster.create({ title: 'Save Failed', type: 'error', duration: 3000 });
        }
      } else {
        setPendingSelectId(listId);
        return;
      }
    } else {
      setSelectedListId(listId);
    }
  }, [selectedListId, hasUnsavedContent, isDirty, hasTitle, title, bodyText, saveNow]);

  const handleDiscardAndSwitch = useCallback(() => {
    if (pendingSelectId) {
      setTitle('');
      setBodyText('');
      setIsDirty(false);
      setSelectedListId(pendingSelectId);
      setPendingSelectId(null);
    }
  }, [pendingSelectId]);

  const handleCancelSwitch = useCallback(() => {
    setPendingSelectId(null);
  }, []);

  const handleNewList = useCallback(async () => {
    if (hasUnsavedContent && isDirty && hasTitle) {
      try {
        await saveNow({ title, bodyText, listId: selectedListId });
      } catch {}
    }
    setSelectedListId(null);
    setTitle('');
    setBodyText('');
    setIsDirty(false);
    setFocusedView('code');
    textareaRef.current?.focus();
  }, [hasUnsavedContent, isDirty, hasTitle, title, bodyText, selectedListId, saveNow]);

  // Keyboard handler for code view
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { value, selectionStart, selectionEnd } = textarea;

    if (e.key === 'Tab' && e.altKey) {
      e.preventDefault();
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const newValue = before + '  ' + after;
      setBodyText(newValue);
      setIsDirty(true);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      });
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const beforeCursor = value.substring(0, selectionStart);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];

      for (const prefix of LINE_PREFIXES) {
        if (currentLine.startsWith(prefix)) {
          const content = currentLine.substring(prefix.length).trim();
          if (content === '') {
            e.preventDefault();
            const lineStart = beforeCursor.lastIndexOf('\n') + 1;
            const newValue = value.substring(0, lineStart) + value.substring(selectionStart);
            setBodyText(newValue);
            setIsDirty(true);
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStart;
            });
            return;
          }

          e.preventDefault();
          const after = value.substring(selectionEnd);
          // Convert 'x ' to '- ' for new lines (don't start new line as completed)
          // Also handle indented versions: '  x ' -> '  - '
          const newLinePrefix = prefix.replace(/x /, '- ');
          const newValue = beforeCursor + '\n' + newLinePrefix + after;
          setBodyText(newValue);
          setIsDirty(true);
          lastPrefixRef.current = newLinePrefix;
          setJustInsertedPrefix(true);
          requestAnimationFrame(() => {
            const newPos = selectionStart + 1 + newLinePrefix.length;
            textarea.selectionStart = textarea.selectionEnd = newPos;
          });
          return;
        }
      }
    }

    if (e.key === 'Backspace' && justInsertedPrefix && lastPrefixRef.current) {
      const beforeCursor = value.substring(0, selectionStart);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      const prefix = lastPrefixRef.current;

      if (currentLine === prefix) {
        e.preventDefault();
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const newValue = value.substring(0, lineStart) + value.substring(selectionStart);
        setBodyText(newValue);
        setIsDirty(true);
        setJustInsertedPrefix(false);
        lastPrefixRef.current = '';
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart;
        });
        return;
      }
    }

    if (e.key !== 'Backspace') {
      setJustInsertedPrefix(false);
    }
  }, [justInsertedPrefix]);

  // Toggle item in rendered view - triggers autosave
  const handleToggleItem = useCallback((itemIndex: number) => {
    // Update local state immediately for responsiveness
    const lines = bodyText.split('\n');
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;

      // Check if this is a list item
      if (trimmed.startsWith('- ') || trimmed.startsWith('x ') || trimmed.startsWith('* ')) {
        if (currentIndex === itemIndex) {
          // Toggle this line
          const prefix = line.substring(0, indent);
          if (trimmed.startsWith('- ')) {
            lines[i] = prefix + 'x ' + trimmed.substring(2);
          } else if (trimmed.startsWith('x ')) {
            lines[i] = prefix + '- ' + trimmed.substring(2);
          }
          // Notes (*) don't toggle
          break;
        }
        currentIndex++;
      }
    }

    const newBodyText = lines.join('\n');
    setBodyText(newBodyText);
    setIsDirty(true);

    // Trigger immediate autosave for checkbox changes
    if (hasTitle) {
      scheduleAutosave({ title, bodyText: newBodyText, listId: selectedListId });
    }
  }, [bodyText, hasTitle, title, selectedListId, scheduleAutosave]);

  // Flip left/right views
  const handleFlipViews = useCallback(() => {
    setLeftView(prev => prev === 'code' ? 'rendered' : 'code');
  }, []);

  // Focus a view
  const handleFocusView = useCallback((view: ViewMode) => {
    setFocusedView(view);
    if (view === 'code') {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, []);

  // Parse items for rendered view
  const parsedItems = parseItemsFromText(bodyText);

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (!hasTitle) {
      toaster.create({ title: 'Title Required', type: 'warning', duration: 3000 });
      return;
    }
    try {
      await saveNow({ title, bodyText, listId: selectedListId });
      toaster.create({ title: 'Saved', type: 'success', duration: 1500 });
    } catch {
      toaster.create({ title: 'Save Failed', type: 'error', duration: 3000 });
    }
  }, [hasTitle, title, bodyText, selectedListId, saveNow]);

  // Delete handler
  const handleDelete = useCallback(() => {
    if (!selectedListId) return;
    deleteList(selectedListId, {
      onSuccess: () => {
        toaster.create({ title: 'List Deleted', type: 'info', duration: 2000 });
        setSelectedListId(null);
        setTitle('');
        setBodyText('');
        setIsDirty(false);
      },
      onError: (err: Error) => {
        toaster.create({ title: 'Delete Failed', description: err.message, type: 'error', duration: 5000 });
      },
    });
  }, [selectedListId, deleteList]);

  // Status helpers
  const getSaveStatusText = () => {
    if (!hasTitle && hasUnsavedContent) return 'Add title to save';
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved';
      case 'error': return 'Save error';
      default: return isDirty ? 'Unsaved' : '';
    }
  };

  const getSaveStatusColor = () => {
    if (!hasTitle && hasUnsavedContent) return 'orange.500';
    switch (saveStatus) {
      case 'saving': return 'blue.500';
      case 'saved': return 'green.500';
      case 'error': return 'red.500';
      default: return isDirty ? 'orange.500' : 'gray.400';
    }
  };

  if (error) {
    return <MixtapeAlert status="error" title="Failed to Load Lists" description={error.message} />;
  }

  if (isLoading) {
    return <Box p={8} textAlign="center"><Text color="gray.500">Loading lists...</Text></Box>;
  }

  // Determine which view is on which side
  const rightView: ViewMode = leftView === 'code' ? 'rendered' : 'code';

  const discardSwitch = (
    <HStack mt={2} gap={2}>
      <Button size="xs" colorScheme="red" variant="outline" onClick={handleDiscardAndSwitch}>Discard</Button>
      <Button size="xs" variant="ghost" onClick={handleCancelSwitch}>Cancel</Button>
    </HStack>
  )

  return (
    <Grid templateColumns="220px 1fr" gap={4} h="calc(100vh - 250px)">
      {/* Left Sidebar: List of Lists */}
      <GridItem borderRight="1px" borderColor="gray.200" pr={4}>
        <VStack align="stretch" gap={2}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600">
              Lists ({lists.length})
            </Text>
            <Button size="xs" variant="ghost" onClick={handleNewList}>+ New</Button>
          </HStack>

          {lists.length === 0 && (
            <Box p={3} textAlign="center" color="gray.400">
              <Text fontSize="xs">Start typing to create</Text>
            </Box>
          )}

          {lists.map((list: ListDetail) => (
            <Box
              key={list.id}
              p={2}
              border="1px"
              borderColor={selectedListId === list.id ? 'blue.500' : 'gray.200'}
              borderRadius="md"
              bg={selectedListId === list.id ? 'blue.50' : 'white'}
              cursor="pointer"
              _hover={{ borderColor: 'blue.300' }}
              onClick={() => handleSelectList(list.id)}
            >
              <Text fontSize="xs" fontWeight="semibold" lineClamp={1}>{list.title}</Text>
              <HStack mt={1} gap={1}>
                {list.stats.open > 0 && <Badge size="xs" colorScheme="orange">{list.stats.open}</Badge>}
                {list.stats.done > 0 && <Badge size="xs" colorScheme="green">{list.stats.done}</Badge>}
              </HStack>
            </Box>
          ))}
        </VStack>
      </GridItem>

      {/* Main Editor Area - 80/20 Split */}
      <GridItem>
        <VStack align="stretch" gap={2} h="full">
          {/* Pending switch dialog */}
          {pendingSelectId && (
            <Box>
              <MixtapeAlert status="warning" title="Unsaved Draft" description="Discard untitled draft?" />
              {discardSwitch}
            </Box>
          )}

          {/* Header */}
          <HStack justify="space-between">
            <HStack gap={2}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                {selectedListId ? (selectedList?.title || 'Loading...') : 'New List'}
              </Text>
              <IconButton
                aria-label="Flip views"
                size="xs"
                variant="ghost"
                onClick={handleFlipViews}
              >
                <IconArrowsExchange size={14} />
              </IconButton>
            </HStack>
            <Text fontSize="xs" color={getSaveStatusColor()}>{getSaveStatusText()}</Text>
          </HStack>

          {/* 80/20 Split Editor */}
          <Box flex="1" display="flex" gap={0} overflow="hidden" border="1px" borderColor="gray.200" borderRadius="md">
            {/* Left Panel */}
            <Box
              flex={focusedView === leftView ? '4' : '1'}
              transition="flex 0.2s ease"
              onClick={() => handleFocusView(leftView)}
              cursor={focusedView !== leftView ? 'pointer' : 'default'}
              position="relative"
              borderRight="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {leftView === 'code' ? (
                <CodeView
                  ref={textareaRef}
                  value={bodyText}
                  onChange={handleBodyTextChange}
                  onKeyDown={handleKeyDown}
                  isFocused={focusedView === 'code'}
                  isReadOnly={focusedView !== 'code'}
                />
              ) : (
                <RenderedView
                  items={parsedItems}
                  onToggle={handleToggleItem}
                  isFocused={focusedView === 'rendered'}
                  isReadOnly={focusedView !== 'rendered'}
                />
              )}
            </Box>

            {/* Right Panel */}
            <Box
              flex={focusedView === rightView ? '4' : '1'}
              transition="flex 0.2s ease"
              onClick={() => handleFocusView(rightView)}
              cursor={focusedView !== rightView ? 'pointer' : 'default'}
              position="relative"
              overflow="hidden"
            >
              {rightView === 'code' ? (
                <CodeView
                  ref={focusedView === 'code' && rightView === 'code' ? textareaRef : undefined}
                  value={bodyText}
                  onChange={handleBodyTextChange}
                  onKeyDown={handleKeyDown}
                  isFocused={focusedView === 'code'}
                  isReadOnly={focusedView !== 'code'}
                />
              ) : (
                <RenderedView
                  items={parsedItems}
                  onToggle={handleToggleItem}
                  isFocused={focusedView === 'rendered'}
                  isReadOnly={focusedView !== 'rendered'}
                />
              )}
            </Box>
          </Box>

          {/* Title & Actions */}
          <HStack gap={3}>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={hasTitle ? '' : 'Title (or /list Title above)'}
              size="sm"
              flex="1"
            />
            <Button size="sm" colorScheme="blue" onClick={handleManualSave} disabled={!hasTitle || !isDirty}>
              Save
            </Button>
            {selectedListId && (
              <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} loading={isDeletePending}>
                Delete
              </Button>
            )}
          </HStack>
        </VStack>
      </GridItem>
    </Grid>
  );
}

// ============================================================================
// CODE VIEW
// ============================================================================

import { forwardRef } from 'react';

interface CodeViewProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isFocused: boolean;
  isReadOnly: boolean;
}

const CodeView = forwardRef<HTMLTextAreaElement, CodeViewProps>(
  ({ value, onChange, onKeyDown, isFocused, isReadOnly }, ref) => {
    return (
      <Box h="100%" p={2} bg={isFocused ? 'white' : 'gray.50'}>
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isFocused ? `/list Title\n- task\nx done\n* note` : ''}
          h="100%"
          border="none"
          resize="none"
          fontFamily="mono"
          fontSize={isFocused ? 'sm' : 'xs'}
          color={isFocused ? 'gray.800' : 'gray.400'}
          bg="transparent"
          _focus={{ outline: 'none', boxShadow: 'none' }}
          readOnly={isReadOnly}
          cursor={isReadOnly ? 'pointer' : 'text'}
        />
      </Box>
    );
  }
);
CodeView.displayName = 'CodeView';

// ============================================================================
// RENDERED VIEW
// ============================================================================

interface ParsedItem {
  type: 'action_open' | 'action_done' | 'note';
  text: string;
  index: number;
  depth: number;
  due?: string;
}

interface RenderedViewProps {
  items: ParsedItem[];
  onToggle: (index: number) => void;
  isFocused: boolean;
  isReadOnly: boolean;
}

function RenderedView({ items, onToggle, isFocused, isReadOnly }: RenderedViewProps) {
  if (items.length === 0) {
    return (
      <Box h="100%" p={3} bg={isFocused ? 'white' : 'gray.50'} display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xs" color="gray.400">
          {isFocused ? 'No items yet' : ''}
        </Text>
      </Box>
    );
  }

  return (
    <Box h="100%" p={2} bg={isFocused ? 'white' : 'gray.50'} overflowY="auto">
      <VStack align="stretch" gap={0}>
        {items.map((item) => (
          <HStack
            key={item.index}
            py={isFocused ? 1 : 0.5}
            pl={item.depth * 4}
            opacity={item.type === 'action_done' ? 0.5 : 1}
            _hover={isFocused && !isReadOnly ? { bg: 'gray.50' } : undefined}
          >
            {item.type !== 'note' ? (
              <Checkbox.Root
                checked={item.type === 'action_done'}
                onCheckedChange={() => !isReadOnly && onToggle(item.index)}
                disabled={isReadOnly}
                size="sm"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox.Root>
            ) : (
              <Text color="gray.400" fontSize="xs" w="18px" textAlign="center">*</Text>
            )}
            <Text
              fontSize={isFocused ? 'sm' : 'xs'}
              color={isFocused ? (item.type === 'action_done' ? 'gray.500' : 'gray.800') : 'gray.400'}
              textDecoration={item.type === 'action_done' ? 'line-through' : 'none'}
              flex="1"
              lineClamp={isFocused ? undefined : 1}
            >
              {item.text}
            </Text>
            {item.due && isFocused && (
              <Badge size="xs" colorScheme="purple">{item.due}</Badge>
            )}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

// ============================================================================
// PARSER HELPER
// ============================================================================

function parseItemsFromText(text: string): ParsedItem[] {
  if (!text.trim()) return [];

  const lines = text.split('\n');
  const items: ParsedItem[] = [];
  let index = 0;

  for (const line of lines) {
    // Skip /list command line
    if (line.trim().match(LIST_COMMAND_REGEX)) continue;
    if (!line.trim()) continue;

    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    const depth = Math.floor(indent / 2);

    // Extract /due directive
    const dueMatch = trimmed.match(/\s*\/due\s+(.+)$/i);
    const due = dueMatch ? dueMatch[1].trim() : undefined;
    const textWithoutDue = dueMatch ? trimmed.substring(0, trimmed.length - dueMatch[0].length) : trimmed;

    if (textWithoutDue.startsWith('- ')) {
      items.push({ type: 'action_open', text: textWithoutDue.substring(2), index, depth, due });
      index++;
    } else if (textWithoutDue.startsWith('x ')) {
      items.push({ type: 'action_done', text: textWithoutDue.substring(2), index, depth, due });
      index++;
    } else if (textWithoutDue.startsWith('* ')) {
      items.push({ type: 'note', text: textWithoutDue.substring(2), index, depth, due });
      index++;
    }
  }

  return items;
}
