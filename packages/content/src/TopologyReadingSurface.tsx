'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { interactivePageForReadingUrl, type InteractivePage } from './interactivePages'
import { ReadingMediaDialog } from './ReadingMediaDialog'

type OpenTopology = (artifact: InteractivePage, trigger: HTMLElement) => void
const TopologyReadingContext = createContext<OpenTopology | null>(null)
export const useTopologyReadingSurface = () => useContext(TopologyReadingContext)

/**
 * Opens an interactive page over the article in a modal, 98% of the viewport high (CTO, 2026-10-19).
 * The article stays where it was underneath. × and Escape close it; "Open standalone page" opens a new tab.
 * Replaces the earlier in-place Dissolve (DOR-8), which read as leaving the article.
 * The `?interactivePage=` reading URL still opens the modal directly, and Back closes it.
 */
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
  const requested = useRef<InteractivePage | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const owner = useRef('')
  const returning = useRef(false)

  const show = useCallback((next: InteractivePage | null) => {
    requested.current = next
    returning.current = false
    setLoaded(false)
    setArtifact(next)
  }, [])

  const openTopology = useCallback<OpenTopology>((next, source) => {
    trigger.current = source
    if (!owner.current) owner.current = crypto.randomUUID()
    const url = new URL(window.location.href)
    const pageUrl = new URL(next.htmlUrl)
    url.searchParams.set('interactivePage', pageUrl.pathname + pageUrl.search + pageUrl.hash)
    url.searchParams.delete('topology')
    window.history.pushState({ ...window.history.state, readingTopologyOwner: owner.current }, '', url)
    show(next)
  }, [show])

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
      show(null)
    }
  }, [show])

  useEffect(() => {
    const sync = () => {
      const query = new URL(window.location.href).searchParams
      const next = interactivePageForReadingUrl(query.get('interactivePage'), query.get('topology')) ?? null
      if (next?.htmlUrl !== requested.current?.htmlUrl) show(next)
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [show])

  // Escape inside the page. Topology maps post a close signal themselves, after their own
  // popover has had the first Escape; any other static page gets a plain listener.
  useEffect(() => {
    if (!artifact) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); returnToReading() }
    }
    const onMessage = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow
        && event.origin === window.location.origin
        && event.data?.type === 'crossroads:topology:escape') returnToReading()
    }
    let embeddedWindow: (Window & { TopologyKit?: unknown }) | null = null
    try {
      embeddedWindow = frame.current?.contentWindow ?? null
      if (embeddedWindow?.TopologyKit) embeddedWindow = null
      embeddedWindow?.addEventListener('keydown', onKey, true)
    } catch { /* A page followed an external link; × still works. */ }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      try { embeddedWindow?.removeEventListener('keydown', onKey, true) } catch { /* Frame navigated away. */ }
    }
  }, [artifact, loaded, frameVersion, returnToReading])

  const context = useMemo(() => openTopology, [openTopology])
  return (
    <TopologyReadingContext.Provider value={context}>
      <article className={`trs-surface ${className}`} style={style}>
        <style>{`
          .trs-back-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; min-height:32px; }
          .trs-loading { margin:0; padding:12px 16px; font-size:.875rem; color:var(--theme-text-muted, var(--chakra-colors-theme-text-muted)); }
          .trs-frame { display:block; flex:1; min-height:0; width:100%; border:0; background:var(--theme-bg, var(--chakra-colors-theme-bg)); }
        `}</style>
        <div className="trs-back-row">{backLink}</div>
        <div className="trs-manuscript">{children}</div>
        <ReadingMediaDialog open={!!artifact} title={artifact?.title ?? 'Interactive page'} href={artifact?.htmlUrl ?? ''}
          standaloneLabel="Open standalone page" returnLabel={returnLabel} onClose={returnToReading} returnFocusTo={trigger.current}>
          {artifact && <>
            {!loaded && <p className="trs-loading" role="status">Loading interactive page…</p>}
            <iframe ref={frame} className="trs-frame" src={(() => {
              const url = new URL(artifact.htmlUrl)
              return url.pathname + url.search + url.hash
            })()} title={artifact.title} onLoad={() => { setLoaded(true); setFrameVersion(version => version + 1) }} />
          </>}
        </ReadingMediaDialog>
      </article>
    </TopologyReadingContext.Provider>
  )
}
