// app/about/how-it-works/page.tsx
"use client";

import {
  Box,
  Flex,
  Text,
  VStack,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Link,
  Button,
} from "@chakra-ui/react";
import FullNavbar from "@components/about/FullNavbar";
import { ThemeSelector } from "@components/common/ThemeSelector";
import {
  IconSettings,
  IconUsers,
  IconShield,
  IconHeart,
  IconTarget,
  IconGitBranch,
  IconCompass,
  IconPlant2,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import NextLink from "next/link";

// ButtonLink component for combining Chakra Button with Next.js Link
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
      <Button {...buttonProps}>
        {children}
      </Button>
    </NextLink>
  );
}

// Placeholder images - replace with your actual image paths
const structureImage1 = "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop";
const structureImage2 = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop";

// Consistent transition variants across all about pages
const pageVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

const pageTransition = {
  type: "tween" as const,
  duration: 0.3
};

const containerVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0
  }
};

const itemVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1
  }
};

export default function AboutHowItWorksPage() {
  return (
    <Box minHeight="100vh" bg="theme.bg" transition="all 0.3s ease">
      {/* Top Navigation Bar - Static, no motion wrapper */}
      {/* <FullNavbar active="how-it-works" sticky={true} /> */}

      {/* Content Area - This gets the motion wrapper */}
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        style={{ width: "100%" }}
      >
        {/* Hero Split Section - Matching museum style */}
        <Flex direction={{ base: "column", xl: "row" }} minHeight="90vh">
          {/* Content Side - Narrow, Centered */}
          <Flex
            flex="1"
            direction="column"
            justify="center"
            py={{ base: 16, lg: 24 }}
            px={{ base: 8, lg: 16 }}
            bg="theme.bg"
          >
            <Container maxW="2xl" px={0}>
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
              >
                <VStack align="start" gap={10}>
                  {/* Intro Quote - Beautiful Typography */}
                  <motion.div variants={itemVariants}>
                    <Box
                      p={8}
                      bg="theme.surface"
                      borderLeft="6px solid"
                      borderLeftColor="theme.accent"
                      borderRadius="xl"
                      shadow="lg"
                      transform="rotate(-0.5deg)"
                      _hover={{ transform: "rotate(0deg)" }}
                      transition="all 0.3s"
                    >
                      <Text fontSize="2xl" fontStyle="italic" color="theme.text" mb={4} lineHeight="1.4">
                        "Structure enables freedom."
                      </Text>
                      <Text fontSize="md" color="theme.textSecondary" fontWeight="600">
                        — Design principle
                      </Text>
                    </Box>
                  </motion.div>

                  {/* Main Heading */}
                  <motion.div variants={itemVariants}>
                    <Box>
                      <Heading
                        as="h1"
                        fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                        color="theme.text"
                        fontWeight="300"
                        letterSpacing="-0.02em"
                        lineHeight="1.1"
                      >
                        How It
                      </Heading>
                      <Heading
                        as="h1"
                        fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                        color="theme.accent"
                        fontWeight="700"
                        letterSpacing="-0.02em"
                        lineHeight="1.1"
                      >
                        Works
                      </Heading>
                      <Box w="120px" h="6px" bg="theme.accent" mt={6} borderRadius="full" />
                    </Box>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <HStack gap={4} align="start">
                      <Box color="theme.accent" mt={1}>
                        <IconSettings size={28} />
                      </Box>
                      <Text fontSize="xl" color="theme.text" lineHeight="1.8">
                        Crossroads is built on principles of intentional community, shared stewardship,
                        and regenerative collaboration. Here's how we organize ourselves to support deep,
                        creative, and ethical connection.
                      </Text>
                    </HStack>
                  </motion.div>

                  {/* Core Principles */}
                  <motion.div variants={itemVariants}>
                    <Box>
                      <Text
                        fontSize="sm"
                        color="theme.textSecondary"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="1px"
                        mb={6}
                      >
                        Core Principles
                      </Text>
                      <VStack align="start" gap={6}>
                        <Principle
                          icon={<IconPlant2 size={24} />}
                          title="Regenerative Growth"
                          description="We grow in ways that strengthen rather than extract from our community and environment."
                        />
                        <Principle
                          icon={<IconShield size={24} />}
                          title="Intentional Membership"
                          description="Thoughtful curation creates trust, safety, and meaningful connections."
                        />
                        <Principle
                          icon={<IconCompass size={24} />}
                          title="Distributed Leadership"
                          description="Everyone can lead initiatives they care about while supporting others' visions."
                        />
                      </VStack>
                    </Box>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <ButtonLink
                      href="/handbook"
                      bg="theme.accent"
                      color="white"
                      size="lg"
                      px={8}
                      py={6}
                      fontSize="md"
                      fontWeight="600"
                      borderRadius="xl"
                      _hover={{
                        transform: "translateY(-2px)",
                        shadow: "lg",
                      }}
                      transition="all 0.2s"
                      w="full"
                    >
                      Read Full Handbook
                    </ButtonLink>
                  </motion.div>
                </VStack>
              </motion.div>
            </Container>
          </Flex>

          {/* Image Side - Two Stacked Images */}
          <motion.div
            variants={itemVariants}
            style={{ flex: "0.7" }}
          >
            <Box
              position="relative"
              minH={{ base: "500px", xl: "90vh" }}
              display={{ base: "none", xl: "flex" }}
              flexDirection="column"
              gap={4}
              p={4}
            >
              {/* Top Image */}
              <Box
                flex="1"
                position="relative"
                borderRadius="xl"
                overflow="hidden"
                shadow="lg"
              >
                <Image
                  src={structureImage1}
                  alt="Community structure and organization"
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: "center"
                  }}
                  priority
                  quality={95}
                />
              </Box>

              {/* Bottom Image */}
              <Box
                flex="1"
                position="relative"
                borderRadius="xl"
                overflow="hidden"
                shadow="lg"
              >
                <Image
                  src={structureImage2}
                  alt="Collaborative workspace"
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: "center"
                  }}
                  quality={95}
                />
              </Box>
            </Box>
          </motion.div>
        </Flex>

        {/* How We Organize - Matching style */}
        <motion.div variants={itemVariants}>
          <Box py={20} px={8} bg="theme.bg" transition="all 0.3s ease">
            <Container maxW="6xl">
              <VStack gap={12}>
                <Heading
                  as="h2"
                  fontSize="3xl"
                  color="theme.text"
                  fontWeight="600"
                  letterSpacing="-0.025em"
                  textAlign="center"
                >
                  How We Organize
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} w="full">
                  <OrgBlock
                    icon={<IconUsers size={28} />}
                    title="Groups & Projects"
                    bullets={[
                      "Anyone can start a group",
                      "Groups set their own rhythms",
                      "Cross-pollination encouraged",
                    ]}
                  >
                    Self-organizing groups form around shared interests — from permaculture to creative
                    writing to mutual aid.
                  </OrgBlock>

                  <OrgBlock
                    icon={<IconTarget size={28} />}
                    title="Decision Making"
                    bullets={[
                      "Transparent processes",
                      "Community input welcomed",
                      "Focus on workable solutions",
                    ]}
                  >
                    We use consent-based decision making for community-wide choices, while groups retain autonomy.
                  </OrgBlock>
                </SimpleGrid>
              </VStack>
            </Container>
          </Box>
        </motion.div>

        {/* What We Value - Matching style */}
        <motion.div variants={itemVariants}>
          <Box
            bg="theme.border"
            py={20}
            px={8}
            transition="all 0.3s ease"
          >
            <Container maxW="5xl">
              <VStack gap={12} textAlign="center">
                <Heading
                  as="h2"
                  fontSize="3xl"
                  color="theme.accent"
                  fontWeight="600"
                >
                  What We Value
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} w="full">
                  <ValueCard
                    icon={<IconHeart size={32} />}
                    title="Care & Intention"
                  >
                    We approach relationships and projects with thoughtfulness and care.
                  </ValueCard>

                  <ValueCard
                    icon={<IconGitBranch size={32} />}
                    title="Collaboration"
                  >
                    The best work happens when diverse minds come together.
                  </ValueCard>

                  <ValueCard
                    icon={<IconPlant2 size={32} />}
                    title="Growth"
                  >
                    We support each other's learning and development in all forms.
                  </ValueCard>
                </SimpleGrid>

                <ButtonLink
                  href="/about/join"
                  bg="theme.accent"
                  color="white"
                  size="lg"
                  px={8}
                  py={6}
                  fontSize="md"
                  fontWeight="600"
                  borderRadius="xl"
                  _hover={{
                    transform: "translateY(-2px)",
                    shadow: "lg",
                  }}
                  transition="all 0.2s"
                >
                  See About Joining
                </ButtonLink>
              </VStack>
            </Container>
          </Box>
        </motion.div>
      </motion.div>
    </Box>
  );
}

