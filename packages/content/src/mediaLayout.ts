export type MediaAlignment = 'left' | 'center' | 'right'

export function normaliseMediaAlignment(value: unknown): MediaAlignment {
  return value === 'left' || value === 'right' ? value : 'center'
}

/** HTML fallback for the same placement contract used by MediaFigure. */
export function mediaPlacementStyle(value: unknown): string {
  const alignment = normaliseMediaAlignment(value)
  const placement = alignment === 'center' ? 'float:none;margin:1.25rem auto'
    : alignment === 'left' ? 'float:left;margin:0 1.5rem 1.25rem 0' : 'float:right;margin:0 0 1.25rem 1.5rem'
  return `width:60%;height:auto;display:block;${placement}`
}
