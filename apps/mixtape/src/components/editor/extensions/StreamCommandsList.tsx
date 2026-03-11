// extensions/StreamCommandsList.tsx
//
// Dropdown component rendered by the StreamCommands suggestion.
// Shows available /new and /renew commands with keyboard navigation.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react';
import type { StreamCommandItem } from './StreamCommands';

interface StreamCommandsListProps {
  items: StreamCommandItem[];
  command: (item: StreamCommandItem) => void;
}

export interface StreamCommandsListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const StreamCommandsList = forwardRef<
  StreamCommandsListRef,
  StreamCommandsListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [command, items]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--chakra-colors-bg-panel, #fff)',
        border: '1px solid var(--chakra-colors-border, #e2e8f0)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '4px',
        minWidth: '240px',
        maxWidth: '320px',
        zIndex: 9999,
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '8px 12px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor:
              index === selectedIndex
                ? 'var(--chakra-colors-blue-50, #ebf8ff)'
                : 'transparent',
            transition: 'background-color 0.1s',
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--chakra-colors-fg, inherit)',
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--chakra-colors-fg-muted, #718096)',
              marginTop: '2px',
            }}
          >
            {item.description}
          </div>
        </button>
      ))}
    </div>
  );
});

StreamCommandsList.displayName = 'StreamCommandsList';
