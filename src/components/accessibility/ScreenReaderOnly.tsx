// /src/components/accessibility/ScreenReaderOnly.tsx

/**
 * ScreenReaderOnly Component
 *
 * Renders content that is visible only to screen readers.
 * The element is visually hidden but accessible to assistive technology.
 *
 * Use cases:
 * - Descriptive labels for icon-only buttons
 * - Additional context for screen reader users
 * - Skip navigation links
 * - Live region announcements
 *
 * @example
 * <button>
 *   <IconTrash />
 *   <ScreenReaderOnly>Delete item</ScreenReaderOnly>
 * </button>
 */

import { Box, Link } from '@chakra-ui/react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: 'div' | 'span' | 'p';
}

export function ScreenReaderOnly({ children, as = 'span' }: ScreenReaderOnlyProps) {
  return (
    <Box
      as={as}
      position="absolute"
      width="1px"
      height="1px"
      padding="0"
      margin="-1px"
      overflow="hidden"
      clip="rect(0, 0, 0, 0)"
      whiteSpace="nowrap"
      border="0"
    >
      {children}
    </Box>
  );
}

/**
 * FocusableScreenReaderOnly Component
 *
 * Similar to ScreenReaderOnly but becomes visible when focused.
 * Perfect for skip navigation links.
 *
 * @example
 * <FocusableScreenReaderOnly href="#main-content">
 *   Skip to main content
 * </FocusableScreenReaderOnly>
 */

interface FocusableScreenReaderOnlyProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export function FocusableScreenReaderOnly({
  children,
  href,
  onClick
}: FocusableScreenReaderOnlyProps) {
  const commonStyles = {
    position: "absolute" as const,
    left: "-9999px",
    zIndex: 9999,
    padding: "4",
    bg: "theme.accent",
    color: "white",
    borderRadius: "md",
    fontWeight: "bold",
    textDecoration: "none",
    _focus: {
      left: "4",
      top: "4",
    },
  };

  if (href) {
    return (
      <Link href={href} {...commonStyles}>
        {children}
      </Link>
    );
  }

  return (
    <Box as="button" onClick={onClick} {...commonStyles}>
      {children}
    </Box>
  );
}
