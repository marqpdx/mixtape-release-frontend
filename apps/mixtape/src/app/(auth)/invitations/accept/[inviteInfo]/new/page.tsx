// src/app/(auth)/invitations/accept/[inviteInfo]/new/page.tsx

"use client";

import { Suspense } from "react";
import { AcceptInviteForm } from "@/components/groups/invitations/AcceptInviteForm";
import { useParams } from "next/navigation";

function NewUserAcceptInviteInner() {
  const params = useParams();
  const shortcode = (params.inviteInfo as string) || "";

  if (!shortcode) {
    return <div>Invalid invitation link</div>;
  }

  return <AcceptInviteForm shortcode={shortcode} isNewUser={true} />;
}

export default function NewUserAcceptInvitePage() {
  return (
    <Suspense>
      <NewUserAcceptInviteInner />
    </Suspense>
  );
}
