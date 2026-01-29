// apps/crossroads/src/app/membership/reciprocity/page.tsx
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

function PrincipleCard(props: { title: string; body: string }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="2xl"
      p={{ base: 6, md: 7 }}
      bg="theme.bgSubtle"
    >
      <Stack gap={2}>
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

export default function MembershipReciprocityPage() {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box maxW="1100px" mx="auto" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <Stack gap={{ base: 10, md: 14 }}>
          {/* Header */}
          <Stack gap={3} maxW="900px">
            <Heading as="h1" size="xl">
              Reciprocity
            </Heading>
            <Text fontSize="lg" color="theme.textSecondary">
              Crossroads is built around a simple idea: communities thrive when contribution is
              visible, care is mutual, and the energy exchange is fair — not extractive.
            </Text>

            <HStack gap={3} flexWrap="wrap" pt={2}>
              <Button colorScheme="green" size="lg" asChild>
                <Link as={NextLink} href="/about/pricing">
                  Pricing
                </Link>
              </Button>
              <Button variant="outline" colorScheme="green" size="lg" asChild>
                <Link as={NextLink} href="/about/levels">
                  Participation levels
                </Link>
              </Button>
            </HStack>
          </Stack>

          {/* Core principles */}
          <Stack gap={4}>
            <Heading as="h2" size="md">
              What we mean by reciprocity
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              <PrincipleCard
                title="Not attention. Not extraction."
                body="We don’t optimize for time-on-site or outrage. We optimize for clarity, usefulness, and real relationships."
              />
              <PrincipleCard
                title="Contribution is more than content"
                body="Hosting a gathering, welcoming a new person, summarizing a thread, teaching a skill — these are contributions too."
              />
              <PrincipleCard
                title="Durability over hype"
                body="Crossroads exists to help people do their best work over time. That means steady pace, good tools, and shared context."
              />
            </SimpleGrid>
          </Stack>

          {/* Practical reciprocity */}
          <Box
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="2xl"
            p={{ base: 6, md: 7 }}
            bg="theme.bgSubtle"
          >
            <Stack gap={4}>
              <Heading as="h2" size="md">
                How reciprocity shows up (practically)
              </Heading>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Box>
                  <Text fontWeight="semibold">Clear roles & responsibilities</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Levels exist to make responsibility legible — so people know what’s expected and
                    what’s supported.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Fees that fund stewardship</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    Membership fees keep the lights on and fund the invisible work: moderation,
                    curation, support, and maintenance.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Respect for your data</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    The platform should protect your work, not hold it hostage. We aim for strong data
                    hygiene, backups, and portability.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Governed growth</Text>
                  <Text fontSize="sm" color="theme.textSecondary">
                    More people is not automatically better. Growth must be matched by stewardship, or
                    the culture degrades.
                  </Text>
                </Box>
              </SimpleGrid>
            </Stack>
          </Box>

          {/* Founder’s note */}
          <Box
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="2xl"
            p={{ base: 6, md: 7 }}
            bg="theme.bgSubtle"
          >
            <Stack gap={3}>
              <Heading as="h2" size="md">
                Founder’s note
              </Heading>

              <Text color="theme.textSecondary" lineHeight="tall">
                Software should support your best work. It should honor your data. It should free up
                time for what matters — not demand your attention to justify its own existence.
              </Text>

              <Text color="theme.textSecondary" lineHeight="tall">
                We’re building Crossroads as a place where people can do durable, meaningful work
                together: teach, learn, grow projects, share tools, host gatherings, and build real
                relationships — without being pulled into the chaos and incentives of the attention
                economy.
              </Text>

              <Text color="theme.textSecondary" lineHeight="tall">
                Reciprocity is the practical backbone of that ethos. It’s how we keep the system
                healthy: shared responsibility, visible care, and a fair exchange that funds the
                stewardship required to keep things coherent.
              </Text>

              <HStack gap={3} flexWrap="wrap" pt={2}>
                <Button colorScheme="green" size="lg" asChild>
                  <Link as={NextLink} href="/about/pricing">
                    View pricing
                  </Link>
                </Button>
                <Button variant="outline" colorScheme="green" size="lg" asChild>
                  <Link as={NextLink} href="/membership/joining">
                    How to join
                  </Link>
                </Button>
              </HStack>
            </Stack>
          </Box>

          {/* Footer link */}
          <Stack gap={2}>
            <Divider />
            <Text fontSize="sm" color="theme.textSecondary">
              Want the structure and permissioning view?
            </Text>
            <Link as={NextLink} href="/about/levels" textDecoration="underline" width="fit-content">
              Participation levels →
            </Link>
          </Stack>
        </Stack>
      </Box>
    </>
  );
}
