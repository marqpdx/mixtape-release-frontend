// @mixtape/content - writingExtras
// Inline "Extras" nodes from the writing toolbar, drawn the same way in the
// editor (via node views) and in the read-only TipTapRenderer:
//   colorCircle    - a filled circle one capital letter tall; hover shows the hex.
//   dialogueAside  - a short visible phrase; hover shows the opening of the
//                    request, click opens a popover with both sides of the
//                    exchange in the Me/Agent style of the Dialogue blocks.

'use client'

import { Box, Popover, Portal, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { dialogueBlockCss } from './dialogueBlockCss'

// ---------- Color Circle ----------

/** "#abc", "abc", "#aabbcc" or "aabbcc" → "#aabbcc"; anything else → null. */
export function normaliseHex(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const raw = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(raw)) return `#${raw.split('').map((c) => c + c).join('')}`.toUpperCase()
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toUpperCase()
  return null
}

/** The circle's look. `1cap` is the current font's capital-letter height. */
export const colorCircleCss = {
  display: 'inline-block',
  width: '1cap',
  height: '1cap',
  borderRadius: '50%',
  verticalAlign: 'baseline',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)',
  marginInline: '0.08em',
} as const

/** The same look as an inline style string, for the editor's renderHTML. */
export const colorCircleStyle = (hex: string) =>
  `display:inline-block;width:1cap;height:1cap;border-radius:50%;vertical-align:baseline;` +
  `box-shadow:inset 0 0 0 1px rgba(0,0,0,0.18);margin-inline:0.08em;background-color:${hex}`

export function ColorCircle({ hex }: { hex: unknown }) {
  const color = normaliseHex(hex)
  if (!color) return null
  return (
    <span
      className="wx-color-circle"
      data-color-circle={color}
      title={color}
      role="img"
      aria-label={`Colour ${color}`}
      style={{ ...colorCircleCss, backgroundColor: color }}
    />
  )
}

// ---------- Dialogue Aside ----------

export interface DialogueAsideAttrs {
  label: string
  request: string
  response: string
}

export function readDialogueAside(attrs: Record<string, unknown> | undefined): DialogueAsideAttrs {
  const text = (value: unknown) => (typeof value === 'string' ? value : '')
  return { label: text(attrs?.label), request: text(attrs?.request), response: text(attrs?.response) }
}

/** The hover text: the opening of the request, then a hint. */
export function dialogueAsidePreview(request: string, max = 140): string {
  const flat = request.replace(/\s+/g, ' ').trim()
  const opening = flat.length > max ? `${flat.slice(0, max).replace(/\s+\S*$/, '')}…` : flat
  return opening ? `“${opening}”\nClick to see the exchange.` : 'Click to see the exchange.'
}

function Turn({ side, text }: { side: 'querent' | 'respondent'; text: string }) {
  return (
    <blockquote className={`wx-aside-turn wx-aside-${side}`} data-chat-role={side}>
      {text.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
    </blockquote>
  )
}

/** The editor's Dialogue block look (dialogueBlockCss), sized for a popover. */
const asideTurnsCss = {
  fontSize: '15px',
  lineHeight: 1.6,
  ...dialogueBlockCss,
  '& blockquote[data-chat-role]:first-of-type': { marginTop: 0 },
  '& blockquote[data-chat-role]:last-of-type': { marginBottom: 0 },
  '& blockquote p': { margin: 0, whiteSpace: 'pre-wrap' },
  '& blockquote p + p': { marginTop: '0.75em' },
} as const

/**
 * The visible phrase plus its popover. `footer` lets the editor add an Edit
 * button; readers get none.
 */
export function DialogueAside({ attrs, footer }: { attrs: Record<string, unknown> | undefined; footer?: ReactNode }) {
  const { label, request, response } = readDialogueAside(attrs)
  return (
    <Popover.Root positioning={{ placement: 'bottom-start' }} lazyMount unmountOnExit>
      <Popover.Trigger asChild>
        <Box
          as="span"
          className="wx-dialogue-aside"
          data-dialogue-aside=""
          role="button"
          tabIndex={0}
          title={dialogueAsidePreview(request)}
          cursor="pointer"
          textDecorationLine="underline"
          textDecorationStyle="dotted"
          textDecorationColor="teal.500"
          textDecorationThickness="2px"
          textUnderlineOffset="3px"
          _hover={{ bg: 'bg.subtle' }}
          borderRadius="sm"
        >
          {label || 'aside'}
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner zIndex={1600}>
          <Popover.Content className="wx-aside-popover" w="min(520px, calc(100vw - 32px))" maxH="70vh" overflowY="auto">
            <Popover.Arrow><Popover.ArrowTip /></Popover.Arrow>
            <Popover.Body display="flex" flexDirection="column" gap={3} p={4}>
              <Box className="wx-aside-turns" css={asideTurnsCss}>
                {request && <Turn side="querent" text={request} />}
                {response && <Turn side="respondent" text={response} />}
              </Box>
              {!request && !response && <Text fontSize="sm" color="fg.muted">This aside has no exchange yet.</Text>}
              {footer}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
}
