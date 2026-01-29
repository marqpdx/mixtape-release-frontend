// mixtape-release-frontend/src/app/page.tsx
"use client";

import React from "react";
import NextLink from "next/link";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IconArrowRight, IconUsers, IconLogin } from "@tabler/icons-react";
import { LuExternalLink } from "react-icons/lu";
import { useColorModeValue } from "@components/ui/color-mode";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

export default function CrossroadsHomepage() {
  const backgroundImage = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  const overlayCardBg = useColorModeValue("whiteAlpha.800", "blackAlpha.500");
  const overlayBorder = useColorModeValue("whiteAlpha.500", "whiteAlpha.200");
  const heroText = useColorModeValue("gray.900", "white");
  const subtleText = useColorModeValue("gray.700", "whiteAlpha.900");
  const linkColor = useColorModeValue("blue.700", "blue.200");
  const linkHoverColor = useColorModeValue("blue.900", "blue.100");
  const overlayGradient = useColorModeValue(
    "linear(to-b, whiteAlpha.800, whiteAlpha.700, whiteAlpha.900)",
    "linear(to-b, blackAlpha.700, blackAlpha.500, blackAlpha.800)"
  );
  const watermarkTextColor = useColorModeValue("gray.700", "gray.300");
  const watermarkHoverColor = useColorModeValue("gray.900", "white");

  const cards = [
    {
      title: "Explore",
      body: "Browse the public-facing story: values, structure, and what we’re building.",
      href: "/about/public",
      cta: "Start exploring",
      icon: <IconArrowRight size={18} />,
      variant: "solid" as const,
    },
    {
      title: "Join",
      body: "Crossroads is not a growth-hack funnel. Joining is a considered step.",
      href: "/about/join",
      cta: "Request membership",
      icon: <IconUsers size={18} />,
      variant: "outline" as const,
    },
    {
      title: "Return",
      body: "Already part of Crossroads? Head to your dashboard.",
      href: "/login",
      cta: "Login",
      icon: <IconLogin size={18} />,
      variant: "ghost" as const,
    },
  ];

  return (
    <Box
      position="relative"
      minH="100vh"
      backgroundImage={`url(${backgroundImage})`}
      backgroundSize="cover"
      backgroundRepeat="no-repeat"
      backgroundPosition="center"
      overflow="hidden"
    >
      {/* Readability overlay */}
      <Box
        position="absolute"
        inset={0}
        bgGradient={overlayGradient}
      />

      <Box position="relative" zIndex={1}>
        <UnifiedNavbar />

        <Container maxW="1100px" pt={{ base: 10, md: 16 }} pb={{ base: 10, md: 16 }}>
          <VStack align="stretch" gap={{ base: 8, md: 10 }}>
            {/* HERO */}
            <Box
              bg={overlayCardBg}
              backdropFilter="blur(12px)"
              borderRadius="2xl"
              border="1px solid"
              borderColor={overlayBorder}
              px={{ base: 6, md: 10 }}
              py={{ base: 7, md: 10 }}
              boxShadow="0 20px 60px rgba(0,0,0,0.25)"
            >
              <VStack align="start" gap={4} maxW="760px">
                <Heading
                  as="h1"
                  fontSize={{ base: "3xl", md: "4xl" }}
                  lineHeight="1.1"
                  color={heroText}
                  fontFamily="heading"
                >
                  Crossroads is a co-created community for practical, grounded work.
                </Heading>

                <Text fontSize={{ base: "md", md: "lg" }} color={subtleText} lineHeight="tall" fontFamily="body">
                  Join groups, learn with others, and build projects that last — with tools that honor
                  your time, your data, and your people.
                </Text>

                {/* “In 30 seconds” */}
                <Box pt={2}>
                  <Text fontWeight="bold" color={heroText} mb={2} fontFamily="body">
                    In 30 seconds:
                  </Text>
                  <VStack align="start" gap={1} color={subtleText} fontSize={{ base: "sm", md: "md" }} fontFamily="body">
                    <Text>• Explore public pages to get the vibe and the values.</Text>
                    <Text>• If it fits, request to join — membership is intentional.</Text>
                    <Text>• Once inside, you can participate in Groups and (later) create Circles/Communities.</Text>
                  </VStack>
                </Box>

                {/* CTAs — hrefs live in child Links */}
                <HStack gap={3} pt={4} flexWrap="wrap">
                  <Button
                    colorScheme="green"
                    size="lg"
                    asChild
                  >
                    <Link as={NextLink} href="/about/public">
                      <HStack gap={2}>
                        <IconArrowRight size={18} />
                        <Text>Explore Public</Text>
                      </HStack>
                    </Link>
                  </Button>

                  <Button
                    colorScheme="green"
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <Link as={NextLink} href="/about/join">
                      <HStack gap={2}>
                        <IconUsers size={18} />
                        <Text>Request to Join</Text>
                      </HStack>
                    </Link>
                  </Button>

                  <Button
                    colorScheme="green"
                    variant="ghost"
                    size="lg"
                    asChild
                  >
                    <Link as={NextLink} href="/login">
                      <HStack gap={2}>
                        <IconLogin size={18} />
                        <Text>Login</Text>
                      </HStack>
                    </Link>
                  </Button>
                </HStack>

                <Text fontSize="sm" color={subtleText} pt={2} fontFamily="body">
                  Want the full walkthrough?{" "}
                  <Link
                    as={NextLink}
                    href="/about/how-it-works"
                    textDecoration="underline"
                    color={linkColor}
                    _hover={{ color: linkHoverColor }}
                  >
                    How it works
                  </Link>
                </Text>
              </VStack>
            </Box>

            {/* CHOOSE YOUR PATH */}
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              {cards.map((card) => (
                <Box
                  key={card.title}
                  bg={overlayCardBg}
                  backdropFilter="blur(12px)"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={overlayBorder}
                  p={6}
                  boxShadow="0 20px 60px rgba(0,0,0,0.18)"
                  _hover={{ transform: "translateY(-2px)" }}
                  transition="all 0.2s ease"
                >
                  <VStack align="start" gap={3}>
                    <Heading as="h2" fontSize="xl" color={heroText} fontFamily="heading">
                      {card.title}
                    </Heading>
                    <Text color={subtleText} lineHeight="tall" fontFamily="body">
                      {card.body}
                    </Text>

                    <Button
                      colorScheme="green"
                      variant={card.variant}
                      mt={2}
                      asChild
                    >
                      <Link as={NextLink} href={card.href}>
                        <HStack gap={2}>
                          {card.icon}
                          <Text>{card.cta}</Text>
                        </HStack>
                      </Link>
                    </Button>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>

            {/* NOAA attribution */}
            <Box pt={2}>
              <Link
                href="https://unsplash.com/@noaa"
                color={watermarkTextColor}
                _hover={{ color: watermarkHoverColor, textDecoration: "underline" }}
                transition="color 0.2s ease"
              >
                <HStack gap={2}>
                  <Text fontWeight="bold">@noaa</Text>
                  <Text>image courtesy of NOAA</Text>
                  <Box as="span" display="inline-flex">
                    <LuExternalLink />
                  </Box>
                </HStack>
              </Link>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
