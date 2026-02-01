// apps/mixtape/src/app/(authenticated)/add/[username]/write/page.tsx

"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import WritingEditorWrapper from "@components/writing/WritingEditorWrapper";

export default function MemberWritePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const usernameParam = useMemo(() => {
    const raw = params?.username;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  if (!user) {
    return (
      <Box p={6}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  const displayName = user.profile?.display_name || user.username;
  const sponsor = {
    type: "member" as const,
    id: user.id,
    slug: user.username,
    displayName,
  };

  if (usernameParam && usernameParam !== user.username) {
    router.replace(`/add/${user.username}/write`);
  }

  return (
    <Box>
      <WritingEditorWrapper
        sponsor={sponsor}
        writingKind="post"
        onUnpublished={() => {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem("writing_active_tab", "drafts");
              window.localStorage.setItem("memberDashboard", "writing");
            } catch (error) {
              console.warn("Failed to set writing tab:", error);
            }
          }
          router.replace("/app/dashboard");
        }}
      />
    </Box>
  );
}
