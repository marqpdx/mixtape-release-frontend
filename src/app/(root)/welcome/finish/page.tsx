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
  IconButton,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  IconArrowRight,
  IconUserCircle,
  IconLayoutDashboard,
  IconCompass,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { InfoAlert } from "@components/ui/alerts/InfoAlert";

// Minimal shape persisted in Step 2 (if you kept that localStorage helper)
type MinimalProfile = {
  firstInitial?: string;
  lastName?: string;
  locale?: string;
};

export default function WelcomeFinishPage() {
  const router = useRouter();
  const params = useSearchParams();
  const groupName = params?.get("group") || ""; // present if coming from group invite flow

  const [profile, setProfile] = useState<MinimalProfile | null>(null);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [openMore, setOpenMore] = useState(false);

  // Load onboarding crumbs from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawProfile = window.localStorage.getItem("onboarding_minimal_profile");
      setProfile(rawProfile ? (JSON.parse(rawProfile) as MinimalProfile) : null);
      const ok = window.localStorage.getItem("agreements_accepted");
      setAccepted(ok === "true");
    } catch (_) {
      setProfile(null);
      setAccepted(null);
    }
  }, []);

  // If they somehow skipped agreements, nudge them back
  useEffect(() => {
    if (accepted === false) {
      router.replace("/welcome/agreements" + (groupName ? `?group=${encodeURIComponent(groupName)}` : ""));
    }
  }, [accepted, groupName, router]);

  const greetingName = profile?.lastName ? `${profile.firstInitial ?? ""}. ${profile.lastName}` : undefined;

  return (
    <Box minH="100vh" bg="theme.bg" py={{ base: 10, md: 16 }} px={{ base: 6, md: 8 }}>
      <Container maxW="4xl" px={0}>
        {/* Step header */}
        <VStack align="start" gap={2} mb={6}>
          <Text fontSize="sm" color="theme.textSecondary" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
            Step 3 of 3
          </Text>
          <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
            {groupName ? `You're in — welcome to ${groupName}` : "You're in — welcome to Crossroads"}
          </Heading>
          <Text color="theme.textSecondary">
            {greetingName ? `Hi ${greetingName}.` : "Hi there."} Choose where you’d like to start.
          </Text>
        </VStack>

        {/* (Optional) Trial/payment banner — remove if you don’t want card-up-front */}
        {/* <Alert status="info" >
          <HStack align="start" gap={4}>
            <Box mt={1}>💡</Box>
            <Box>
              <AlertTitle color="theme.text">30-day free trial</AlertTitle>
              <AlertDescription color="theme.textSecondary">
                You can add a payment method anytime in Settings. We’ll remind you before your trial ends.
              </AlertDescription>
            </Box>
          </HStack>
        </Alert>

        <InfoAlert description="You can add a payment method anytime in Settings. We’ll remind you before your trial ends."
          bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="xl" mb={6}
        > */}

        {/* </InfoAlert> */}

        {/* Primary next steps */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {/* Edit profile */}
          <NextCard
            icon={<IconUserCircle size={24} />}
            title="Edit your profile"
            desc="Add a photo, skills, and a short bio."
          >
            <Link as={NextLink} href="/member" _hover={{ textDecoration: "none" }}>
              <Button size="lg" borderRadius="xl" variant="outline">{<IconArrowRight size={18} />} Go to profile</Button>
            </Link>
          </NextCard>

          {/* Explore Crossroads or Enter Group */}
          {groupName ? (
            <NextCard
              icon={<IconLayoutDashboard size={22} />}
              title={`Enter ${groupName}`}
              desc="Open your group spaces: chat, forum, docs, and events."
            >
              <Link as={NextLink} href="/member" _hover={{ textDecoration: "none" }}>
                <Button size="lg" borderRadius="xl" bg="theme.accent" color="white">{<IconArrowRight size={18} />} Open group</Button>
              </Link>
            </NextCard>
          ) : (
            <NextCard
              icon={<IconCompass size={22} />}
              title="Explore Crossroads"
              desc="Browse discussions, gatherings, and groups to join."
            >
              <Link as={NextLink} href="/about/public" _hover={{ textDecoration: "none" }}>
                <Button size="lg" borderRadius="xl" bg="theme.accent" color="white">{<IconArrowRight size={18} />} Start exploring</Button>
              </Link>
            </NextCard>
          )}

          {/* Dashboard */}
          <NextCard
            icon={<IconLayoutDashboard size={22} />}
            title="Go to your dashboard"
            desc="Everything in one place: messages, posts, and activity."
          >
            <Link as={NextLink} href="/member" _hover={{ textDecoration: "none" }}>
              <Button size="lg" borderRadius="xl" variant="outline">{<IconArrowRight size={18} />} Open dashboard</Button>
            </Link>
          </NextCard>
        </SimpleGrid>

        {/* More info (collapsible) */}
        <Box mt={8} bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="xl" p={0}>
          <Collapsible.Root open={openMore} onOpenChange={({ open }) => setOpenMore(open)}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" size="lg" w="full" justifyContent="space-between" borderTopLeftRadius="xl" borderTopRightRadius="xl" px={5}>
                <HStack gap={3}><Heading as="h3" size="sm" color="theme.text">What can I do next?</Heading></HStack>
                {openMore ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              </Button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <VStack align="start" gap={2} px={5} pb={5} pt={2} color="theme.textSecondary">
                <Text>• Start a conversation in Messages (Livewire)</Text>
                <Text>• Join a discussion in Threadworks</Text>
                <Text>• Check upcoming gatherings in EarthLab</Text>
                <Text>• Add a second location to your profile (Tapestry)</Text>
                <Text>• Connect with a group that shares your interests</Text>
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        {/* Footer nav */}
        <HStack mt={6} gap={4} color="theme.textSecondary">
          <Link as={NextLink} href="/about/how-it-works" _hover={{ color: "theme.accent" }}>How it works</Link>
          <Text>•</Text>
          <Link as={NextLink} href="/about/join" _hover={{ color: "theme.accent" }}>Membership details</Link>
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
    <Box bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="2xl" p={6} shadow="md">
      <HStack gap={3} mb={2} color="theme.text">
        {icon}
        <Heading as="h3" size="md">{title}</Heading>
      </HStack>
      <Text color="theme.textSecondary" mb={5}>{desc}</Text>
      {children}
    </Box>
  );
}
