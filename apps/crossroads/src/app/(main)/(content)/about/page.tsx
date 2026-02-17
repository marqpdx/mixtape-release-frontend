// apps/crossroads/src/app/about/page.tsx

"use client";

import { Box, Heading, Link, List, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

export default function AboutPage() {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box maxW="980px" mx="auto" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <Heading as="h1" size="xl" mb={{ base: 6, md: 8 }}>
          About
        </Heading>

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "56fr 44fr" }}
          gap={{ base: 8, md: 12 }}
        >
          <Box>
            <Heading as="h2" size="md" mb={4}>
              Crossroads
            </Heading>
            <VStack align="start" gap={4}>
              <Text fontSize="lg">
                Crossroads is an offering, an experiment in togetherness. We have intended this
                software tool to be lightweight for all members, functional and coherent without
                imposing all but the merest limits. Yet, the whole experience is geared to be
                useful, seamless, and intuitive.
              </Text>
              <Text fontSize="lg">
                The hope is that Crossroads facilitates people gathering more, collaborating more
                effectively, and finding greater clarity about that which is important in life:
                sustaining our dear Earth, supporting family, nurturing friendships, co-creating
                abundance and beauty.
              </Text>
              <Text fontSize="lg">
                This is an active exploration in how we work together well. If you are interested,
                there&#39;s a bit about the{" "}
                <Link as={NextLink} href="/about/backstory" textDecoration="underline">
                  history of Crossroads
                </Link>
                .
              </Text>
              <Text fontSize="lg">Thanks and all the best,</Text>
              <Text fontSize="lg">marq and the team</Text>
            </VStack>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={4}>
              What Crossroads Is
            </Heading>
            <VStack align="start" gap={3}>
              <Text fontSize="lg">Crossroads is a living experiment in how people come together.</Text>
              <Text fontSize="lg">
                It is not a social network. It is not a marketplace for attention. It is not
                designed for endless growth.
              </Text>
              <Text fontSize="lg">Crossroads exists to help people:</Text>
              <List.Root as="ul" gap={2} pl={4} fontSize="lg">
                <List.Item>gather with intention</List.Item>
                <List.Item>collaborate with care</List.Item>
                <List.Item>learn and teach what matters</List.Item>
                <List.Item>host meaningful conversations</List.Item>
                <List.Item>steward shared work over time</List.Item>
              </List.Root>
              <Text fontSize="lg">
                At its core, Crossroads is a community endeavor — shaped by the people who show up
                and sustained by shared responsibility.
              </Text>
            </VStack>
          </Box>
        </Box>
      </Box>
    </>
  );
}
