import { Box, type BoxProps } from "@chakra-ui/react";
import { useDissolve, type UseDissolveOptions } from "./useDissolve";

export interface DissolveProps extends UseDissolveOptions {
  /** Content to render inside the fading region. */
  children: React.ReactNode;
  className?: string;
  boxProps?: BoxProps;
}

/**
 * Declarative wrapper around `useDissolve` for consumers that just want a
 * fading container, not direct control over the swap timing. For anything
 * that needs to trigger the swap itself (most real consumers), use
 * `useDissolve` directly — see WorkTable.tsx. (TopologyReadingSurface.tsx used it
 * until 2026-10-19, when the reading surface became a modal.)
 */
export function Dissolve({ children, className, boxProps, regionKey, durationMs }: DissolveProps) {
  const { dissolving, transitionDuration } = useDissolve({ regionKey, durationMs });

  return (
    <Box
      className={className}
      opacity={dissolving ? 0 : 1}
      transition={`opacity ${transitionDuration} ease`}
      {...boxProps}
    >
      {children}
    </Box>
  );
}
