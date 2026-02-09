// /hooks/useInvitationStatusPoll.ts

import { useEffect, useRef } from "react";
import axios from "axios";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type InvitationStatusPollOptions = {
  groupId: string | number;
  invitationId: number | null;
  onSuccess?: () => void;
  onFailure?: () => void;
  onPending?: () => void;
  maxAttempts?: number;
  delay?: number;
};

export function useInvitationStatusPoll({
  groupId,
  invitationId,
  onSuccess,
  onFailure,
  onPending,
  maxAttempts = 3,
  delay = 5000,
}: InvitationStatusPollOptions) {
  const attemptsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!invitationId) return;

    const poll = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/groups/${groupId}/invitations/${invitationId}`
        );

        const emailStatus = res.data.email_status;

        console.log("Polling invitation status:", emailStatus);
        console.log("Polling attempts:", res.data);

        if (emailStatus === "sent") {
          onSuccess?.();
          clearPolling();
        } else if (emailStatus === "failed") {
          onFailure?.();
          clearPolling();
        } else {
          console.log("Polling Invitation email is still pending...");
          attemptsRef.current += 1;
          if (attemptsRef.current >= maxAttempts) {
            onPending?.();
            clearPolling();
          } else {
            timerRef.current = setTimeout(poll, delay);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        onFailure?.();
        clearPolling();
      }
    };

    const clearPolling = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };

    poll();

    return () => {
      clearPolling();
    };
  }, [invitationId, groupId]);

  return null;
}
