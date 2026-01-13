"use client";

import {
  Select,
  Portal,
} from "@chakra-ui/react";
import { createListCollection } from "@chakra-ui/react";

export const groupVisibilityCollection = createListCollection({
  items: [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
    { label: "Unlisted", value: "unlisted" },
  ],
});

export default function GroupVisibilitySelect({
  register,
  value,
  onChange,
}: {
  register?: (field: "visibility") => Record<string, unknown>;
  value?: string;
  onChange?: (val: string) => void;
}) {
  return (
    <Select.Root
      value={value ? [value] : []}
      onValueChange={({ value }) => {
        onChange?.(value[0]);
      }}
      collection={groupVisibilityCollection}
    >
      <Select.HiddenSelect {...(register ? register("visibility") : {})} />
      {/* <Select.Label>Group Visibility</Select.Label> */}
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select visibility..." />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
          <Select.ClearTrigger />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {groupVisibilityCollection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
