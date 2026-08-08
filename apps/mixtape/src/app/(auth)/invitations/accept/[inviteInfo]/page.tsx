// src/app/(auth)/invitations/accept/[inviteInfo]/page.tsx

"use client";

import { Suspense } from "react";
import { AcceptInviteForm } from "@/components/groups/invitations/AcceptInviteForm";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

function AcceptInviteInner() {
  const params = useParams();
  const shortcode = (params.inviteInfo as string) || "";
  const { user, isLoading } = useAuth();

  if (!shortcode) {
    return <div>Invalid invitation link</div>;
  }

  if (isLoading) return null;

  // Logged-in users just accept the invite; unauthenticated users register first
  return <AcceptInviteForm shortcode={shortcode} isNewUser={!user} />;
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteInner />
    </Suspense>
  );
}
