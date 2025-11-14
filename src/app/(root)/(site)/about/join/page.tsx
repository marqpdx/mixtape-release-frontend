// app/about/join/page.tsx
"use client";

import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  Container,
  Heading,
  HStack,
  Link,
  Collapsible,
} from "@chakra-ui/react";
import {
  IconPlant,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
  IconUsers,
  IconBook,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import NextLink from "next/link";
import { useState } from "react";

const heroImage = "/aboutpage/noaa-UJsUJr3cgEM-unsplash.jpg";

function ButtonLink({
  href,
  children,
  ...buttonProps
}: {
  href: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof Button>) {
  return (
    <NextLink href={href} passHref>
      <Button {...buttonProps}>{children}</Button>
    </NextLink>
  );
}

// Framer Motion
const pageVariants = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const pageTransition = { type: "tween" as const, duration: 0.25 };
const itemVariants = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } };

export default function AboutJoinPage() {
  const [whyOpen, setWhyOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  return (
    <Box minH="100vh" bg="theme.bg" transition="all 0.3s ease">
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        style={{ width: "100%" }}
      >
        {/* Compact Hero Section */}
        <Flex direction={{ base: "column", lg: "row" }} minH={{ base: "auto", lg: "60vh" }}>
          {/* Left: Content - More compact */}
          <Flex
            flex="1.2"
            direction="column"
            justify="center"
            py={{ base: 8, md: 12 }}
            px={{ base: 6, md: 10 }}
          >
            <Container maxW="xl" px={0}>
              <VStack align="start" gap={6}>
                {/* Smaller, inline quote */}
                <motion.div variants={itemVariants}>
                  <Box
                    p={4}
                    bg="theme.surface"
                    borderLeft="4px solid"
                    borderLeftColor="theme.accent"
                    borderRadius="lg"
                    shadow="sm"
                  >
                    <Text fontSize="lg" fontStyle="italic" color="theme.text" mb={1}>
                      "Community is not a place, but a practice."
                    </Text>
                    <Text fontSize="xs" color="theme.textSecondary" fontWeight="600">
                      — adrienne maree brown
                    </Text>
                  </Box>
                </motion.div>

                {/* Compact Headline */}
                <motion.div variants={itemVariants}>
                  <Box>
                    <Heading
                      as="h1"
                      fontSize={{ base: "3xl", md: "4xl" }}
                      color="theme.text"
                      fontWeight="300"
                      letterSpacing="-0.02em"
                      lineHeight="1.1"
                      mb={2}
                    >
                      Join Crossroads
                    </Heading>
                    <Box w="80px" h="4px" bg="theme.accent" borderRadius="full" />
                  </Box>
                </motion.div>

                {/* Concise intro */}
                <motion.div variants={itemVariants}>
                  <Text fontSize="lg" color="theme.text" lineHeight="1.7" maxW="lg">
                    A regenerative community where curious minds gather to learn, create,
                    and grow together. Join to connect with people, explore ideas, and
                    bring projects to life.
                  </Text>
                </motion.div>

                {/* Key Services Highlight */}
                <motion.div variants={itemVariants}>
                  <Box
                    bg="theme.border"
                    p={5}
                    borderRadius="lg"
                    borderLeft="4px solid"
                    borderLeftColor="theme.accent"
                  >
                    <VStack align="start" gap={3}>
                      <HStack gap={3}>
                        <Box color="theme.accent">
                          <IconUsers size={20} />
                        </Box>
                        <Text fontSize="md" color="theme.text" fontWeight="600">
                          What you'll find here
                        </Text>
                      </HStack>
                      <VStack align="start" gap={1} fontSize="sm" color="theme.textSecondary">
                        <Text>• <strong>Learning Communities:</strong> EarthLab cohorts, skill shares, study groups</Text>
                        <Text>• <strong>Creative Collaboration:</strong> Project partnerships, maker spaces, art circles</Text>
                        <Text>• <strong>Local Connections:</strong> Place-based gatherings, workshops, mutual aid</Text>
                        <Text>• <strong>Threaded Discussions:</strong> Deep conversations on regeneration, culture, futures</Text>
                      </VStack>

                      <Collapsible.Root open={whyOpen} onOpenChange={({ open }) => setWhyOpen(open)}>
                        <Collapsible.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            borderRadius="full"
                            px={3}
                            _hover={{ color: "theme.accent" }}
                          >
                            {whyOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                            {whyOpen ? "Less" : "More"}
                          </Button>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <VStack align="start" gap={1} mt={2} fontSize="sm" color="theme.textSecondary">
                            <Text>• Access member-only forums and working groups</Text>
                            <Text>• Join interest-based circles (permaculture, tech for good, storytelling)</Text>
                            <Text>• Participate in seasonal gatherings and skill swaps</Text>
                            <Text>• Connect through our place-based Tapestry map</Text>
                          </VStack>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </VStack>
                  </Box>
                </motion.div>

                {/* How it works - streamlined */}
                <motion.div variants={itemVariants}>
                  <VStack align="start" gap={3}>
                    <HStack gap={2} color="theme.textSecondary">
                      <IconInfoCircle size={16} />
                      <Text fontSize="sm" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                        How it works
                      </Text>
                    </HStack>
                    <VStack align="start" gap={1} fontSize="sm" color="theme.textSecondary">
                      <Text><strong>$3/month</strong> with a <strong>30-day free trial</strong></Text>
                      <Text>Community agreements guide our shared space</Text>
                      <Text>Full control over your privacy and notifications</Text>
                    </VStack>

                    <Collapsible.Root open={howOpen} onOpenChange={({ open }) => setHowOpen(open)}>
                      <Collapsible.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          borderRadius="full"
                          px={3}
                          _hover={{ color: "theme.accent" }}
                        >
                          {howOpen ? "Show less" : "Details"}
                          {howOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </Button>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <VStack align="start" gap={1} mt={2} fontSize="sm" color="theme.textSecondary">
                          <Text>• Invited guests can join specific groups without full membership</Text>
                          <Text>• Cancel anytime, keep connections you've made</Text>
                          <Text>• Scholarship options available for financial accessibility</Text>
                        </VStack>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  </VStack>
                </motion.div>

                {/* Primary CTA - more prominent */}
                <motion.div variants={itemVariants}>
                  <VStack align="start" gap={3} pt={2}>
                    <ButtonLink
                      href="/welcome/start"
                      bg="theme.accent"
                      color="white"
                      size="lg"
                      borderRadius="xl"
                      px={8}
                      py={6}
                      fontWeight="700"
                      fontSize="lg"
                      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                      transition="all 0.2s"
                    >
                      Start your free trial
                    </ButtonLink>

                    <HStack gap={4} fontSize="sm">
                      <Link
                        as={NextLink}
                        href="/about/how-it-works"
                        color="theme.textSecondary"
                        _hover={{ color: "theme.accent" }}
                        fontWeight="500"
                      >
                        How Crossroads works →
                      </Link>
                      <Link
                        as={NextLink}
                        href="/about/public"
                        color="theme.textSecondary"
                        _hover={{ color: "theme.accent" }}
                        fontWeight="500"
                      >
                        Browse public spaces →
                      </Link>
                    </HStack>
                  </VStack>
                </motion.div>
              </VStack>
            </Container>
          </Flex>

          {/* Right: Smaller Image */}
          <Box
            flex="0.8"
            display={{ base: "none", lg: "block" }}
            position="relative"
            minH="60vh"
          >
            <Image
              src={heroImage}
              alt="Storm clouds and rainbow"
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
              priority
              quality={85}
            />
            <Box
              position="absolute"
              bottom={4}
              right={4}
              bg="rgba(0,0,0,0.7)"
              px={3}
              py={1}
              borderRadius="md"
            >
              <Text fontSize="xs" color="white">
                Photo: <Link href="https://unsplash.com/@noaa" color="theme.accent">NOAA</Link>
              </Text>
            </Box>
          </Box>
        </Flex>

        {/* Optional: Additional context section */}
        <Box py={12} px={6} bg="theme.border">
          <Container maxW="4xl">
            <motion.div variants={itemVariants}>
              <VStack gap={6} textAlign="center">
                <HStack gap={2} color="theme.accent">
                  <IconBook size={20} />
                  <Heading as="h3" size="lg" color="theme.text" fontWeight="600">
                    Built for Deep Connection
                  </Heading>
                </HStack>
                <Text fontSize="md" color="theme.textSecondary" lineHeight="1.7" maxW="3xl">
                  Crossroads isn't just another social platform. We're designed around slow,
                  intentional community building—where relationships develop through shared
                  projects, learning, and presence both online and in real life.
                  Our tools support collaboration, not just conversation.
                </Text>
              </VStack>
            </motion.div>
          </Container>
        </Box>
      </motion.div>
    </Box>
  );
}