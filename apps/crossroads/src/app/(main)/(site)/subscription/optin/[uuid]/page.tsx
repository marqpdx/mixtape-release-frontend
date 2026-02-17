// apps/crossroads/src/app/(main)/(site)/subscription/optin/[uuid]/page.tsx

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useSearchParams, useParams } from "next/navigation";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type ConfirmState = "idle" | "loading" | "success" | "error";

function ConfirmContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConfirmState>("idle");
  const [message, setMessage] = useState<string>("Confirming your subscription...");

  const subscriberUuid = useMemo(() => {
    const uuid = params?.uuid;
    return typeof uuid === "string" ? uuid : "";
  }, [params]);
  const listUuid = useMemo(() => searchParams.get("l") || "", [searchParams]);

  useEffect(() => {
    if (!subscriberUuid || !listUuid) {
      setStatus("error");
      setMessage("Missing confirmation parameters.");
      return;
    }

    let isActive = true;
    const runConfirm = async () => {
      try {
        setStatus("loading");
        await axiosInstance.get("/api/lanternmail/confirm", {
          params: { uuid: subscriberUuid, list: listUuid },
        });
        if (!isActive) return;
        setStatus("success");
        setMessage("You’re confirmed and subscribed.");
      } catch (error) {
        console.error(error);
        if (!isActive) return;
        setStatus("error");
        setMessage("We couldn’t confirm your subscription. Please try again.");
      }
    };

    runConfirm();
    return () => {
      isActive = false;
    };
  }, [subscriberUuid, listUuid]);

  return (
    <Box maxW="640px" mx="auto" mt={{ base: 10, md: 16 }} px={6}>
      <Stack gap={6} align="center" textAlign="center">
        <Heading size="lg">Confirm Subscription</Heading>
        <Text color="gray.600">{message}</Text>
        {status === "error" && (
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        )}
      </Stack>
    </Box>
  );
}

export default function ConfirmSubscriptionPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
