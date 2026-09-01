"use client";

// GroupPublicEngagement — Engagement + email subscription section (Decision 1, Decision 5, Decision 10)
// Decision 10: no conversion pressure. Modest invitation: join the list, get in touch.
// Decision 5: subscription routes to the Group's configured listmonk list.

import { useState } from "react";
import { Box, Flex, Text, Button, Input, Stack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { GroupPublicLandingConfig } from "../types";

interface Props {
  engagement: GroupPublicLandingConfig["engagement"];
  subscription: GroupPublicLandingConfig["subscription"];
  groupSlug: string;
}

type SubscribeState = "idle" | "submitting" | "success" | "error";

function resolveEngagementHref(action: string): string {
  if (action.startsWith("email:")) {
    return `mailto:${action.slice(6)}`;
  }
  return action;
}

export function GroupPublicEngagement({ engagement, subscription }: Props) {
  const bg = useColorModeValue("gray.50", "gray.950");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.900", "gray.50");
  const bodyColor = useColorModeValue("gray.600", "gray.300");
  const pillBg = useColorModeValue("white", "gray.800");
  const pillBorder = useColorModeValue("gray.200", "gray.700");
  const successBg = useColorModeValue("green.50", "green.900");
  const successColor = useColorModeValue("green.700", "green.300");

  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<SubscribeState>("idle");
  const [subError, setSubError] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !subscription.list_slug) return;
    setSubState("submitting");
    setSubError("");
    try {
      const res = await fetch(`${baseUrl}/api/lanternmail/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), list_slug: subscription.list_slug }),
      });
      if (res.ok) {
        setSubState("success");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setSubError(data.error || "Something went wrong. Please try again.");
        setSubState("error");
      }
    } catch {
      setSubError("Could not connect. Please try again.");
      setSubState("error");
    }
  }

  const hasEngagementContent =
    engagement.text ||
    engagement.capability_pills.length > 0 ||
    (engagement.cta.label && engagement.cta.action);

  return (
    <Box
      className="gpl-engagement"
      id="gpl-subscribe"
      as="section"
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={{ base: 6, md: 12, lg: 20 }}
      py={{ base: 16, md: 20 }}
    >
      <Flex
        className="gpl-eng-inner"
        direction={{ base: "column", md: "row" }}
        gap={{ base: 12, md: 20 }}
        align="start"
      >
        {hasEngagementContent && (
          <Box className="gpl-eng-contact" flex={1} minW={0}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wider"
              mb={4}
            >
              Get in Touch
            </Text>

            {engagement.text && (
              <Text
                fontSize={{ base: "md", md: "lg" }}
                color={bodyColor}
                lineHeight={1.7}
                mb={6}
              >
                {engagement.text}
              </Text>
            )}

            {engagement.capability_pills.length > 0 && (
              <Flex className="gpl-eng-pills" gap={2} flexWrap="wrap" mb={6}>
                {engagement.capability_pills.map((pill, i) => (
                  <Box
                    key={i}
                    px={3}
                    py={1.5}
                    bg={pillBg}
                    borderWidth="1px"
                    borderColor={pillBorder}
                    borderRadius="full"
                  >
                    <Text fontSize="xs" color={headingColor} fontWeight="500">
                      {pill}
                    </Text>
                  </Box>
                ))}
              </Flex>
            )}

            {engagement.cta.label && engagement.cta.action && (
              <a href={resolveEngagementHref(engagement.cta.action)} style={{ textDecoration: "none" }}>
                <Button size="md" variant="outline">
                  {engagement.cta.label}
                </Button>
              </a>
            )}
          </Box>
        )}

        {subscription.has_list && subscription.list_slug && (
          <Box className="gpl-eng-subscribe" flex={1} minW={0} maxW={{ md: "400px" }}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wider"
              mb={4}
            >
              Stay Connected
            </Text>

            {subState === "success" ? (
              <Box
                className="gpl-sub-success"
                p={5}
                borderWidth="1px"
                borderColor="green.300"
                borderRadius="md"
                bg={successBg}
              >
                <Text color={successColor} fontSize="sm">
                  Check your email — a confirmation link is on its way.
                </Text>
              </Box>
            ) : (
              <Box as="form" onSubmit={handleSubscribe}>
                <Stack gap={3}>
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={subState === "submitting"}
                    size="md"
                  />
                  <Button
                    type="submit"
                    colorPalette="indigo"
                    size="md"
                    disabled={subState === "submitting"}
                    loading={subState === "submitting"}
                  >
                    Join the email list
                  </Button>
                  {subState === "error" && (
                    <Text fontSize="xs" color="red.500">
                      {subError}
                    </Text>
                  )}
                  <Text fontSize="xs" color={labelColor} lineHeight={1.5}>
                    No spam. Unsubscribe anytime.
                  </Text>
                </Stack>

                {/* Honeypot — hidden from humans, traps bots */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: "none" }}
                />
              </Box>
            )}
          </Box>
        )}
      </Flex>
    </Box>
  );
}
