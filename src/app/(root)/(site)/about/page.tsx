// app/(site)/about/page.tsx

"use client";

import {
  Box,
  Flex,
  Text,
  Link,
  VStack,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Button,
} from "@chakra-ui/react";
import FullNavbar from "@components/about/FullNavbar";
import { ThemeSelector } from "@components/common/ThemeSelector";
import {
  IconExternalLink,
  IconUsers,
  IconWorld,
  IconBook,
  IconFileText,
  IconCalendar,
  IconTool,
  IconHeart,
  IconPlant,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import NextLink from "next/link";

const stormImage = "/aboutpage/noaa-UJsUJr3cgEM-unsplash.jpg";

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

// Framer Motion variants for page transitions - Smoother, no horizontal shift
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

// Stagger children animations - gentler
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

export default function AboutPage() {
  return (
    <Box minHeight="100vh" bg="theme.bg" transition="all 0.3s ease">
      {/* Top Navigation Bar - Static, no motion wrapper */}
      {/* <FullNavbar active="about" sticky={true} /> */}

      {/* Content Area - This gets the motion wrapper */}
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        style={{ width: "100%" }}
      >

        {/* Hero Split Section - Museum Style */}
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
                        "All flourishing is mutual."
                      </Text>
                      <Text fontSize="md" color="theme.textSecondary" fontWeight="600">
                        — Robin Wall Kimmerer
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
                        Welcome to
                      </Heading>
                      <Heading
                        as="h1"
                        fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                        color="theme.accent"
                        fontWeight="700"
                        letterSpacing="-0.02em"
                        lineHeight="1.1"
                      >
                        Crossroads
                      </Heading>
                      <Box w="120px" h="6px" bg="theme.accent" mt={6} borderRadius="full" />
                    </Box>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Text fontSize="xl" color="theme.text" lineHeight="1.8" maxW="lg">
                      Crossroads is an intentional gathering place for creative, grounded, and curious people.
                      It's a space to build, to listen, to support one another — and to bring what we imagine into being.
                    </Text>
                  </motion.div>

                  {/* Membership Philosophy */}
                  <motion.div variants={itemVariants}>
                    <Box
                      bg="theme.border"
                      p={8}
                      borderRadius="xl"
                      borderLeft="6px solid"
                      borderLeftColor="theme.accent"
                      shadow="sm"
                    >
                      <HStack gap={4} align="start">
                        <Box color="theme.accent" mt={1}>
                          <IconPlant size={28} />
                        </Box>
                        <Text fontSize="lg" color="theme.text" lineHeight="1.7">
                          Membership is crafted, not automatic. New members are welcomed through
                          invitation or petition — helping us preserve the trust, intention, and care
                          that meaningful collaboration requires.
                        </Text>
                      </HStack>
                    </Box>
                  </motion.div>

                  {/* Who's Here - Clean List */}
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
                        Who You'll Find Here
                      </Text>
                      <VStack align="start" gap={4}>
                        <Text color="theme.text" fontSize="lg">🛠 Makers working on tools, zines, and experiments</Text>
                        <Text color="theme.text" fontSize="lg">🎓 Teachers running learning cohorts and hybrid labs</Text>
                        <Text color="theme.text" fontSize="lg">🎨 Artists exploring form, place, and shared meaning</Text>
                        <Text color="theme.text" fontSize="lg">🫱🏽‍🫲🏿 Organizers hosting gatherings and workshops</Text>
                        <Text color="theme.text" fontSize="lg">🌿 Learners following curiosity into community</Text>
                      </VStack>
                    </Box>
                  </motion.div>
                </VStack>
              </motion.div>
            </Container>
          </Flex>

          {/* Image Side - Full Height, No Constraints */}
          <motion.div
            variants={itemVariants}
            style={{ flex: "0.7" }}
          >
            <Box
              position="relative"
              minH={{ base: "500px", xl: "90vh" }}
              display={{ base: "none", xl: "block" }}
            >
              <Image
                src={stormImage}
                alt="Storm clouds and rainbow"
                fill
                style={{
                  objectFit: "cover",
                  objectPosition: "center"
                }}
                priority
                quality={95}
              />
              {/* Photo Credit - Elegant Overlay */}
              <Box
                position="absolute"
                bottom={6}
                right={6}
                bg="rgba(0,0,0,0.8)"
                px={4}
                py={3}
                borderRadius="lg"
                backdropFilter="blur(10px)"
              >
                <Text fontSize="sm" color="white">
                  Photo by <Link href="https://unsplash.com/@noaa" color="theme.accent">@noaa</Link>
                </Text>
              </Box>
            </Box>
          </motion.div>
        </Flex>

        {/* Call to Action - Full Width with Colorful Cards */}
        <motion.div variants={itemVariants}>
          <Box py={24} px={8} bg="theme.text" color="white" transition="all 0.3s ease">
            <Container maxW="6xl">
              <VStack gap={16} textAlign="center">
                <Box>
                  <Heading
                    as="h2"
                    fontSize="4xl"
                    fontWeight="300"
                    letterSpacing="-0.02em"
                    mb={6}
                    color="white"
                  >
                    Choose Your Path
                  </Heading>
                  <Text fontSize="xl" color="whiteAlpha.800" maxW="3xl" mx="auto" lineHeight="1.7">
                    People arrive at Crossroads in different ways. Start with the path that fits you best.
                  </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={10} w="full">
                  <CTACard
                    icon={<IconUsers size={32} />}
                    title="See About Joining"
                    description="Ready to become part of Crossroads? Our petition process is warm, personal, and helps us welcome you thoughtfully."
                    href="/about/join"
                    buttonText="Submit Your Petition"
                    variant="primary"
                  />

                  <CTACard
                    icon={<IconWorld size={32} />}
                    title="Browse Public Spaces"
                    description="Curious first? Explore our public commons — discussions, events, and projects that give you a taste of what happens here."
                    href="/about/public"
                    buttonText="Start Exploring"
                    variant="secondary"
                  />

                  <CTACard
                    icon={<IconBook size={32} />}
                    title="How It Works"
                    description="Want to understand the philosophy and mechanics? Learn about our approach to intentional community building."
                    href="/about/how-it-works"
                    buttonText="Discover Our Process"
                    variant="tertiary"
                  />
                </SimpleGrid>
              </VStack>
            </Container>
          </Box>
        </motion.div>

        {/* About Place - Full Width Accent Section */}
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
                  About Place
                </Heading>
                <Text
                  fontSize="xl"
                  color="theme.textSecondary"
                  lineHeight="1.8"
                  maxW="4xl"
                >
                  Place is not only where you are or where you're from — it's also where you love,
                  feel at home, and make lasting connections. At Crossroads, we honor place not just
                  as location, but as a thread of belonging. Our communities often begin online, but
                  they deepen in real life: through gatherings, projects, walks, workshops, and
                  shared presence.
                </Text>
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

type CTACardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  buttonText: string;
  variant: "primary" | "secondary" | "tertiary";
};

function CTACard({ icon, title, description, href, buttonText, variant }: CTACardProps) {
  // Theme-aware color variants that work with all color modes
  const variants = {
    primary: {
      iconBg: "theme.accent",
      iconHover: "theme.accent"
    },
    secondary: {
      iconBg: "theme.textSecondary",
      iconHover: "theme.accent"
    },
    tertiary: {
      iconBg: "theme.border",
      iconHover: "theme.accent"
    }
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -8
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Box
        bg="theme.surface"
        p={10}
        borderRadius="2xl"
        shadow="xl"
        textAlign="center"
        position="relative"
        overflow="hidden"
        borderColor="theme.border"
        border="1px solid"
        display="flex"
        flexDirection="column"
        minH="420px"
      >
        {/* Icon Background */}
        <Box
          w={20}
          h={20}
          bg={variants[variant].iconBg}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={6}
          color="white"
          shadow="lg"
          _hover={{
            bg: variants[variant].iconHover
          }}
          transition="all 0.3s"
        >
          {icon}
        </Box>

        <Heading as="h3" size="xl" mb={4} color="theme.text" fontSize="2xl">
          {title}
        </Heading>

        <Text color="theme.textSecondary" mb={8} lineHeight="1.6" fontSize="md" flex="1">
          {description}
        </Text>

        {/* Button positioned at bottom with consistent spacing */}
        <Box mt="auto" pt={4}>
          <ButtonLink
            href={href}
            bg="theme.accent"
            color="white"
            size="lg"
            w="full"
            borderRadius="xl"
            _hover={{
              transform: "translateY(-2px)",
              shadow: "lg"
            }}
            transition="all 0.2s"
            fontWeight="600"
            fontSize="lg"
            py={6}
          >
            {buttonText}
          </ButtonLink>
        </Box>
      </Box>
    </motion.div>
  );
}

