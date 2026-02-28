// apps/crossroads/mixtape-release-frontend/src/app/page.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import {
  applyCrossroadsFontFamily,
  CROSSROADS_FONT_OPTIONS,
  CROSSROADS_FONT_STORAGE_KEY,
} from "@/contexts/ThemeContext";

export default function CrossroadsHomepage() {
  const backgroundImage = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  const palette = {
    ink: "#1C1C1A",
    bone: "#F2EFE8",
    rust: "#C5533E",
  };

  const overlayCardBg = "rgba(242, 239, 232, 0.78)";
  const overlayBorder = "rgba(197, 83, 62, 0.4)";
  const heroText = palette.ink;
  const subtleText = "rgba(28, 28, 26, 0.82)";
  const linkColor = palette.rust;
  const linkHoverColor = "#8E3B2E";
  const overlayGradient = "linear-gradient(180deg, rgba(242,239,232,0.92) 0%, rgba(242,239,232,0.78) 45%, rgba(242,239,232,0.95) 100%)";
  const watermarkTextColor = "rgba(28, 28, 26, 0.7)";
  const watermarkHoverColor = palette.ink;

  const fontOptions = useMemo(() => CROSSROADS_FONT_OPTIONS, []);
  const [fontIndex, setFontIndex] = useState(() => {
    const defaultIndex = fontOptions.findIndex((option) => option.family === "var(--font-alegreya-sans)");
    return defaultIndex >= 0 ? defaultIndex : 0;
  });
  const activeFont = fontOptions[fontIndex % fontOptions.length];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CROSSROADS_FONT_STORAGE_KEY);
    const foundIndex = fontOptions.findIndex((option) => option.family === stored);
    if (foundIndex >= 0) {
      setFontIndex(foundIndex);
    }
  }, [fontOptions]);

  const rotateFont = () => {
    setFontIndex((prev) => {
      const next = (prev + 1) % fontOptions.length;
      applyCrossroadsFontFamily(fontOptions[next].family);
      return next;
    });
  };

  const ctaStyles = {
    solid: {
      variant: "solid" as const,
      bg: palette.rust,
      color: palette.bone,
      _hover: { bg: "#A54636" },
    },
    outline: {
      variant: "outline" as const,
      color: palette.rust,
      borderColor: palette.rust,
      _hover: { bg: "rgba(197, 83, 62, 0.12)" },
    },
    ghost: {
      variant: "ghost" as const,
      color: palette.ink,
      _hover: { bg: "rgba(28, 28, 26, 0.08)" },
    },
  };

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
      overflow="hidden"
      bg={palette.bone}
    >
      {/* Background image (grayscale) */}
      <Box
        position="absolute"
        inset={0}
        backgroundImage={`url(${backgroundImage})`}
        backgroundSize="cover"
        backgroundRepeat="no-repeat"
        backgroundPosition="center"
        css={{ filter: "grayscale(1) contrast(1.05)" }}
      />

      {/* Readability overlay */}
      <Box
        position="absolute"
        inset={0}
        bg={overlayGradient}
      />

      {/* Topographic lines */}
      <Box
        position="absolute"
        inset={0}
        opacity={0.5}
        backgroundImage={`
          repeating-linear-gradient(12deg, rgba(197, 83, 62, 0.18) 0px, rgba(197, 83, 62, 0.18) 1px, transparent 1px, transparent 14px),
          repeating-linear-gradient(-18deg, rgba(197, 83, 62, 0.12) 0px, rgba(197, 83, 62, 0.12) 1px, transparent 1px, transparent 18px)
        `}
        mixBlendMode="multiply"
      />

      {/* Angular + organic overlays */}
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
      >
        <Box
          position="absolute"
          top="-10%"
          left="-5%"
          w="60%"
          h="70%"
          bg="rgba(197, 83, 62, 0.22)"
          clipPath="polygon(0% 0%, 72% 0%, 100% 38%, 72% 82%, 0% 100%)"
          transform="rotate(-2deg)"
        />
        <Box
          position="absolute"
          bottom="-15%"
          right="-10%"
          w="70%"
          h="70%"
          bg="rgba(197, 83, 62, 0.14)"
          borderRadius="999px"
          filter="blur(2px)"
        />
      </Box>

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
              boxShadow="0 0 0 1px rgba(197, 83, 62, 0.25), 0 18px 48px rgba(28, 28, 26, 0.3)"
            >
              <VStack className="main-area" align="start" gap={4} maxW="760px">
                <HStack
                  gap={3}
                  align="center"
                  bg="rgba(197, 83, 62, 0.08)"
                  border="1px solid"
                  borderColor="rgba(197, 83, 62, 0.25)"
                  px={3}
                  py={2}
                  borderRadius="full"
                >
                  <Text fontSize="xs" color={subtleText}>
                    Font: {activeFont.label}
                  </Text>
                  <Button size="xs" variant="outline" onClick={rotateFont}>
                    Rotate font
                  </Button>
                </HStack>
                <Heading
                  as="h1"
                  fontSize={{ base: "2xl", md: "3xl" }}
                  lineHeight="1.1"
                  color={heroText}
                >
                  Crossroads is co-created community for practical, grounded work.
                </Heading>


                <Text fontSize={{ base: "md", md: "lg" }} color={subtleText} lineHeight="tall">
                  Crossroads is also an experiment in our mutual flourishing (thank you RWK). An opportunity to transcend an era rife with torment and lies. We can thrive together. This is yet another offering in that direction.
                </Text>

                <Text fontSize={{ base: "md", md: "lg" }} color={subtleText} lineHeight="tall">
                  We are in very early stages, and operating by invitation only. If you want to signup to be emailed with updates, <Link href="/contact?tab=newsletter">click here</Link>.
                </Text>

                <Text display={'none'} fontSize={{ base: "md", md: "lg" }} color={subtleText} lineHeight="tall">
                  Join groups, learn with others, and build projects that last — with tools that honor
                  your time, your data, and your people.
                </Text>

                {/* “In 30 seconds” */}
                <Box display={'none'} pt={2}>
                  <Text fontWeight="bold" color={heroText} mb={2}>
                    In 30 seconds:
                  </Text>
                  <VStack align="start" gap={1} color={subtleText} fontSize={{ base: "sm", md: "md" }}>
                    <Text>• Explore public pages to get the vibe and the values.</Text>
                    <Text>• If it fits, request to join — membership is intentional.</Text>
                    <Text>• Once inside, you can participate in Groups and (later) create Circles/Communities.</Text>
                  </VStack>
                </Box>

                {/* CTAs — hrefs live in child Links */}
                <HStack gap={3} pt={4} flexWrap="wrap">
                  <Button
                    size="lg"
                    asChild
                    {...ctaStyles.solid}
                  >
                    <Link as={NextLink} href="/about">
                      <HStack gap={2}>
                        <IconArrowRight size={18} />
                        <Text>Learn more</Text>
                      </HStack>
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    asChild
                    {...ctaStyles.outline}
                  >
                    <Link as={NextLink} href="/contact?tab=newsletter">
                      <HStack gap={2}>
                        <IconUsers size={18} />
                        <Text>Keep me updated</Text>
                      </HStack>
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    asChild
                    {...ctaStyles.ghost}
                  >
                    <Link as={NextLink} href="/login">
                      <HStack gap={2}>
                        <IconLogin size={18} />
                        <Text>Login</Text>
                      </HStack>
                    </Link>
                  </Button>
                </HStack>

                <Text display={'none'} fontSize="sm" color={subtleText} pt={2}>
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
                  boxShadow="0 0 0 1px rgba(197, 83, 62, 0.2), 0 20px 50px rgba(28, 28, 26, 0.22)"
                  _hover={{ transform: "translateY(-2px)" }}
                  transition="all 0.2s ease"
                >
                  <VStack align="start" gap={3}>
                    <Heading as="h2" fontSize="xl" color={heroText}>
                      {card.title}
                    </Heading>
                    <Text color={subtleText} lineHeight="tall">
                      {card.body}
                    </Text>

                    <Button
                      {...ctaStyles[card.variant]}
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
