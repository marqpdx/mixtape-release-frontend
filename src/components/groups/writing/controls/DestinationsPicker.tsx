// src/components/groups/writing/controls/DestinationsPicker.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Input,
  Checkbox,
  Select,
  Portal,
  createListCollection,
} from '@chakra-ui/react';
import type { Visibility, PublishDestinations, PlacementOptions, GroupOverridesMap } from '../interfaces';

type Props = {
  initialDestinations?: PublishDestinations;
  initialVisibility?: Visibility;
  initialGroups?: string[]; // slugs or ids
  onChange: (dests: PublishDestinations, opts: PlacementOptions, groupOverrides: GroupOverridesMap) => void;
};

const visibilityCollection = createListCollection({
  items: [
    { label: 'Public', value: 'public' },
    { label: 'Members only', value: 'members' },
    { label: 'Private', value: 'private' },
    { label: 'Scheduled', value: 'scheduled' },
  ],
});

export function DestinationsPicker({
  initialDestinations,
  initialVisibility = 'public',
  initialGroups = [],
  onChange,
}: Props) {
  const [dests, setDests] = useState<PublishDestinations>(
    initialDestinations ?? { personal: true, groups: initialGroups, lantern: false }
  );
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [groupText, setGroupText] = useState<string>(initialGroups.join(','));
  const [groupOverrides] = useState<GroupOverridesMap>({}); // extend later if needed

  // keep groups in sync with simple CSV input (replace this with your real picker)
  useEffect(() => {
    const cleaned = groupText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setDests((prev: PublishDestinations) => ({ ...prev, groups: cleaned }));
  }, [groupText]);

  // outward change
  useEffect(() => {
    onChange(dests, { visibility }, groupOverrides);
  }, [dests, visibility, groupOverrides, onChange]);

  const visibilityValue = useMemo(() => [visibility], [visibility]);

  return (
    <VStack gap={3} align="stretch">
      <HStack gap={6}>
        {/* PERSONAL */}
        <Checkbox.Root
          checked={!!dests.personal}
          onCheckedChange={({ checked }) =>
            setDests((prev: PublishDestinations) => ({ ...prev, personal: !!checked }))
          }
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Label>Personal</Checkbox.Label>
        </Checkbox.Root>

        {/* LANTERN */}
        <Checkbox.Root
          checked={!!dests.lantern}
          onCheckedChange={({ checked }) =>
            setDests((prev: PublishDestinations) => ({ ...prev, lantern: !!checked }))
          }
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Label>Lantern newsletter</Checkbox.Label>
        </Checkbox.Root>
      </HStack>

      {/* GROUPS: replace this with your real chips/selector */}
      <VStack align="stretch" gap={1}>
        <Text fontSize="sm" opacity={0.8}>
          Groups (comma-separated slugs or IDs)
        </Text>
        <Input
          value={groupText}
          onChange={(e) => setGroupText(e.target.value)}
          placeholder="community-a, circle-123, ..."
          size="sm"
        />
      </VStack>

      <HStack gap={3} align="center">
        <Text minW="96px">Visibility</Text>
        <Select.Root
          collection={visibilityCollection}
          value={visibilityValue} // v3 expects an array
          onValueChange={({ value }) => setVisibility(value[0] as Visibility)}
          size="sm"
        >
          <Select.Trigger />
          <Portal>
            <Select.Content>
              {visibilityCollection.items.map((item) => (
                <Select.Item key={item.value} item={item} />
              ))}
            </Select.Content>
          </Portal>
        </Select.Root>
      </HStack>
    </VStack>
  );
}
