'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Shared reader chrome: IIP and full images have exactly the same modal controls. */
export function ReadingMediaDialog({ open, title, href, standaloneLabel, returnLabel = 'Return to article', onClose, returnFocusTo, children }: {
  open: boolean
  title: string
  href: string
  standaloneLabel: string
  returnLabel?: string
  onClose: () => void
  returnFocusTo?: HTMLElement | null
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d || !open) return
    restoreFocus.current = returnFocusTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    d.showModal()
    closeButton.current?.focus({ preventScroll: true })
    const root = document.documentElement, previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      d.close()
      root.style.overflow = previous
      if (restoreFocus.current?.isConnected) restoreFocus.current.focus({ preventScroll: true })
    }
  }, [open, returnFocusTo])

  return <>
    <style>{`
      .rmd-modal { width:min(1600px, 98vw); max-width:98vw; height:98vh; max-height:98vh; margin:auto; padding:0; overflow:hidden;
        border:1px solid var(--theme-border, var(--chakra-colors-theme-border, rgba(0,0,0,.12))); border-radius:12px;
        background:var(--theme-bg, var(--chakra-colors-theme-bg)); color:inherit; }
      .rmd-modal[open] { display:flex; flex-direction:column; }
      .rmd-modal::backdrop { background:rgba(20,18,14,.55); }
      .rmd-modal-head { display:flex; align-items:center; gap:16px; padding:6px 10px 6px 16px; border-bottom:1px solid var(--theme-border, var(--chakra-colors-theme-border, rgba(0,0,0,.12))); }
      .rmd-modal-title { flex:1; min-width:0; font-size:.875rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .rmd-standalone { font-size:.875rem; color:inherit; text-decoration:underline; text-underline-offset:3px; white-space:nowrap; }
      .rmd-close { width:36px; height:36px; flex:none; display:grid; place-items:center; padding:0; border:1px solid var(--theme-border, var(--chakra-colors-theme-border, rgba(0,0,0,.18)));
        border-radius:50%; background:transparent; color:inherit; font:inherit; font-size:1.3rem; line-height:1; cursor:pointer; }
      .rmd-close:hover { background:rgba(0,0,0,.06); }
      .rmd-close:focus-visible, .rmd-standalone:focus-visible { outline:2px solid var(--theme-accent, var(--chakra-colors-theme-accent)); outline-offset:3px; }
    `}</style>
    <dialog ref={dialog} className="rmd-modal" aria-label={title}
      onCancel={event => { event.preventDefault(); onClose() }}>
      {open && <>
        <div className="rmd-modal-head">
          <span className="rmd-modal-title">{title}</span>
          <a className="rmd-standalone" href={href} target="_blank" rel="noopener noreferrer">{standaloneLabel} ↗</a>
          <button ref={closeButton} className="rmd-close" type="button" onClick={onClose} aria-label={returnLabel} title={returnLabel}>×</button>
        </div>
        {children}
      </>}
    </dialog>
  </>
}
