// apps/mixtape/src/components/feedback/Beacon.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Popover,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  IconButton,
  RadioGroup,
  Portal,
  Icon,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type BeaconConfig = {
  key: string;
  title: string;
  body_markdown: string;
  feature_context: string;
  is_active: boolean;
};

interface BeaconProps {
  beaconKey: string;
  areaLabel: string;
  featureContext?: string;
  position?: "inline" | "corner";
  size?: "sm" | "md";
  routeScoped?: boolean;
}

const DISMISS_DAYS = 30;

export function Beacon({
  beaconKey,
  areaLabel,
  featureContext,
  position = "inline",
  size = "sm",
}: BeaconProps) {
  const [config, setConfig] = useState<BeaconConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<"bug" | "request" | "idea">("idea");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(false);

  const isDismissed = useMemo(() => {
    if (typeof window === "undefined") return false;
    const key = `beacon_dismissed_${beaconKey}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    const ts = Number(raw);
    if (!ts || Number.isNaN(ts)) return false;
    const cutoff = ts + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() < cutoff;
  }, [beaconKey]);

  useEffect(() => {
    if (isDismissed) {
      setLoading(false);
      return;
    }
    const fetchBeacon = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/feedback/beacons/${beaconKey}`);
        setConfig(res.data?.data || null);
      } catch {
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBeacon();
  }, [beaconKey, isDismissed]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`beacon_dismissed_${beaconKey}`, String(Date.now()));
    }
    setOpen(false);
    setConfig(null);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    try {
      await axiosInstance.post("/api/feedback/items", {
        beacon_key: beaconKey,
        kind,
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });
      setSubmitted(true);
      setMessage("");
    } catch {
      // quiet fail for now
    }
  };

  if (loading || !config || isDismissed) {
    return null;
  }

  const body = config.body_markdown || "";
  const context = config.feature_context || featureContext || "";

  return (
    <Box position={position === "corner" ? "absolute" : "relative"}>
      <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
        <Popover.Trigger asChild>
          <IconButton
            size={size}
            variant="outline"
            aria-label="Beacon feedback"
          >
            <BeaconIcon />
          </IconButton>
        </Popover.Trigger>

        <Portal>
          <Popover.Positioner>
            <Popover.Content borderRadius="lg" p={4} maxW="520px">
              <Popover.Arrow>
                <Popover.ArrowTip />
              </Popover.Arrow>
              <Popover.Body>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">{config.title || "Feedback Beacon"}</Text>
                    <Button size="xs" variant="ghost" onClick={handleDismiss}>
                      Hide for 30 days
                    </Button>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <VStack align="stretch" gap={2}>
                      <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
                        {body}
                      </Text>
                      {context && (
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                            Feature Context
                          </Text>
                          <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                            {context}
                          </Text>
                        </Box>
                      )}
                    </VStack>

                    {submitted ? (
                      <VStack align="stretch" gap={2}>
                        <Text fontWeight="medium">Thanks for the feedback.</Text>
                        <Text fontSize="sm" color="gray.600">
                          We’ll review this as we refine {areaLabel}.
                        </Text>
                      </VStack>
                    ) : (
                      <VStack align="stretch" gap={3}>
                        <RadioGroup.Root
                          value={kind}
                          onValueChange={(details) => setKind(details.value as "bug" | "request" | "idea")}
                        >
                          <HStack gap={4}>
                            {["bug", "request", "idea"].map((value) => (
                              <RadioGroup.Item key={value} value={value} display="flex" alignItems="center" gap={2}>
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemIndicator />
                                <RadioGroup.ItemText textTransform="capitalize">{value}</RadioGroup.ItemText>
                              </RadioGroup.Item>
                            ))}
                          </HStack>
                        </RadioGroup.Root>

                        <Textarea
                          rows={4}
                          placeholder="Share your thoughts..."
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                        />

                        <Button size="sm" onClick={handleSubmit} disabled={!message.trim()}>
                          Send feedback
                        </Button>
                      </VStack>
                    )}
                  </SimpleGrid>
                </VStack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Box>
  );
}

function BeaconIcon() {
  return (
    <Icon viewBox="0 0 24 24" boxSize="18px" color="currentColor">
      <path d="M10 2h4v6h-4z" />
      <path d="M9 8h6c1.1 0 2 .9 2 2v2H7v-2c0-1.1.9-2 2-2z" />
      <path d="M11 12h2v3h-2z" />
      <path d="M12 15c-2.8 0-4 2.4-4 4.5V22h8v-2.5c0-2.1-1.2-4.5-4-4.5z" />
      <path d="M11 18h2v2h-2z" opacity=".22" />
    </Icon>
  );
}
