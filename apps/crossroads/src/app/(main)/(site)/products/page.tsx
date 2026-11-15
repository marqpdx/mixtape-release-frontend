// apps/crossroads/src/app/(main)/(site)/products/page.tsx

"use client";

import NextLink from "next/link";
import { productArtwork } from "./artwork";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IconArrowRight, IconBook2, IconMap2, IconUsers } from "@tabler/icons-react";

const products = [
  {
    name: "Catalyst",
    eyebrow: "Knowledge environment",
    title: "For organizations whose knowledge has outgrown memory and folders.",
    body: "Catalyst gives a client a private Codex: a stable place to gather source material, explain what matters, and make knowledge useful to people and AI agents without surrendering judgment.",
    expects: ["Client login", "Codex landing page", "Simple navigation", "Help and product material", "Optional stewardship cadence"],
    imagePosition: "left" as const,
    icon: IconBook2,
  },
  {
    name: "Crossroads",
    eyebrow: "Working in common",
    title: "For groups that need a calmer place to write, decide, and keep moving.",
    body: "Crossroads gives a group a working home for drafts, dispatches, shared lists, and the small rituals that keep the work held in common from disappearing into chat history.",
    expects: ["Group workspace", "Draft and dispatch flow", "Member-facing pages", "Shared writing and review", "Optional Catalyst pairing"],
    imagePosition: "right" as const,
    icon: IconUsers,
  },
  {
    name: "Tapestry",
    eyebrow: "Place and story · in development",
    title: "For people and groups whose work is bound up with place.",
    body: "Tapestry is where place matters. People share why a place matters to them, and those stories build into a living map of a region. Groups that choose to can be found there too, through the places and people they are already part of.",
    expects: ["Stories tied to place", "A shared map of the region", "Opt-in discovery", "Connections through people and place", "Clear boundaries on what is shown"],
    imagePosition: "left" as const,
    icon: IconMap2,
  },
];

export default function ProductsPage() {
  const image = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  return (
    <Box
      className="crprod-root"
      bg="theme.bg"
      color="theme.text"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crprod-masthead" borderBottom="2px solid" borderColor={productArtwork.gold}>
        <Container className="crprod-masthead-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <VStack className="crprod-masthead-copy" align="start" gap={5} maxW="820px">
            <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase">
              Product paths
            </Text>
            <Heading
              as="h1"
              fontFamily='Georgia, "Times New Roman", serif'
              fontWeight="400"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.08"
              letterSpacing="0"
            >
              Three ways into Mixtape.
            </Heading>
            <Text color="theme.textMuted" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="65ch">
              A client can begin with a private knowledge Codex, a group home for working in common, or a shared map of place. Many will eventually need more than one.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Box className="crprod-product-rows">
        {products.map((product) => {
          const Icon = product.icon;
          const imagePane = (
            <Box
              className="crprod-image-pane"
              flex={{ base: "0 0 auto", lg: "0 0 40%" }}
              minH={{ base: "320px", md: "420px", lg: "58vh" }}
              bgImage={`${productArtwork.photoOverlay}, url(${image})`}
              bgSize="cover"
              backgroundPosition={product.name === "Crossroads" ? "center right" : "center"}
              borderRightWidth={{ base: "0", lg: product.imagePosition === "left" ? "1px" : "0" }}
              borderRightStyle="solid"
              borderRightColor="ui.borderSubtle"
              borderLeftWidth={{ base: "0", lg: product.imagePosition === "right" ? "1px" : "0" }}
              borderLeftStyle="solid"
              borderLeftColor="ui.borderSubtle"
            />
          );

          const contentPane = (
            <Flex
              className="crprod-content-pane"
              flex="1"
              minH={{ base: "auto", lg: "58vh" }}
              align="center"
              px={{ base: 5, md: 10, xl: 16 }}
              py={{ base: 10, md: 12 }}
            >
              <VStack className="crprod-product-copy" align="start" gap={6} maxW="700px">
                <HStack className="crprod-product-eyebrow" gap={3} color="theme.text">
                  <Icon size={28} />
                  <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase">
                    {product.eyebrow}
                  </Text>
                </HStack>

                <Box className="crprod-description">
                  <Heading
                    as="h2"
                    fontFamily='Georgia, "Times New Roman", serif'
                    fontWeight="400"
                    fontSize={{ base: "3xl", md: "5xl" }}
                    lineHeight="1.08"
                    letterSpacing="0"
                    mb={5}
                  >
                    {product.name}
                  </Heading>
                  <Heading
                    as="h3"
                    fontFamily='Georgia, "Times New Roman", serif'
                    fontWeight="400"
                    fontSize={{ base: "xl", md: "3xl" }}
                    lineHeight="1.18"
                    letterSpacing="0"
                    maxW="760px"
                    mb={5}
                  >
                    {product.title}
                  </Heading>
                  <Text color="theme.textMuted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7" maxW="65ch">
                    {product.body}
                  </Text>
                </Box>

                <Box className="crprod-expects" w="100%" borderTop="1px solid" borderColor="ui.borderSubtle">
                  {product.expects.map((item) => (
                    <Flex className="crprod-expect-row" key={item} py={3} borderBottom="1px solid" borderColor="ui.borderSubtle" gap={3} align="center">
                      <Text color="theme.text" fontFamily='Georgia, "Times New Roman", serif' fontSize="lg">
                        /
                      </Text>
                      <Text color="theme.text">{item}</Text>
                    </Flex>
                  ))}
                </Box>
              </VStack>
            </Flex>
          );

          return (
            <Flex
              className="crprod-product-row"
              key={product.name}
              direction={{ base: "column", lg: "row" }}
              bg="theme.surface"
              borderBottom="1px solid"
              borderColor="ui.borderSubtle"
            >
              {product.imagePosition === "left" ? imagePane : contentPane}
              {product.imagePosition === "left" ? contentPane : imagePane}
            </Flex>
          );
        })}
      </Box>

      <Box className="crprod-closing" py={{ base: 12, md: 16 }}>
        <Container className="crprod-closing-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Flex className="crprod-closing-panel"
            bg="ui.surfaceSubtle"
            borderLeft="3px solid"
            borderColor="ui.borderSubtle"
            p={{ base: 6, md: 8 }}
            gap={6}
            align={{ base: "start", md: "center" }}
            justify="space-between"
            direction={{ base: "column", md: "row" }}
          >
            <Box className="crprod-closing-copy" maxW="760px">
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="0" mb={3}>
                The first product conversation is a fit conversation.
              </Heading>
              <Text color="theme.textMuted" lineHeight="1.7">
                We can start with one path, pair two together, or add managed stewardship where the hard part is not installation but coherence over time.
              </Text>
            </Box>
            <Button asChild maxW="full" h="auto" py={3} whiteSpace="normal" variant="solid" borderRadius="3px">
              <Link color="theme.accentText" textDecoration="none" _hover={{ color: "theme.accentText" }} _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }} as={NextLink} href="/contact?interest=products">
                <HStack className="crprod-inquiry-label" gap={2}>
                  <Text>Start an inquiry</Text>
                  <IconArrowRight size={17} />
                </HStack>
              </Link>
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
