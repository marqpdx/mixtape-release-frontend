// =====================================================
// SYSADMIN WORK AREA - Technical monitoring
// =====================================================

import { UserIdentity } from "@components/auth/interfaces";
import { WorkAreaProps } from "../shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";
import { VStack, Text } from "@chakra-ui/react";


// src/components/dashboard/sysadmin/SysadminWorkArea.tsx
interface SysadminWorkAreaProps extends WorkAreaProps {
  identity: UserIdentity;
}

export default function SysadminWorkArea({
  section,
  setActiveSection,
  identity,
}: SysadminWorkAreaProps) {

  if (section === "system-overview") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">🔧 System Overview</Text>
          <Text>System monitoring dashboard coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "performance-metrics") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">📈 Performance Metrics</Text>
          <Text>Performance monitoring coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // Default fallback
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This sysadmin section is under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}