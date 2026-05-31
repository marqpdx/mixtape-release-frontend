// apps/mixtape/src/components/dashboard/member/MemberProfileEditWorkArea.tsx

"use client";

import { Box } from "@chakra-ui/react";
import MemberProfileEdit from "./MemberProfileEdit";

interface Props {
  setActiveSection: (section: string) => void;
}

export default function MemberProfileEditWorkArea({ setActiveSection }: Props) {
  return (
    <Box w="100%">
      <MemberProfileEdit
        onSave={() => setActiveSection("profile")}
        onCancel={() => setActiveSection("profile")}
      />
    </Box>
  );
}
