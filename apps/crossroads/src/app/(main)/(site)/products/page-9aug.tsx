// apps/crossroads/src/app/(main)/(site)/products/page.tsx

"use client";

import NextLink from "next/link";
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
    name: "Mixtape",
    eyebrow: "Collaborative work area",
    title: "For groups that need a calmer place to write, decide, and keep moving.",
    body: "Mixtape gives a group a working home for drafts, dispatches, shared lists, and the small rituals that keep collaboration from disappearing into chat history.",
    expects: ["Group workspace", "Draft and dispatch flow", "Member-facing pages", "Shared writing and review", "Optional Catalyst pairing"],
    imagePosition: "right" as const,
    icon: IconUsers,
  },
  {
    name: "Tapestry",
    eyebrow: "Opt-in collective layer",
    title: "For people and groups ready to become discoverable in the right way.",
    body: "Tapestry is the wider Crossroads map: a relational layer that can be turned on when a client wants neighboring work, trusted services, local knowledge, or aligned groups to find one another.",
    expects: ["Tapestry profile", "Map placement", "Discovery settings", "Relationship signals", "Clear opt-in boundaries"],
    imagePosition: "left" as const,
    icon: IconMap2,
  },
];

export default function ProductsPage() {
  const image = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  return (
    <Box
      className="crprod-root"
      bg="#F4F5F8"
      color="#1A2138"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crprod-masthead" borderBottom="2px solid" borderColor="#B8922A">
        <Container className="crprod-masthead-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <VStack align="start" gap={5} maxW="820px">
            <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase">
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
              Three ways Crossroads becomes useful.
            </Heading>
            <Text color="#5C6880" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="65ch">
              A client can begin with a private knowledge Codex, a collaborative group home, or the opt-in relational map. Many will eventually need more than one.
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
              bgImage={`linear-gradient(180deg, rgba(26, 33, 56, 0.08), rgba(26, 33, 56, 0.22)), url(${image})`}
              bgSize="cover"
              backgroundPosition={product.name === "Mixtape" ? "center right" : "center"}
              borderRight={{ base: "0", lg: product.imagePosition === "left" ? "1px solid #DDE1ED" : "0" }}
              borderLeft={{ base: "0", lg: product.imagePosition === "right" ? "1px solid #DDE1ED" : "0" }}
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
              <VStack align="start" gap={6} maxW="700px">
                <HStack gap={3} color="#1E4BD2">
                  <Icon size={28} />
                  <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase">
                    {product.eyebrow}
                  </Text>
                </HStack>

                <Box>
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
                  <Text color="#5C6880" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7" maxW="65ch">
                    {product.body}
                  </Text>
                </Box>

                <Box className="crprod-expects" w="100%" borderTop="1px solid" borderColor="#DDE1ED">
                  {product.expects.map((item) => (
                    <Flex key={item} py={3} borderBottom="1px solid" borderColor="#DDE1ED" gap={3} align="center">
                      <Text color="#1E4BD2" fontFamily='Georgia, "Times New Roman", serif' fontSize="lg">
                        /
                      </Text>
                      <Text color="#1A2138">{item}</Text>
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
              bg="#FFFFFF"
              borderBottom="1px solid"
              borderColor="#DDE1ED"
            >
              {product.imagePosition === "left" ? imagePane : contentPane}
              {product.imagePosition === "left" ? contentPane : imagePane}
            </Flex>
          );
        })}
      </Box>

      <Box className="crprod-closing" py={{ base: 12, md: 16 }}>
        <Container className="crprod-closing-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Flex
            bg="#EEF2FD"
            borderLeft="3px solid"
            borderColor="#1E4BD2"
            p={{ base: 6, md: 8 }}
            gap={6}
            align={{ base: "start", md: "center" }}
            justify="space-between"
            direction={{ base: "column", md: "row" }}
          >
            <Box maxW="760px">
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="0" mb={3}>
                The first product conversation is a fit conversation.
              </Heading>
              <Text color="#5C6880" lineHeight="1.7">
                We can start with one path, pair two together, or add managed stewardship where the hard part is not installation but coherence over time.
              </Text>
            </Box>
            <Button asChild bg="#1E4BD2" color="white" borderRadius="3px" _hover={{ bg: "#173AA4" }}>
              <Link as={NextLink} href="/contact?interest=products">
                <HStack gap={2}>
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
