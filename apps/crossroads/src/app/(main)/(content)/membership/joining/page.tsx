// apps/crossroads/src/app/membership/joining/page.tsx

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
} from "@chakra-ui/react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { Divider } from "@/components/common/Divider";

function StepCard(props: { step: string; title: string; body: string }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="2xl"
      p={{ base: 6, md: 7 }}
      bg="theme.bgSubtle"
    >
      <Stack gap={2}>
        <Text fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" color="theme.textSecondary">
          {props.step}
        </Text>
        <Heading as="h3" size="sm">
          {props.title}
        </Heading>
        <Text color="theme.textSecondary" lineHeight="tall">
          {props.body}
        </Text>
      </Stack>
    </Box>
  );
}

export default function MembershipJoiningPage() {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box maxW="1100px" mx="auto" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <Stack gap={{ base: 10, md: 14 }}>
          {/* Header */}
          <Stack gap={3} maxW="850px">
            <Heading as="h1" size="xl">
              Joining Crossroads
            </Heading>
            <Text fontSize="lg" color="theme.textSecondary">
              Crossroads is built for durable, human-scale work — not growth-at-any-cost. Joining is
              simple, but it’s also intentional: we’re optimizing for coherence, care, and people who
              want to build with others.
            </Text>

            <HStack gap={3} flexWrap="wrap" pt={2}>
              <Button colorScheme="green" size="lg" asChild>
                <Link as={NextLink} href="/about/pricing">
                  See pricing
                </Link>
              </Button>
              <Button variant="outline" colorScheme="green" size="lg" asChild>
                <Link as={NextLink} href="/about/levels">
                  Participation levels
                </Link>
              </Button>
            </HStack>
          </Stack>

          {/* Process */}
          <Stack gap={4}>
            <Heading as="h2" size="md">
              How joining works
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              <StepCard
                step="Step 1"
                title="Start with orientation"
                body="Read a bit about how Crossroads works: participation levels, expectations, and the kind of culture we’re aiming to grow."
              />
              <StepCard
                step="Step 2"
                title="Request membership"
                body="Tell us who you are, what you’re here for, and what kind of communities or projects you want to be part of."
              />
              <StepCard
                step="Step 3"
                title="Join, then choose your pace"
                body="Most people start as Crossroads Member. If you’re actively hosting or building, you can step up to Maker later."
              />
            </SimpleGrid>
          </Stack>

          {/* What we look for */}
          <Box
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="2xl"
            p={{ base: 6, md: 7 }}
            bg="theme.bgSubtle"
          >
            <Stack gap={4}>
              <Heading as="h2" size="md">
                What we’re optimizing for
              </Heading>
              <Text color="theme.textSecondary" lineHeight="tall">
                This is the “tell it like it is” section. We’re not looking for perfection — we’re
                looking for fit.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Box>
                  <Text fontWeight="semibold">People who build with others</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Makers, teachers, organizers, learners — anyone who wants to contribute and grow
                    something real.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Care for coherence</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    You don’t have to agree with everyone, but you do need to care about clarity,
                    respect, and shared context.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Stewardship mindset</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Healthy communities aren’t automatic. We value people willing to help tend the
                    garden (at whatever scale fits them).
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">No attention-economy behavior</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Crossroads is not built for rage, dunking, or algorithmic escalation. If that’s the
                    vibe you want, you won’t be happy here.
                  </Text>
                </Box>
              </SimpleGrid>
            </Stack>
          </Box>

          {/* Quick links */}
          <Stack gap={3}>
            <Heading as="h2" size="md">
              Ready to begin?
            </Heading>
            <Text color="theme.textSecondary">
              If you want in, start with pricing and levels — then request membership when you’re
              comfortable.
            </Text>

            <HStack gap={3} flexWrap="wrap" pt={1}>
              <Button colorScheme="green" size="lg" asChild>
                <Link as={NextLink} href="/about/pricing">
                  Pricing
                </Link>
              </Button>
              <Button colorScheme="green" variant="outline" size="lg" asChild>
                <Link as={NextLink} href="/about/levels">
                  Levels & capabilities
                </Link>
              </Button>
              <Button colorScheme="green" variant="ghost" size="lg" asChild>
                <Link as={NextLink} href="/membership/reciprocity">
                  Reciprocity & ethos
                </Link>
              </Button>
            </HStack>

            <Box pt={3}>
              <Divider/>
            </Box>

            <Text fontSize="sm" color="theme.textSecondary">
              Implementation note: when you wire up the actual “Request membership” form, this page is
              the best place to link to it (e.g. <code>/signup</code> or <code>/membership/request</code>).
            </Text>
          </Stack>
        </Stack>
      </Box>
    </>
  );
}
