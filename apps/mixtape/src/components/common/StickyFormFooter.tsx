// apps/mixtape/src/components/common/StickyFormFooter.tsx

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Button } from "@chakra-ui/react";

interface StickyFormFooterProps {
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  isDisabled?: boolean;
  /** Pass custom buttons as children (e.g. type="submit" button associated via the form attr) */
  children?: React.ReactNode;
}

/**
 * Always-visible footer for long edit forms.
 *
 * When rendered inside DashboardLayout, portals into #dashboard-sticky-footer
 * which sits *outside* the scroll area — so the footer is always visible at
 * the bottom of the content column without needing to scroll to it.
 *
 * Falls back to a position:sticky inline footer in other contexts.
 *
 * Submit button note: if children include a type="submit" button that must
 * work when portaled outside its <form>, add form="<form-id>" to the button
 * and id="<form-id>" to the <form> element.
 */
export function StickyFormFooter({
  onSave,
  onCancel,
  saveLabel = "Save Changes",
  cancelLabel = "Cancel",
  isSaving = false,
  isDisabled = false,
  children,
}: StickyFormFooterProps) {
  const [footerSlot, setFooterSlot] = useState<Element | null>(null);

  useEffect(() => {
    setFooterSlot(document.getElementById("dashboard-sticky-footer"));
  }, []);

  const inner = (
    <Flex justify="flex-end" gap={3}>
      {children ?? (
        <>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              {cancelLabel}
            </Button>
          )}
          <Button
            onClick={onSave}
            loading={isSaving}
            disabled={isDisabled}
            colorScheme="green"
            size="md"
          >
            {saveLabel}
          </Button>
        </>
      )}
    </Flex>
  );

  const shell = (
    <Box
      className="sticky-form-footer"
      bg="theme.surface"
      borderTop="1px solid"
      borderColor="theme.border"
      px={6}
      py={4}
    >
      {inner}
    </Box>
  );

  if (footerSlot) return createPortal(shell, footerSlot);

  // Fallback: sticky within whatever scroll container wraps this
  return (
    <Box
      className="sticky-form-footer"
      position="sticky"
      bottom={0}
      mt={4}
      mx={-6}
      bg="theme.surface"
      borderTop="1px solid"
      borderColor="theme.border"
      px={6}
      py={4}
      zIndex={20}
    >
      {inner}
    </Box>
  );
}
