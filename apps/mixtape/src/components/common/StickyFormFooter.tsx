// apps/mixtape/src/components/common/StickyFormFooter.tsx

"use client";

import { Box, Flex, Button } from "@chakra-ui/react";

interface StickyFormFooterProps {
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  isDisabled?: boolean;
  /** Pass type="submit" form button as child instead of using onSave */
  children?: React.ReactNode;
}

/**
 * Sticky footer bar for long edit forms. Sticks to the bottom of the nearest
 * scroll container (DashboardLayout's overflowY:auto main content area).
 *
 * Usage — simple:
 *   <StickyFormFooter onSave={handleSave} isSaving={isSaving} onCancel={...} />
 *
 * Usage — custom buttons (e.g. type="submit"):
 *   <StickyFormFooter>
 *     <Button type="submit" ...>Save</Button>
 *   </StickyFormFooter>
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
  return (
    <Box
      className="sticky-form-footer"
      position="sticky"
      bottom={0}
      mt={4}
      mx={-6}
      px={6}
      py={4}
      bg="theme.surface"
      borderTop="1px solid"
      borderColor="theme.border"
      backdropFilter="blur(8px)"
      zIndex={20}
    >
      <Flex justify="flex-end" gap={3}>
        {children ?? (
          <>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
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
    </Box>
  );
}
