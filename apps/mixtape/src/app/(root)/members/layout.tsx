"use client";

import { Suspense } from "react";
import { Box } from "@chakra-ui/react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { ChatUnreadProvider } from "@/contexts/ChatUnreadContext";
import { HelpProvider } from "@/components/help/HelpProvider";
import { HelpDrawer } from "@/components/help/HelpDrawer";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatUnreadProvider>
      <HelpProvider>
        <Box style={{ "--app-topbar": "80px" } as React.CSSProperties}>
          <Suspense fallback={null}>
            <UnifiedNavbar />
          </Suspense>
          {children}
        </Box>
        <HelpDrawer />
      </HelpProvider>
    </ChatUnreadProvider>
  );
}
