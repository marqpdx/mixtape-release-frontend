// @mixtape/content - codeHighlight
// One syntax highlighter for code blocks, shared by the TipTap editors (through
// CodeBlockLowlight) and the read-only TipTapRenderer, so a block looks the same
// while it is written and once it is published.

import type { ReactNode } from 'react'
import { createLowlight } from 'lowlight'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import bash from 'highlight.js/lib/languages/bash'

export const CODE_LANGUAGES = [
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'bash', label: 'Bash' },
] as const

export type CodeLanguage = (typeof CODE_LANGUAGES)[number]['value']

export const codeLowlight = createLowlight({ json, python, typescript, bash })
codeLowlight.registerAlias({ python: ['py'], typescript: ['ts', 'tsx'], bash: ['sh', 'shell', 'zsh'] })

export function codeLanguageLabel(language: unknown): string | null {
  if (typeof language !== 'string') return null
  return CODE_LANGUAGES.find((entry) => entry.value === language)?.label ?? null
}

type HastNode =
  | { type: 'text'; value: string }
  | { type: 'element'; properties?: { className?: unknown }; children: HastNode[] }
  | { type: string; children?: HastNode[] }

function toReact(nodes: HastNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`
    if (node.type === 'text') return (node as { value: string }).value
    if (node.type === 'element') {
      const element = node as { properties?: { className?: unknown }; children: HastNode[] }
      const className = Array.isArray(element.properties?.className)
        ? element.properties.className.join(' ')
        : undefined
      return (
        <span key={key} className={className}>
          {toReact(element.children, key)}
        </span>
      )
    }
    return null
  })
}

/** Highlighted spans for the reader. Unknown or missing languages are guessed among the four. */
export function renderHighlightedCode(code: string, language: unknown): ReactNode[] {
  if (!code) return []
  try {
    const tree =
      typeof language === 'string' && codeLowlight.registered(language)
        ? codeLowlight.highlight(language, code)
        : codeLowlight.highlightAuto(code)
    return toReact(tree.children as HastNode[], 'hl')
  } catch {
    return [code]
  }
}

// A named syntax palette (a deliberate palette, outside the theme tokens). Every
// colour clears 7:1 against its own block background, light and dark, so it also
// meets the high-contrast bar. Checked 2026-11-13.
const SYNTAX_LIGHT = {
  '--code-bg': '#F6F8FA',
  '--code-border': '#D1D9E0',
  '--code-fg': '#1F2328',
  '--code-key': '#0B5B2A',
  '--code-string': '#0A3069',
  '--code-number': '#0550AE',
  '--code-literal': '#5A32A3',
  '--code-keyword': '#A40E26',
  '--code-comment': '#454C55',
  '--code-builtin': '#7A2E00',
  '--code-label': '#454C55',
}

const SYNTAX_DARK = {
  '--code-bg': '#0D1117',
  '--code-border': '#3D444D',
  '--code-fg': '#E6EDF3',
  '--code-key': '#7EE787',
  '--code-string': '#A5D6FF',
  '--code-number': '#79C0FF',
  '--code-literal': '#D2A8FF',
  '--code-keyword': '#FF7B72',
  '--code-comment': '#A2A9B3',
  '--code-builtin': '#FFA657',
  '--code-label': '#A2A9B3',
}

const languageBadges = Object.fromEntries(
  CODE_LANGUAGES.map(({ value, label }) => [
    `&:has(code.language-${value})::before`,
    { content: `"${label}"` },
  ]),
)

/** Styles for a `<pre><code>` block. Spread onto the `pre` selector of a Chakra `css` prop. */
export const codeBlockCss = {
  ...SYNTAX_LIGHT,
  _dark: SYNTAX_DARK,
  position: 'relative',
  bg: 'var(--code-bg)',
  color: 'var(--code-fg)',
  border: '1px solid var(--code-border)',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0.75em 0',
  overflowX: 'auto',
  fontFamily: 'var(--chakra-fonts-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
  fontSize: '13px',
  lineHeight: '1.6',
  tabSize: 2,
  whiteSpace: 'pre',
  '& code': {
    bg: 'transparent',
    color: 'inherit',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    whiteSpace: 'inherit',
  },
  '&::before': {
    position: 'absolute',
    top: '6px',
    right: '10px',
    fontFamily: 'inherit',
    fontSize: '10px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--code-label)',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  ...languageBadges,
  '& .hljs-attr, & .hljs-attribute': { color: 'var(--code-key)' },
  '& .hljs-string, & .hljs-regexp, & .hljs-template-string': { color: 'var(--code-string)' },
  '& .hljs-number': { color: 'var(--code-number)' },
  '& .hljs-literal, & .hljs-title, & .hljs-title.function_, & .hljs-title.class_': { color: 'var(--code-literal)' },
  '& .hljs-keyword, & .hljs-selector-tag, & .hljs-type': { color: 'var(--code-keyword)' },
  '& .hljs-built_in, & .hljs-variable, & .hljs-params, & .hljs-meta': { color: 'var(--code-builtin)' },
  '& .hljs-comment, & .hljs-quote': { color: 'var(--code-comment)', fontStyle: 'italic' },
  '& .hljs-subst, & .hljs-punctuation': { color: 'var(--code-fg)' },
  // highlight.js marks JSON's true, false and null as keywords; show them as literals.
  '& code.language-json .hljs-keyword': { color: 'var(--code-literal)' },
} as const
