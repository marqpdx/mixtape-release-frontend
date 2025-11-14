// app/about/public/page.tsx
"use client";

import {
  Box,
  Flex,
  Text,
  Link,
  Button,
  VStack,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Badge,
} from "@chakra-ui/react";
import FullNavbar from "@components/about/FullNavbar";
import { ThemeSelector } from "@components/common/ThemeSelector";
import {
  IconEye,
  IconMessageCircle,
  IconCalendar,
  IconFileText,
  IconUsers,
  IconTrendingUp,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import NextLink from "next/link";

// Placeholder images - replace with your actual image paths
const exploreImage1 = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop";
const exploreImage2 = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop";

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

export default function AboutPublicPage() {
  return (
    <Box minHeight="100vh" bg="theme.bg" transition="all 0.3s ease">
      {/* Top Navigation Bar - Static, no motion wrapper */}

      {/* <FullNavbar active="public" sticky={true} /> */}

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
                        "Come for the content, stay for the community."
                      </Text>
                      <Text fontSize="md" color="theme.textSecondary" fontWeight="600">
                        — Community wisdom
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
                        Explore
                      </Heading>
                      <Heading
                        as="h1"
                        fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                        color="theme.accent"
                        fontWeight="700"
                        letterSpacing="-0.02em"
                        lineHeight="1.1"
                      >
                        Public Spaces
                      </Heading>
                      <Box w="120px" h="6px" bg="theme.accent" mt={6} borderRadius="full" />
                    </Box>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <HStack gap={4} align="start">
                      <Box color="theme.accent" mt={1}>
                        <IconEye size={28} />
                      </Box>
                      <Text fontSize="xl" color="theme.text" lineHeight="1.8">
                        Get a glimpse into Crossroads through our public commons. These are open spaces
                        where you can explore discussions, events, and projects before deciding to join.
                      </Text>
                    </HStack>
                  </motion.div>

                  {/* Available to Browse */}
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
                        Available to Browse
                      </Text>
                      <VStack align="start" gap={4}>
                        <HStack gap={3}>
                          <Box color="theme.accent"><IconUsers size={20} /></Box>
                          <Text fontSize="lg" color="theme.text">Public member profiles and introductions</Text>
                        </HStack>
                        <HStack gap={3}>
                          <Box color="theme.accent"><IconMessageCircle size={20} /></Box>
                          <Text fontSize="lg" color="theme.text">Open discussions and community threads</Text>
                        </HStack>
                        <HStack gap={3}>
                          <Box color="theme.accent"><IconCalendar size={20} /></Box>
                          <Text fontSize="lg" color="theme.text">Public events and gatherings</Text>
                        </HStack>
                        <HStack gap={3}>
                          <Box color="theme.accent"><IconFileText size={20} /></Box>
                          <Text fontSize="lg" color="theme.text">Selected documents, zines, and dispatches</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <ButtonLink
                      href="/explore"
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
                      Browse Public Commons
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
                  src={exploreImage1}
                  alt="Community exploration and discussion"
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
                  src={exploreImage2}
                  alt="Public workspace and collaboration"
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

        {/* Featured Public Content - Matching style */}
        <motion.div variants={itemVariants}>
          <Box py={20} px={8} bg="theme.bg" transition="all 0.3s ease">
            <Container maxW="6xl">
              <VStack gap={12} textAlign="center">
                <Heading
                  as="h2"
                  fontSize="3xl"
                  color="theme.text"
                  fontWeight="600"
                  letterSpacing="-0.025em"
                >
                  Featured Public Content
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6} w="full">
                  {/* Card 1 */}
                  <PublicCard
                    type="Discussion"
                    title="Urban Permaculture Projects"
                    summary="Sharing experiences from rooftop gardens and balcony food forests..."
                    meta1="23 replies"
                    meta2="Active"
                    icon1={<IconMessageCircle size={12} />}
                    icon2={<IconTrendingUp size={12} />}
                    color="green"
                    time="2 days ago"
                  />

                  {/* Card 2 */}
                  <PublicCard
                    type="Event"
                    title="Community Skill Share"
                    summary="Monthly gathering to share knowledge and learn from each other..."
                    meta1="15 attending"
                    meta2="Feb 15"
                    icon1={<IconUsers size={12} />}
                    icon2={<IconCalendar size={12} />}
                    color="blue"
                    time="Next week"
                  />

                  {/* Card 3 */}
                  <PublicCard
                    type="Document"
                    title="Community Guidelines"
                    summary="How we work together and support each other in this space..."
                    meta1="5 min read"
                    meta2="Public"
                    icon1={<IconFileText size={12} />}
                    icon2={<IconEye size={12} />}
                    color="purple"
                    time="1 week ago"
                  />
                </SimpleGrid>
              </VStack>
            </Container>
          </Box>
        </motion.div>

        {/* CTA - Matching style */}
        <motion.div variants={itemVariants}>
          <Box
            bg="theme.border"
            py={20}
            px={8}
            transition="all 0.3s ease"
          >
            <Container maxW="5xl">
              <VStack gap={8} textAlign="center">
                <Heading
                  as="h2"
                  fontSize="3xl"
                  color="theme.accent"
                  fontWeight="600"
                >
                  Ready to Join the Full Community?
                </Heading>
                <Text
                  fontSize="xl"
                  color="theme.textSecondary"
                  lineHeight="1.8"
                  maxW="4xl"
                >
                  These public glimpses are just the beginning. The full Crossroads experience includes private groups, collaborative projects, and deeper connections.
                </Text>
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

type PublicCardProps = {
  type: string;
  title: string;
  summary: string;
  meta1: string;
  meta2: string;
  icon1: React.ReactNode;
  icon2: React.ReactNode;
  color: string;
  time: string;
};

function PublicCard({ type, title, summary, meta1, meta2, icon1, icon2, color, time }: PublicCardProps) {
  const colorMap = {
    green: "green.500",
    blue: "blue.500",
    purple: "purple.500",
  } as const;

  return (
    <Box
      bg="theme.surface"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="theme.border"
      shadow="sm"
      textAlign="left"
      _hover={{
        transform: "translateY(-4px)",
        shadow: "lg"
      }}
      transition="all 0.2s"
    >
      <HStack justify="space-between" mb={3}>
        <Badge colorScheme={color} variant="subtle">{type}</Badge>
        <Text fontSize="xs" color="theme.textSecondary">{time}</Text>
      </HStack>
      <Heading as="h3" size="sm" color="theme.text" mb={2}>{title}</Heading>
      <Text fontSize="sm" color="theme.textSecondary" mb={4} lineHeight="1.5">{summary}</Text>
      <HStack gap={4} fontSize="xs" color="theme.textSecondary">
        <HStack gap={1}>{icon1}<Text>{meta1}</Text></HStack>
        <HStack gap={1}>{icon2}<Text>{meta2}</Text></HStack>
      </HStack>
    </Box>
  );
}