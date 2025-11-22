// src/app/(auth)/invitations/accept/[inviteInfo]/new/page.tsx

"use client";

import { AcceptInviteForm } from "@/components/groups/invitations/AcceptInviteForm";
import { useParams } from "next/navigation";

export default function NewUserAcceptInvitePage() {
  const params = useParams();
  const shortcode = (params.inviteInfo as string) || "";

  console.log("Params:", params);
  console.log("Shortcode:", shortcode);

  if (!shortcode) {
    return (
      <div>Invalid invitation link</div>
    );
  }

  return <AcceptInviteForm shortcode={shortcode} isNewUser={true} />;
}
