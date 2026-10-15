import type { ReactNode } from "react";
import { Box, type BoxProps } from "@chakra-ui/react";

/**
 * One addressable slot in an Outer Rim (decisions/dissolve-outer-rim-adr).
 * Content-agnostic: a Rim Position can be a status badge (Atrium's
 * session chrome) or a navigable position (a Group-admin Work Area's
 * sub-nav, flattened). OuterRim renders whatever `content` each
 * RimPositionItem supplies; it has no opinion on what that is.
 */
export interface RimPositionItem {
  id: string;
  content: ReactNode;
  /** Present when this position is selectable; absent for status-only positions (e.g. a progress bar). */
  onSelect?: () => void;
  active?: boolean;
}

export interface OuterRimProps {
  items: RimPositionItem[];
  /** Where the rim sits relative to the paired Dissolve region. */
  placement?: "top" | "left" | "right" | "bottom";
  className?: string;
  boxProps?: BoxProps;
}

/**
 * A positional frame paired with a Dissolve region — not nested inside it.
 * Campus-scale usage (Top/Left/Right/Bottom/Dim zones) is documented as
 * this same construct's "Surface Frame" profile; see
 * reference/design-patterns/surface-frame.md.
 */
export function OuterRim({ items, placement = "left", className, boxProps }: OuterRimProps) {
  const isHorizontal = placement === "top" || placement === "bottom";

  return (
    <Box
      className={className}
      display="flex"
      flexDirection={isHorizontal ? "row" : "column"}
      gap={1}
      {...boxProps}
    >
      {items.map((item) => (
        <Box
          key={item.id}
          role={item.onSelect ? "button" : undefined}
          tabIndex={item.onSelect ? 0 : undefined}
          cursor={item.onSelect ? "pointer" : undefined}
          onClick={item.onSelect}
          onKeyDown={
            item.onSelect
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    item.onSelect?.();
                  }
                }
              : undefined
          }
          data-active={item.active ? "" : undefined}
        >
          {item.content}
        </Box>
      ))}
    </Box>
  );
}
