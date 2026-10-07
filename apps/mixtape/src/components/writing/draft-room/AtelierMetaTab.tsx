// components/writing/draft-room/AtelierMetaTab.tsx
// Extracted from DraftRoomWorkArea's inline "Meta" tab (2026-10-07) so the
// Focus-Centered Writing ADR's Focus view (FCW-7) can reuse it rather than
// forking title/audience editing -- see puddlejump decisions/
// focus-centered-writing-adr/. Presentational only: Draft Room keeps owning
// all state, autosave policy, and the persisted-audience-default behavior;
// this component just renders the fields and calls back. Behavior-identical
// to the inline block it replaced.
"use client";

import { Box, Button, HStack, Input, Portal, Select, Text, createListCollection } from "@chakra-ui/react";
import { useMemo } from "react";
import { useColorModeValue } from "@components/ui/color-mode";

const AUDIENCE_OPTIONS = [
  { label: "Crossroads community", value: "crossroads" },
  { label: "Public", value: "public" },
  { label: "Myself", value: "self" },
];

interface AtelierMetaTabProps {
  title: string;
  onTitleChange: (title: string) => void;
  addressedTo: string;
  onAddressedToChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  saveDisabled?: boolean;
  showTitleSaved?: boolean;
  showAutoSaved?: boolean;
}

export default function AtelierMetaTab({
  title,
  onTitleChange,
  addressedTo,
  onAddressedToChange,
  onSave,
  saving,
  saveDisabled = false,
  showTitleSaved = false,
  showAutoSaved = false,
}: AtelierMetaTabProps) {
  const selectCollection = useMemo(() => createListCollection({ items: AUDIENCE_OPTIONS }), []);
  const readinessColor = (isReady: boolean) => (isReady ? "green.400" : "orange.400");
  const isTitleReady = Boolean(title.trim());
  const isAudienceReady = Boolean(addressedTo.trim());
  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const sectionBorder = useColorModeValue("gray.100", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.900");
  const inputBorder = useColorModeValue("gray.200", "gray.700");
  const inputFocusBorder = useColorModeValue("blue.400", "blue.300");

  return (
    <Box className="amt-root" display="flex" flexDirection="column" gap={4}>
      <Box>
        <HStack align="center" gap={3} mb={2}>
          <Box w="8px" h="8px" borderRadius="full" bg={readinessColor(isTitleReady)} />
          <Text fontSize="sm" fontWeight="medium">
            Title
          </Text>
          <Input
            size="sm"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Untitled"
            bg={inputBg}
            borderColor={inputBorder}
            _focus={{ borderColor: inputFocusBorder }}
            flex="1"
          />
          {showTitleSaved && (
            <Text fontSize="xs" color={textSecondary}>saved</Text>
          )}
          {showAutoSaved && (
            <Text fontSize="xs" color={textSecondary}>autosaved</Text>
          )}
        </HStack>
      </Box>

      <Box>
        <HStack align="center" gap={3} mb={2}>
          <Box w="8px" h="8px" borderRadius="full" bg={readinessColor(isAudienceReady)} />
          <Text fontSize="sm" fontWeight="medium">Audience</Text>
        </HStack>
        <Select.Root
          collection={selectCollection}
          value={addressedTo ? [addressedTo] : []}
          onValueChange={({ value }) => onAddressedToChange(value[0] ?? "public")}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select audience" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
              <Select.ClearTrigger />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {selectCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Box>

      <Box borderTopWidth="1px" borderColor={sectionBorder} pt={3}>
        <HStack justify="flex-end">
          <Button size="sm" variant="outline" onClick={onSave} disabled={saving || saveDisabled}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
