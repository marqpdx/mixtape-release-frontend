// @mixtape/content - dialogueBlockCss
// The look of the editor's "Dialogue: Me" / "Dialogue: Agent" blocks
// (<blockquote data-chat-role="querent|respondent">). Spread into a Chakra
// `css` object above the blockquotes. Shared by both editors and the
// Dialogue aside popover so the three stay identical.

export const dialogueBlockCss = {
  '& blockquote[data-chat-role]': {
    position: 'relative',
    borderLeftWidth: '3px',
    borderRadius: '4px',
    padding: '1.6em 1em 0.5em',
    marginBlock: '1em',
    background: 'var(--chakra-colors-bg-subtle)',
    fontStyle: 'normal',
  },
  '& blockquote[data-chat-role]::before': {
    position: 'absolute',
    top: '0.4em',
    left: '1em',
    fontSize: '0.7em',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  "& blockquote[data-chat-role='querent']": {
    borderLeftColor: 'var(--chakra-colors-teal-500)',
  },
  "& blockquote[data-chat-role='querent']::before": {
    content: '"Me"',
    color: 'var(--chakra-colors-teal-600)',
  },
  "& blockquote[data-chat-role='respondent']": {
    borderLeftColor: 'var(--chakra-colors-blue-500)',
  },
  "& blockquote[data-chat-role='respondent']::before": {
    content: '"Agent"',
    color: 'var(--chakra-colors-blue-600)',
  },
} as const
