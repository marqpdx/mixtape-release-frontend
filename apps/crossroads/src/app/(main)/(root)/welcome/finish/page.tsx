// app/welcome/finish/page.tsx

"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Link,
  Collapsible,
  SimpleGrid,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  IconArrowRight,
  IconUserCircle,
  IconLayoutDashboard,
  IconCompass,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

type MinimalProfile = {
  firstInitial?: string;
  lastName?: string;
  locale?: string;
};

const isBrowser = typeof window !== "undefined";

const safeGetItem = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export default function WelcomeFinishPage() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [profile, setProfile] = useState<MinimalProfile | null>(null);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [openMore, setOpenMore] = useState(false);

  // Extract group name from query string (no useSearchParams)
  useEffect(() => {
    if (!isBrowser) return;

    try {
      const url = new URL(window.location.href);
      const group = url.searchParams.get("group") || "";
      setGroupName(group);
    } catch {
      setGroupName("");
    }
  }, []);

  // Load onboarding data from localStorage
  useEffect(() => {
    const rawProfile = safeGetItem("onboarding_minimal_profile");
    const ok = safeGetItem("agreements_accepted");

    try {
      setProfile(rawProfile ? (JSON.parse(rawProfile) as MinimalProfile) : null);
    } catch {
      setProfile(null);
    }

    setAccepted(ok === "true");
  }, []);

  // Redirect if agreements weren't accepted
  useEffect(() => {
    if (accepted === false) {
      const url =
        "/welcome/agreements" +
        (groupName ? `?group=${encodeURIComponent(groupName)}` : "");
      router.replace(url);
    }
  }, [accepted, groupName, router]);

  const greetingName = profile?.lastName
    ? `${profile.firstInitial ?? ""}. ${profile.lastName}`
    : undefined;

  return (
    <Box
      minH="100vh"
      bg="theme.bg"
      py={{ base: 10, md: 16 }}
      px={{ base: 6, md: 8 }}
    >
      <Container maxW="4xl" px={0}>
        <VStack align="start" gap={2} mb={6}>
          <Text
            fontSize="sm"
            color="theme.textSecondary"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Step 3 of 3
          </Text>
          <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
            {groupName
              ? `You&apos;re in — welcome to ${groupName}`
              : "You&apos;re in — welcome to Crossroads"}
          </Heading>
          <Text color="theme.textSecondary">
            {greetingName ? `Hi ${greetingName}.` : "Hi there."} Choose where
            you&apos;d like to start.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {/* Edit profile */}
          <NextCard
            icon={<IconUserCircle size={24} />}
            title="Edit your profile"
            desc="Add a photo, skills, and a short bio."
          >
            <Link
              as={NextLink}
              href="/member"
              _hover={{ textDecoration: "none" }}
            >
              <Button size="lg" borderRadius="xl" variant="outline">
                <IconArrowRight size={18} /> Go to profile
              </Button>
            </Link>
          </NextCard>

          {/* Explore or Enter Group */}
          {groupName ? (
            <NextCard
              icon={<IconLayoutDashboard size={22} />}
              title={`Enter ${groupName}`}
              desc="Open your group spaces: chat, forum, docs, and events."
            >
              <Link
                as={NextLink}
                href="/member"
                _hover={{ textDecoration: "none" }}
              >
                <Button
                  size="lg"
                  borderRadius="xl"
                  bg="theme.accent"
                  color="white"
                >
                  <IconArrowRight size={18} /> Open group
                </Button>
              </Link>
            </NextCard>
          ) : (
            <NextCard
              icon={<IconCompass size={22} />}
              title="Explore Crossroads"
              desc="Browse discussions, gatherings, and groups to join."
            >
              <Link
                as={NextLink}
                href="/about/public"
                _hover={{ textDecoration: "none" }}
              >
                <Button
                  size="lg"
                  borderRadius="xl"
                  bg="theme.accent"
                  color="white"
                >
                  <IconArrowRight size={18} /> Start exploring
                </Button>
              </Link>
            </NextCard>
          )}

          {/* Dashboard */}
          <NextCard
            icon={<IconLayoutDashboard size={22} />}
            title="Go to dashboard"
            desc="Everything in one place: messages, posts, and activity."
          >
            <Link
              as={NextLink}
              href="/member"
              _hover={{ textDecoration: "none" }}
            >
              <Button size="lg" borderRadius="xl" variant="outline">
                <IconArrowRight size={18} /> Open dashboard
              </Button>
            </Link>
          </NextCard>
        </SimpleGrid>

        {/* More info */}
        <Box
          mt={8}
          bg="theme.surface"
          border="1px solid"
          borderColor="theme.border"
          borderRadius="xl"
          p={0}
        >
          <Collapsible.Root
            open={openMore}
            onOpenChange={({ open }: { open: boolean }) => setOpenMore(open)}
          >
            <Collapsible.Trigger asChild>
              <Button
                variant="ghost"
                size="lg"
                w="full"
                justifyContent="space-between"
                borderTopLeftRadius="xl"
                borderTopRightRadius="xl"
                px={5}
              >
                <Heading as="h3" size="sm" color="theme.text">
                  What can I do next?
                </Heading>
                {openMore ? (
                  <IconChevronUp size={18} />
                ) : (
                  <IconChevronDown size={18} />
                )}
              </Button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <VStack
                align="start"
                gap={2}
                px={5}
                pb={5}
                pt={2}
                color="theme.textSecondary"
              >
                <Text>• Start a conversation in Messages</Text>
                <Text>• Join a discussion in Forums</Text>
                <Text>• Check upcoming gatherings</Text>
                <Text>• Add a second location to your profile</Text>
                <Text>• Connect with a group that shares your interests</Text>
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        <HStack mt={6} gap={4} color="theme.textSecondary">
          <Link
            as={NextLink}
            href="/about/how-it-works"
            _hover={{ color: "theme.accent" }}
          >
            How it works
          </Link>
          <Text>•</Text>
          <Link
            as={NextLink}
            href="/about/join"
            _hover={{ color: "theme.accent" }}
          >
            Membership details
          </Link>
        </HStack>
      </Container>
    </Box>
  );
}

function NextCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="theme.surface"
      border="1px solid"
      borderColor="theme.border"
      borderRadius="2xl"
      p={6}
      shadow="md"
    >
      <HStack gap={3} mb={2} color="theme.text">
        {icon}
        <Heading as="h3" size="md">
          {title}
        </Heading>
      </HStack>
      <Text color="theme.textSecondary" mb={5}>
        {desc}
      </Text>
      {children}
    </Box>
  );
}
