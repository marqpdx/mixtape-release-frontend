// /src/components/accessibility/SkipLinks.tsx

"use client";

import { VStack } from '@chakra-ui/react';
import { FocusableScreenReaderOnly } from './ScreenReaderOnly';

/**
 * SkipLinks Component
 *
 * Provides keyboard navigation shortcuts to skip repetitive content.
 * Links are invisible until focused (Tab key), then appear at top-left.
 *
 * Essential for accessibility - allows keyboard users to bypass
 * navigation and jump directly to main content.
 *
 * Usage: Place at the very top of your layout, before all other content.
 *
 * @example
 * <body>
 *   <SkipLinks />
 *   <Navigation />
 *   <main id="main-content">...</main>
 * </body>
 */

interface SkipLink {
  href: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
];

interface SkipLinksProps {
  /** Custom skip links (defaults to main content, navigation, footer) */
  links?: SkipLink[];
}

export function SkipLinks({ links = defaultSkipLinks }: SkipLinksProps) {
  return (
    <VStack
      gap={0}
      position="absolute"
      top={0}
      left={0}
      zIndex={10000}
    >
      {links.map((link) => (
        <FocusableScreenReaderOnly
          key={link.href}
          href={link.href}
        >
          {link.label}
        </FocusableScreenReaderOnly>
      ))}
    </VStack>
  );
}