// NavItem component with reserved space for bold state
function NavItem({
  children,
  href,
  isActive = false
}: {
  children: React.ReactNode;
  href?: string;
  isActive?: boolean;
}) {
  const content = (
    <Box
      position="relative"
      fontSize="md"
      color={isActive ? "theme.text" : "theme.textSecondary"}
      fontWeight={isActive ? "700" : "400"}
      _hover={{
        color: "theme.accent",
        transform: "translateY(-1px)"
      }}
      transition="all 0.2s"
      // Reserve space for bold state to prevent shifting
      _before={{
        content: `"${children}"`,
        fontWeight: "700",
        fontSize: "md",
        visibility: "hidden",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 0,
        overflow: "hidden"
      }}
    >
      {children}
    </Box>
  );

  if (href) {
    return (
      <Link as={NextLink} href={href} _hover={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}

// --- Helper Components ---

function Principle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <HStack gap={4} align="start">
      <Box color="theme.accent" mt={1}>{icon}</Box>
      <Box>
        <Text fontSize="lg" color="theme.text" fontWeight="600" mb={2}>
          {title}
        </Text>
        <Text fontSize="md" color="theme.textSecondary" lineHeight="1.6">{description}</Text>
      </Box>
    </HStack>
  );
}

function OrgBlock({
  icon,
  title,
  children,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  bullets: string[];
}) {
  return (
    <Box
      bg="theme.surface"
      p={8}
      borderRadius="xl"
      border="1px solid"
      borderColor="theme.border"
      shadow="sm"
    >
      <HStack gap={4} mb={4}>
        <Box color="theme.accent">{icon}</Box>
        <Heading as="h3" size="md" color="theme.text">
          {title}
        </Heading>
      </HStack>
      <Text color="theme.textSecondary" lineHeight="1.6" mb={4}>{children}</Text>
      <VStack align="start" gap={2} fontSize="sm" color="theme.textSecondary">
        {bullets.map((bullet, i) => <Text key={i}>• {bullet}</Text>)}
      </VStack>
    </Box>
  );
}

function ValueCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <VStack gap={4}>
      <Box color="theme.accent">{icon}</Box>
      <Text fontWeight="600" color="theme.text" fontSize="lg">{title}</Text>
      <Text fontSize="md" color="theme.textSecondary" textAlign="center" lineHeight="1.6">{children}</Text>
    </VStack>
  );
}