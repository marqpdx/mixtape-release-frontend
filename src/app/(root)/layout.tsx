// /src/app/(root)/layout.tsx
// Wraps public routes: /welcome/*, /invite/*, and (site) route group

"use client";

import { BaseContentBox } from "@/components/layout/BaseContentBox";
// import AdminTodoButtonWithModal from "@components/admin-apps/AdminTodoButtonWithModal";
// import { usePermissions } from "@lib/auth/usePermissions";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { isAdmin } = usePermissions();

  return (
    <>
      <BaseContentBox>{children}</BaseContentBox>
      {/* <AdminTodoButtonWithModal isAdmin={isAdmin} /> */}
    </>
  );
}
