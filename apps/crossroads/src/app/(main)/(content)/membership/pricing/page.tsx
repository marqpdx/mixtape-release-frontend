// apps/crossroads/src/app/membership/pricing/page.tsx

"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  Heading,
  HStack,
  Link,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { Divider } from "@/components/common/Divider";

function PriceCard(props: {
  title: string;
  price: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
}) {
  const { title, price, subtitle, bullets, ctaLabel, ctaHref, highlight } = props;

  return (
    <Box
      borderWidth="1px"
      borderColor={highlight ? "green.400" : "theme.border"}
      borderRadius="2xl"
      p={{ base: 6, md: 7 }}
      bg={highlight ? "green.500Alpha.100" : "theme.bgSubtle"}
      boxShadow={highlight ? "0 18px 50px rgba(0,0,0,0.18)" : "none"}
    >
      <Stack gap={4}>
        <Stack gap={1}>
          <HStack justify="space-between" align="start" gap={3} flexWrap="wrap">
            <Heading as="h2" size="md">
              {title}
            </Heading>
            {highlight ? (
              <Box
                px={2}
                py={1}
                borderRadius="md"
                bg="green.500"
                color="white"
                fontSize="xs"
                fontWeight="bold"
              >
                Recommended start
              </Box>
            ) : null}
          </HStack>

          <Text fontSize="3xl" fontWeight="bold">
            {price}
          </Text>
          <Text color="theme.textSecondary">{subtitle}</Text>
        </Stack>

        <Divider />

        <VStack align="stretch" gap={2}>
          {bullets.map((b) => (
            <Text key={b} fontSize="sm">
              • {b}
            </Text>
          ))}
        </VStack>

        <Button colorScheme="green" size="lg" mt={2} asChild>
          <Link as={NextLink} href={ctaHref}>
            {ctaLabel}
          </Link>
        </Button>

        <Text fontSize="xs" color="theme.textSecondary">
          Cancel anytime. Switching levels is easy.
        </Text>
      </Stack>
    </Box>
  );
}

function FAQItem(props: { q: string; a: string }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      p={{ base: 5, md: 6 }}
      bg="theme.bgSubtle"
    >
      <Stack gap={2}>
        <Text fontWeight="semibold">{props.q}</Text>
        <Text color="theme.textSecondary">{props.a}</Text>
      </Stack>
    </Box>
  );
}

export default function AboutPricingPage() {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box maxW="1200px" mx="auto" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <Stack gap={{ base: 10, md: 14 }}>
          {/* Header */}
          <Stack gap={3} maxW="850px">
            <Heading as="h1" size="xl">
              Pricing
            </Heading>
            <Text fontSize="lg" color="theme.textSecondary">
              Crossroads is built for long-term community work. Fees keep hosting sustainable and
              support stewardship — without turning the platform into an attention machine.
            </Text>

            <HStack gap={3} flexWrap="wrap" pt={2}>
              <Button colorScheme="green" size="lg" asChild>
                <Link as={NextLink} href="/about/join">
                  Request to Join
                </Link>
              </Button>
              <Button variant="outline" colorScheme="green" size="lg" asChild>
                <Link as={NextLink} href="/about/levels">
                  Compare participation levels
                </Link>
              </Button>
            </HStack>
          </Stack>

          {/* Price cards */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <PriceCard
              title="Crossroads Member"
              price="$3.50 / month"
              subtitle="The on-ramp: participate, learn, and get oriented."
              bullets={[
                "Join Groups and take part in discussions and activities",
                "Build your profile and connect with people",
                "Get access to member-only areas as they open up",
                "Upgrade any time if you want to take on more responsibility",
              ]}
              ctaLabel="Start here"
              ctaHref="/about/join"
              highlight
            />

            <PriceCard
              title="Crossroads Maker"
              price="$35 / month"
              subtitle="For people actively building: hosting, teaching, convening, and stewarding."
              bullets={[
                "Create and steward Communities (and the projects they hold)",
                "Run initiatives, publish resources, and convene circles of work",
                "Access maker-oriented tools and workflows as they ship",
                "Help fund the platform’s ongoing operation and care",
              ]}
              ctaLabel="Explore Maker level"
              ctaHref="/about/levels"
            />
          </SimpleGrid>

          {/* Transparency note */}
          <Box
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="2xl"
            p={{ base: 6, md: 7 }}
            bg="theme.bgSubtle"
          >
            <Stack gap={3}>
              <Heading as="h2" size="md">
                What your fee supports
              </Heading>
              <Text color="theme.textSecondary">
                This is the unglamorous part — and it matters. Your membership helps cover hosting,
                storage, backups, support, and the steady work of stewardship so Crossroads can stay
                coherent as it grows.
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} pt={2}>
                <Box>
                  <Text fontWeight="semibold">Infrastructure</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Hosting, storage, backups, uptime, security basics.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Stewardship</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Moderation, curation, governance, keeping the place healthy.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Tools that respect you</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Features built for durable work, not dopamine loops.
                  </Text>
                </Box>
              </SimpleGrid>
            </Stack>
          </Box>

          {/* FAQ */}
          <Stack gap={4}>
            <Heading as="h2" size="md">
              FAQ
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
              <FAQItem
                q="Is Crossroads free to use?"
                a="Some public pages are free to explore. Participation inside the community is membership-based to keep the work sustainable and intentional."
              />
              <FAQItem
                q="Can I switch levels later?"
                a="Yes. Start at Member and move up when you’re ready to take on more responsibility. You can also step back down if life changes."
              />
              <FAQItem
                q="Do you offer scholarships or sliding scale?"
                a="Not yet built into the system. If pricing is a barrier, request to join and tell us your situation — we’re aiming to handle this with care."
              />
              <FAQItem
                q="What about Groups and Communities pricing?"
                a="This page covers individual membership. Group/community hosting and other program fees will be published transparently as they come online."
              />
            </SimpleGrid>

            <HStack justify="space-between" pt={2} flexWrap="wrap" gap={3}>
              <Text fontSize="sm" color="theme.textSecondary">
                Want the responsibility view instead of the cost view?
              </Text>
              <Link as={NextLink} href="/about/levels" textDecoration="underline">
                See participation levels →
              </Link>
            </HStack>
          </Stack>
        </Stack>
      </Box>
    </>
  );
}
