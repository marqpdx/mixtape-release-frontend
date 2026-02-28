// ContainerView.types.ts

import type { ReactNode } from "react"

/**
 * Minimal contract for any orderable item in a ContainerView.
 * Each consumer maps their domain type to this shape.
 */
export interface ContainerItem {
  /** Unique identifier, used as React key and dnd-kit id */
  id: string
  /** Primary display text */
  title: string
  /** Optional secondary text (excerpt, description) */
  subtitle?: string
  /** Optional image URL for grid thumbnails */
  thumbnail?: string
  /** ISO timestamp for date display */
  date?: string
  /** Ordering position (used by drag-to-reorder) */
  orderIndex?: number
  /** Passthrough for domain-specific data the consumer needs in render props */
  meta?: Record<string, unknown>
}

export type ViewMode = "grid" | "list"

export interface ContainerAction<T extends ContainerItem = ContainerItem> {
  label: string
  icon?: ReactNode
  onClick: (item: T) => void
  showIf?: (item: T) => boolean
  isDanger?: boolean
}

export interface ContainerViewProps<T extends ContainerItem = ContainerItem> {
  items: T[]
  viewMode: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onItemClick?: (item: T) => void
  onRemoveItem?: (item: T) => void
  actions?: ContainerAction<T>[]

  /** Enable drag-to-reorder */
  sortable?: boolean
  /** Called after drag completes with new ordered list of IDs */
  onReorder?: (orderedIds: string[]) => void | Promise<void>

  /** Override the grid card rendering */
  renderGridItem?: (item: T) => ReactNode
  /** Override the list row rendering */
  renderListItem?: (item: T) => ReactNode
  /** Override the item badge */
  renderBadge?: (item: T) => ReactNode

  isLoading?: boolean
  error?: string
  emptyStateMessage?: string
  emptyStateAction?: ReactNode
}
