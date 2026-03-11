// extensions/streamCommandsRender.tsx
//
// Render adapter that bridges @tiptap/suggestion with the
// StreamCommandsList React component. Returns the render
// function expected by the Suggestion plugin's render option.

import { createRoot } from 'react-dom/client';
import type { SuggestionProps } from '@tiptap/suggestion';
import { StreamCommandsList } from './StreamCommandsList';
import type { StreamCommandItem } from './StreamCommands';
import type { StreamCommandsListRef } from './StreamCommandsList';

export const streamCommandsRender = () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;
  let componentRef: StreamCommandsListRef | null = null;

  return {
    onStart(props: SuggestionProps<StreamCommandItem>) {
      container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.zIndex = '9999';

      document.body.appendChild(container);
      root = createRoot(container);

      updatePosition(container, props);
      renderComponent(root, props);
    },

    onUpdate(props: SuggestionProps<StreamCommandItem>) {
      if (container) {
        updatePosition(container, props);
      }
      if (root) {
        renderComponent(root, props);
      }
    },

    onKeyDown(props: { event: KeyboardEvent }) {
      if (props.event.key === 'Escape') {
        cleanup();
        return true;
      }
      return componentRef?.onKeyDown(props) ?? false;
    },

    onExit() {
      cleanup();
    },
  };

  function renderComponent(
    rootEl: ReturnType<typeof createRoot>,
    props: SuggestionProps<StreamCommandItem>
  ) {
    rootEl.render(
      <StreamCommandsList
        ref={(ref) => {
          componentRef = ref;
        }}
        items={props.items}
        command={props.command}
      />
    );
  }

  function updatePosition(
    el: HTMLDivElement,
    props: SuggestionProps<StreamCommandItem>
  ) {
    const rect = props.clientRect?.();
    if (rect) {
      el.style.left = `${rect.left}px`;
      el.style.top = `${rect.bottom + 4}px`;
    }
  }

  function cleanup() {
    root?.unmount();
    root = null;
    container?.remove();
    container = null;
    componentRef = null;
  }
};
