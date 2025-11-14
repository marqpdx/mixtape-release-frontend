// src/app/(auth)/invitations/accept/[inviteInfo]/new/page.tsx

"use client";

import { useParams } from "next/navigation";
import { AcceptInviteForm } from "@components/invitations/AcceptInviteForm";

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
