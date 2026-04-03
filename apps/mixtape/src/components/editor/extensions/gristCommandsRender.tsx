// extensions/gristCommandsRender.tsx
//
// Render adapter that bridges @tiptap/suggestion with the
// GristCommandsList React component.

import { createRoot } from 'react-dom/client'
import type { SuggestionProps } from '@tiptap/suggestion'
import { GristCommandsList } from './GristCommandsList'
import type { GristCommandItem, GristCommandsListRef } from './GristCommandsList'

export const gristCommandsRender = () => {
  let container: HTMLDivElement | null = null
  let root: ReturnType<typeof createRoot> | null = null
  let componentRef: GristCommandsListRef | null = null

  return {
    onStart(props: SuggestionProps<GristCommandItem>) {
      container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.zIndex = '9999'
      document.body.appendChild(container)
      root = createRoot(container)
      updatePosition(container, props)
      renderComponent(root, props)
    },

    onUpdate(props: SuggestionProps<GristCommandItem>) {
      if (container) updatePosition(container, props)
      if (root) renderComponent(root, props)
    },

    onKeyDown(props: { event: KeyboardEvent }) {
      if (props.event.key === 'Escape') {
        cleanup()
        return true
      }
      return componentRef?.onKeyDown(props) ?? false
    },

    onExit() {
      cleanup()
    },
  }

  function renderComponent(
    rootEl: ReturnType<typeof createRoot>,
    props: SuggestionProps<GristCommandItem>
  ) {
    rootEl.render(
      <GristCommandsList
        ref={(ref) => {
          componentRef = ref
        }}
        items={props.items}
        command={props.command}
      />
    )
  }

  function updatePosition(el: HTMLDivElement, props: SuggestionProps<GristCommandItem>) {
    const rect = props.clientRect?.()
    if (rect) {
      el.style.left = `${rect.left}px`
      el.style.top = `${rect.bottom + 4}px`
    }
  }

  function cleanup() {
    root?.unmount()
    root = null
    container?.remove()
    container = null
    componentRef = null
  }
}
