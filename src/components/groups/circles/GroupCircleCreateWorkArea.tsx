"use client";

import { VStack, Button, HStack } from "@chakra-ui/react";
import GroupCreateCircle from "@/components/groups/create/GroupCreateCircle";

interface Props {
  groupSlug: string;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
}

export function GroupCircleCreateWorkArea({ groupSlug, setActiveSection }: Props) {
  return (
    <VStack align="stretch" gap={6}>
      <HStack>
        <Button variant="outline" onClick={() => setActiveSection("circles-landing")}>
          Back
        </Button>
      </HStack>

      <GroupCreateCircle
        sponsorGroupSlug={groupSlug}
        onCreated={() => setActiveSection("circles-landing")}
      />
    </VStack>
  );
}
