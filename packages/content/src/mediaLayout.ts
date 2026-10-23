export type MediaAlignment = 'left' | 'center' | 'right'

export function normaliseMediaAlignment(value: unknown): MediaAlignment {
  return value === 'left' || value === 'right' ? value : 'center'
}

export function normaliseMediaWidth(value: unknown): number {
  if (value === null || value === undefined || value === '') return 60
  const width = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(width) ? Math.min(100, Math.max(1, width)) : 60
}

/** HTML fallback for the same placement contract used by MediaFigure. */
export function mediaPlacementStyle(value: unknown, widthPercent?: unknown): string {
  const alignment = normaliseMediaAlignment(value)
  const placement = alignment === 'center' ? 'float:none;margin:1.25rem auto'
    : alignment === 'left' ? 'float:left;margin:0 1.5rem 1.25rem 0' : 'float:right;margin:0 0 1.25rem 1.5rem'
  return `width:${normaliseMediaWidth(widthPercent)}%;height:auto;display:block;${placement}`
}
