// src/components/groups/GroupEditToolbar.tsx

import { HStack, Text, Badge, Box, Checkbox, Button } from "@chakra-ui/react";
// import { Button } from "@theme/recipes/button.recipe";
// import { Checkbox } from "@components/ui/checkbox";
import { useColorModeValue } from "@components/ui/color-mode";

interface GroupEditToolbarProps {
  mode: 'regular' | 'draft';
  onModeChange: (mode: 'regular' | 'draft') => void;
  onSave: () => void;
  onCancel: () => void;
  onPublish?: () => void;
  onDiscard?: () => void;
  isSaving: boolean;
  autoSaveEnabled: boolean;
  onAutoSaveToggle: (enabled: boolean) => void;
  lastSaved: Date | null;
  isDirty: boolean;
}

export default function GroupEditToolbar({
  mode,
  onModeChange,
  onSave,
  onCancel,
  onPublish,
  onDiscard,
  isSaving,
  autoSaveEnabled,
  onAutoSaveToggle,
  lastSaved,
  isDirty,
}: GroupEditToolbarProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={10}
      bg={bgColor}
      borderBottom="2px solid"
      borderColor={borderColor}
      p={3}
      mb={4}
    >
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        {/* Left: Mode Switcher */}
        <HStack gap={2}>
          <Button
            size="sm"
            variant={mode === 'regular' ? 'solid' : 'outline'}
            onClick={() => onModeChange('regular')}
            colorScheme={mode === 'regular' ? 'blue' : 'gray'}
          >
            Regular Mode
          </Button>
          <Button
            size="sm"
            variant={mode === 'draft' ? 'solid' : 'outline'}
            onClick={() => onModeChange('draft')}
            colorScheme={mode === 'draft' ? 'purple' : 'gray'}
          >
            Draft Mode
          </Button>
        </HStack>

        {/* Middle: Actions */}
        <HStack gap={2}>
          {mode === 'regular' ? (
            <>
              <Button
                size="sm"
                onClick={onSave}
                // loading={isSaving}
                disabled={!isDirty && !autoSaveEnabled}
                colorScheme="green"
              >
                Save
              </Button>
              <Button
                size="sm"
                onClick={onCancel}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={onSave}
                // loading={isSaving}
                disabled={!isDirty}
                colorScheme="blue"
              >
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={onPublish}
                // loading={isSaving}
                colorScheme="green"
              >
                Publish Changes
              </Button>
              <Button
                size="sm"
                onClick={onDiscard}
                variant="outline"
                colorScheme="red"
                disabled={isSaving}
              >
                Discard
              </Button>
            </>
          )}
        </HStack>

        {/* Right: Auto-save & Status */}
        <HStack gap={3}>
          <Checkbox.Root
            checked={autoSaveEnabled}
            onCheckedChange={(details: { checked: boolean | string }) => onAutoSaveToggle(details.checked === true)}
            disabled={mode === 'draft'}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>
              <Text fontSize="sm">Auto-save</Text>
            </Checkbox.Label>
          </Checkbox.Root>

          <Box>
            {isSaving ? (
              <Badge colorScheme="blue">Saving...</Badge>
            ) : isDirty ? (
              <Badge colorScheme="orange">Unsaved changes</Badge>
            ) : lastSaved ? (
              <Text fontSize="xs" color="gray.600">
                Saved {lastSaved.toLocaleTimeString()}
              </Text>
            ) : (
              <Text fontSize="xs" color="gray.400">
                No changes
              </Text>
            )}
          </Box>
        </HStack>
      </HStack>

      {/* Mode Description */}
      <Box mt={2}>
        {mode === 'regular' ? (
          <Text fontSize="xs" color="gray.600">
            Regular mode: Changes are saved to database when you click Save
            {autoSaveEnabled && " (auto-saving every 3 seconds)"}
          </Text>
        ) : (
          <Text fontSize="xs" color="purple.600">
            Draft mode: Changes saved to browser storage. Use "Publish Changes" to save to database.
          </Text>
        )}
      </Box>
    </Box>
  );
}