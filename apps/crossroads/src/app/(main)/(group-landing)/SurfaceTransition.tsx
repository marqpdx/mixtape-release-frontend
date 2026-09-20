"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

interface SurfaceTransitionContextValue {
  transitionTo: (href: string, source: HTMLElement) => void;
  transitioning: boolean;
}

const SurfaceTransitionContext = createContext<SurfaceTransitionContextValue | null>(null);

export function SurfaceTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const originPath = useRef<string | null>(null);
  const navigationTimer = useRef<number | null>(null);
  const fallbackTimer = useRef<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [covered, setCovered] = useState(false);
  const [overlayColor, setOverlayColor] = useState("Canvas");

  const clearTimers = useCallback(() => {
    if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    navigationTimer.current = null;
    fallbackTimer.current = null;
  }, []);

  const finishTransition = useCallback(() => {
    setCovered(false);
    window.setTimeout(() => {
      setTransitioning(false);
      originPath.current = null;
    }, 110);
  }, []);

  const transitionTo = useCallback(
    (href: string, source: HTMLElement) => {
      if (transitioning) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      const color = window.getComputedStyle(source).getPropertyValue("--theme-bg").trim();
      setOverlayColor(color || "Canvas");
      originPath.current = pathname;
      setTransitioning(true);
      setCovered(true);

      navigationTimer.current = window.setTimeout(() => router.push(href), 90);
      fallbackTimer.current = window.setTimeout(finishTransition, 10000);
    },
    [finishTransition, pathname, router, transitioning]
  );

  useEffect(() => {
    if (!transitioning || originPath.current === null || pathname === originPath.current) return;

    clearTimers();
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(finishTransition);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [clearTimers, finishTransition, pathname, transitioning]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <SurfaceTransitionContext.Provider value={{ transitionTo, transitioning }}>
      <div className="gst-root">{children}</div>
      <div
        className="gst-overlay"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483646,
          pointerEvents: covered ? "auto" : "none",
          background: overlayColor,
          opacity: covered ? 1 : 0,
          transition: `opacity ${covered ? 90 : 110}ms ease`,
        }}
      />
    </SurfaceTransitionContext.Provider>
  );
}

interface SurfaceTransitionLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

export function SurfaceTransitionLink({
  href,
  children,
  onClick,
  target,
  ...props
}: SurfaceTransitionLinkProps) {
  const context = useContext(SurfaceTransitionContext);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      !context ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === "_blank" ||
      href.startsWith("#")
    ) {
      return;
    }

    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    event.preventDefault();
    context.transitionTo(`${destination.pathname}${destination.search}${destination.hash}`, event.currentTarget);
  };

  return (
    <Link href={href} target={target} onClick={handleClick} aria-busy={context?.transitioning} {...props}>
      {children}
    </Link>
  );
}
