"use client";

import { Text } from "@chakra-ui/react";
import { OpportunityWorkspace } from "@/components/opportunities/OpportunityWorkspace";
import { useAuth } from "@/lib/auth/AuthContext";


export default function OpportunitiesPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Text p={8}>Loading opportunities…</Text>;
  if (!user) return <Text p={8}>Authentication required.</Text>;

  return <OpportunityWorkspace />;
}
