"use client";

import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import DashboardLayout from "@components/common/DashboardLayout";
import type { MenuItem } from "@components/dashboard/shared/types";
import ArgusWorkArea from "@components/argus/ArgusWorkArea";

const menuItems: MenuItem[] = [
  { key: "audits", label: "Argus", icon: "◉", subItems: [
    { key: "overview", label: "Audit overview" },
    { key: "run", label: "Start a run" },
    { key: "series", label: "Run series" },
  ] },
];

function ArgusPageContent() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Text role="status">Loading Argus…</Text>;
  if (!user) return <Text>Authentication required.</Text>;
  if (!user.is_superuser) return <Text>Superuser access required.</Text>;

  return <DashboardLayout key={String(user.id)} title="Argus" menuItems={menuItems} defaultSection="overview"
    localStorageKey="argusActiveSection" WorkAreaComponent={ArgusWorkArea}
    workAreaProps={{ identityKey: String(user.id) }} />;
}

export default function ArgusPage() {
  return <Suspense fallback={<Text role="status">Loading Argus…</Text>}><ArgusPageContent /></Suspense>;
}
