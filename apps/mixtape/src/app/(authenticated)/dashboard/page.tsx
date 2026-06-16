// apps/mixtape/src/app/(authenticated)/dashboard/page.tsx

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { MemberDashboardNew } from "@components/dashboard/member/MemberDashboardNew";

export default function MemberDashboard() {
  const { user: identity, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section") ?? undefined;

  useEffect(() => {
    if (identity) {
      document.title = "Dashboard";
    }
  }, [identity]);

  if (isLoading) return <Text>Loading your dashboard…</Text>;
  if (!identity) return <Text>Authentication required…</Text>;

  return <MemberDashboardNew initialSection={sectionParam} />;
}
