'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useDissolve, DISSOLVE_DURATION_MS } from '@mixtape/ui/dissolve'
import { interactivePageForReadingUrl, type InteractivePage } from './interactivePages'

type OpenTopology = (artifact: InteractivePage, trigger: HTMLElement) => void
const TopologyReadingContext = createContext<OpenTopology | null>(null)
export const useTopologyReadingSurface = () => useContext(TopologyReadingContext)

/** Retains the server-rendered manuscript while its reading area dissolves to a map. */
export function TopologyReadingSurface({ children, backLink, className = '', style, returnLabel = 'Return to article' }: {
  children: ReactNode
  backLink: ReactNode
  className?: string
  style?: CSSProperties
  returnLabel?: string
}) {
  const [artifact, setArtifact] = useState<InteractivePage | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [frameVersion, setFrameVersion] = useState(0)
  const [frameHeight, setFrameHeight] = useState(600)
  const requested = useRef<InteractivePage | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const returnButton = useRef<HTMLButtonElement>(null)
  const backRow = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const scroll = useRef({ x: 0, y: 0 })
  const owner = useRef('')
  const returning = useRef(false)
  const restoreFrame = useRef<number | null>(null)

  // Shared Dissolve primitive (decisions/dissolve-outer-rim-adr) — reconciled
  // from this component's prior bespoke 120ms/matchMedia timer to the
  // canonical 150ms, with prefers-reduced-motion handling moved into the hook.
  const { dissolving: fading, dissolveTo } = useDissolve({ regionKey: 'topology-reading-surface' })

  const transition = useCallback((next: InteractivePage | null) => {
    if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current)
    requested.current = next
    returning.current = false
    dissolveTo(() => {
      setLoaded(false)
      setArtifact(next)
      // Wait for React to expose the destination before focusing or restoring scroll.
      restoreFrame.current = requestAnimationFrame(() => {
        restoreFrame.current = requestAnimationFrame(() => {
          restoreFrame.current = null
          if (next) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
            returnButton.current?.focus({ preventScroll: true })
          } else {
            const target = trigger.current?.isConnected ? trigger.current : backRow.current?.querySelector<HTMLElement>('a, button')
            target?.focus({ preventScroll: true })
            window.scrollTo({ left: scroll.current.x, top: scroll.current.y, behavior: 'instant' })
          }
        })
      })
    })
  }, [dissolveTo])

  const openTopology = useCallback<OpenTopology>((next, source) => {
    if (!requested.current) scroll.current = { x: window.scrollX, y: window.scrollY }
    trigger.current = source
    if (!owner.current) owner.current = crypto.randomUUID()
    const url = new URL(window.location.href)
    const pageUrl = new URL(next.htmlUrl)
    url.searchParams.set('interactivePage', pageUrl.pathname + pageUrl.search + pageUrl.hash)
    url.searchParams.delete('topology')
    window.history.pushState({ ...window.history.state, readingTopologyOwner: owner.current }, '', url)
    transition(next)
  }, [transition])

  const returnToReading = useCallback(() => {
    if (returning.current || !requested.current) return
    returning.current = true
    if (owner.current && window.history.state?.readingTopologyOwner === owner.current) {
      window.history.back()
    } else {
      // A directly opened/shared reading URL has no article entry to go back to.
      const url = new URL(window.location.href)
      url.searchParams.delete('topology')
      url.searchParams.delete('interactivePage')
      const state = { ...window.history.state }
      delete state.readingTopologyOwner
      window.history.replaceState(state, '', url)
      transition(null)
    }
  }, [transition])

  useEffect(() => {
    const sync = () => {
      const query = new URL(window.location.href).searchParams
      const next = interactivePageForReadingUrl(query.get('interactivePage'), query.get('topology')) ?? null
      if (next?.htmlUrl !== requested.current?.htmlUrl) transition(next)
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current)
    }
  }, [transition])

  useEffect(() => {
    if (!artifact) return
    const resize = () => {
      const top = (frame.current?.getBoundingClientRect().top ?? 0) + window.scrollY
      setFrameHeight(Math.max(320, window.innerHeight - top - 20))
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); returnToReading() }
    }
    const onMessage = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow
        && event.origin === window.location.origin
        && event.data?.type === 'crossroads:topology:escape') returnToReading()
    }
    // Public artifacts are served by this same Crossroads app. Listening in
    // the frame makes Escape work for any static HTML, without a special script.
    let embeddedWindow: Window | null = null
    try {
      embeddedWindow = frame.current?.contentWindow ?? null
      embeddedWindow?.addEventListener('keydown', onKey, true)
    } catch { /* A page followed an external link; the Return button still works. */ }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKey)
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('message', onMessage)
      try { embeddedWindow?.removeEventListener('keydown', onKey, true) } catch { /* Frame navigated away. */ }
    }
  }, [artifact, loaded, frameVersion, returnToReading])

  const context = useMemo(() => openTopology, [openTopology])
  return (
    <TopologyReadingContext.Provider value={context}>
      <article className={`trs-surface ${className}`} data-topology-open={artifact ? '' : undefined} style={{ '--trs-measure': style?.maxWidth ?? '48rem', ...style } as CSSProperties}>
        <style>{`
          .trs-surface[data-topology-open] { max-width: min(1440px, 100%) !important; }
          .trs-back-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; min-height:32px; }
          .trs-surface[data-topology-open] > .trs-back-row { width:100%; max-width:calc(var(--trs-measure) - 32px); margin-inline:auto; }
          .trs-return { font:inherit; font-size:.875rem; font-weight:500; padding:0; border:0; background:transparent; color:var(--theme-text-muted, var(--chakra-colors-theme-text-muted)); text-decoration:underline; text-decoration-color:var(--theme-accent, var(--chakra-colors-theme-accent)); text-underline-offset:3px; cursor:pointer; min-height:44px; }
          .trs-return:focus-visible { outline:2px solid var(--theme-accent, var(--chakra-colors-theme-accent)); outline-offset:3px; }
          .trs-standalone { font-size:.875rem; color:inherit; text-underline-offset:3px; }
          .trs-dissolve { transition:opacity ${DISSOLVE_DURATION_MS}ms ease; }
          .trs-dissolve[data-fading] { opacity:0; pointer-events:none; }
          .trs-map { padding-top:12px; }
          .trs-frame { display:block; width:100%; border:0; background:var(--theme-bg, var(--chakra-colors-theme-bg)); }
          .trs-loading { font-size:.875rem; color:var(--theme-text-muted, var(--chakra-colors-theme-text-muted)); }
          @media(prefers-reduced-motion:reduce) { .trs-dissolve { transition:none; } }
        `}</style>
        <div className="trs-back-row" ref={backRow}>
          {artifact ? <>
            <button ref={returnButton} className="trs-return" type="button" onClick={returnToReading}>← {returnLabel}</button>
            <a className="trs-standalone" href={artifact.htmlUrl} target="_blank" rel="noopener noreferrer">Open standalone page ↗</a>
          </> : backLink}
        </div>
        <div className="trs-dissolve" data-fading={fading ? '' : undefined}>
          <div className="trs-manuscript" hidden={!!artifact} inert={!!artifact}>{children}</div>
          {artifact && <section className="trs-map" aria-label={artifact.title}>
            {!loaded && <p className="trs-loading" role="status">Loading interactive page…</p>}
            <iframe ref={frame} className="trs-frame" src={(() => {
              const url = new URL(artifact.htmlUrl)
              return url.pathname + url.search + url.hash
            })()} title={artifact.title} onLoad={() => { setLoaded(true); setFrameVersion(version => version + 1) }} style={{ height: frameHeight }} />
          </section>}
        </div>
      </article>
    </TopologyReadingContext.Provider>
  )
}
