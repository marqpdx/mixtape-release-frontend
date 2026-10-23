// apps/mixtape/src/components/dashboard/member/MemberProfileEditWorkArea.tsx
//
// The one place to edit your profile (CTO, 2026-10-23): Details (name,
// intro, images, voice note) and Look & layout (the Profile Revamp editor,
// formerly /settings/profile/new). zz/profile-settings-consolidation-build-plan.md, PS-2.

"use client";

import { useState } from "react";
import { Box, Button, HStack, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import ProfileEditor from "@/features/profile-revamp/editor/ProfileEditor";
import MemberProfileEdit from "./MemberProfileEdit";

interface Props {
  setActiveSection: (section: string) => void;
}

type EditPart = "details" | "look";

const PARTS: { key: EditPart; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "look", label: "Look & layout" },
];

export default function MemberProfileEditWorkArea({ setActiveSection }: Props) {
  const [part, setPart] = useState<EditPart>("details");
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const activeColor = useColorModeValue("blue.700", "blue.200");
  const inactiveColor = useColorModeValue("gray.600", "gray.400");

  return (
    <VStack align="stretch" gap={5} w="100%">
      <HStack gap={1} borderBottom="1px" borderColor="gray.200" pb={2}>
        {PARTS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant="ghost"
            onClick={() => setPart(p.key)}
            bg={part === p.key ? activeBg : "transparent"}
            color={part === p.key ? activeColor : inactiveColor}
            _hover={{ bg: activeBg }}
          >
            {p.label}
          </Button>
        ))}
      </HStack>

      {part === "details" ? (
        <Box w="100%">
          <MemberProfileEdit
            onSave={() => setActiveSection("profile")}
            onCancel={() => setActiveSection("profile")}
          />
        </Box>
      ) : (
        <ProfileEditor embedded />
      )}
    </VStack>
  );
}
