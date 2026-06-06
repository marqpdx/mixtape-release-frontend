// apps/mixtape/app/welcome/agreements/page.tsx

"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  Textarea,
  VStack,
  Checkbox,
  Collapsible,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WhyAgreementsModal } from "@/components/welcome/WhyAgreementsModal";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import {
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

interface AgreementSection {
  id: string;
  title: string;
  content: string;
}

const AGREEMENTS: AgreementSection[] = [
  {
    id: "respect",
    title: "Respect & Care",
    content:
      "We believe every person matters, as do all beings, including this dear Earth we are blessed to call home.",
  },
  {
    id: "consent",
    title: "Consent & Privacy",
    content:
      "We honor personal boundaries. Ask before DM'ing sensitive topics. Do not share private posts outside their context. Please use and build common sense.",
  },
  {
    id: "place",
    title: "Place & Belonging",
    content:
      "We recognize recognize place as more than coordinates, and value the responsibility needed to keep our shared spaces safe and healthy. Local context, culture, and care for land and the living matter deeply.",
  },
];

export default function AgreementsPage() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [sendNoteOpen, setSendNoteOpen] = useState(false);
  const [sendNoteText, setSendNoteText] = useState("");
  const [sendNoteSubmitting, setSendNoteSubmitting] = useState(false);
  const [sendNoteSubmitted, setSendNoteSubmitted] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AGREEMENTS.map((s) => [s.id, true]))
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      setGroupName(url.searchParams.get("group") || "");
      setGroupSlug(url.searchParams.get("group_slug") || "");
    } catch {
      setGroupName("");
    }
  }, []);

  const handleSendNote = async () => {
    if (!sendNoteText.trim()) return;
    setSendNoteSubmitting(true);
    try {
      await axiosInstance.post("/api/feedback/items", {
        beacon_key: "agreements_feedback",
        kind: "idea",
        message: sendNoteText.trim(),
        page_url: typeof window !== "undefined" ? window.location.pathname : "/welcome/agreements",
      });
    } catch {
      // quiet fail
    } finally {
      setSendNoteSubmitting(false);
      setSendNoteSubmitted(true);
    }
  };

  const closeSendNote = () => {
    setSendNoteOpen(false);
    setSendNoteText("");
    setSendNoteSubmitted(false);
  };

  const handleContinue = () => {
    if (groupSlug) {
      router.push(`/groups/${groupSlug}?new_member=1&layout=a&view=member`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
    <Box minH="100vh" bg="theme.bg" py={{ base: 10, md: 16 }} px={{ base: 6, md: 8 }}>
      <Container maxW="3xl" px={0}>
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
            Welcome
          </Heading>

          <Text color="theme.textSecondary">
            {groupName
              ? `You're joining ${groupName}, which is part of the greater Crossroads. Crossroads is an intentional place, and we believe in respect, truth, and mutual flourishing.`
              : "Please read and accept the shared agreements that keep Crossroads welcoming. Thank you."}
          </Text>

          <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
            Community Agreements
          </Heading>

          <Text color="theme.textSecondary">
            Please read the short tenets below, and if you agree, come on in.
          </Text>

        </VStack>

        <VStack align="stretch" gap={4}>
          {AGREEMENTS.map((sec) => {
            const isOpen = !!openMap[sec.id];

            return (
              <Box
                key={sec.id}
                bg="theme.surface"
                border="1px solid"
                borderColor="theme.border"
                borderRadius="xl"
                p={0}
              >
                <Collapsible.Root
                  open={isOpen}
                  onOpenChange={({ open }: { open: boolean }) =>
                    setOpenMap((m) => ({ ...m, [sec.id]: open }))
                  }
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
                      <Heading as="h3" size="md" color="theme.text" fontWeight="700">
                        {sec.title}
                      </Heading>
                      {isOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </Button>
                  </Collapsible.Trigger>

                  <Collapsible.Content>
                    <Box px={5} pb={4} pt={2}>
                      <Text color="theme.text" lineHeight="1.8">
                        {sec.content}
                      </Text>
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            );
          })}
        </VStack>

        <HStack mt={8} justify="space-between" align="center">
          <Checkbox.Root
            checked={agreeChecked}
            onCheckedChange={({ checked }: { checked: boolean | string }) => setAgreeChecked(!!checked)}
          >
            <Checkbox.HiddenInput />
            <HStack gap={3}>
              <Checkbox.Control borderRadius="md">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                I have read and agree to the Community Agreements
              </Checkbox.Label>
            </HStack>
          </Checkbox.Root>

          <Button
            bg="theme.accent"
            color="white"
            borderRadius="xl"
            px={6}
            py={5}
            size="lg"
            onClick={handleContinue}
            disabled={!agreeChecked}
            _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
          >
            Continue
          </Button>
        </HStack>

        <HStack mt={6} gap={6} color="theme.textSecondary" flexWrap="wrap">
          <Button
            variant="ghost"
            size="sm"
            color="theme.textSecondary"
            px={0}
            _hover={{ color: "theme.accent", bg: "transparent" }}
            onClick={() => setWhyModalOpen(true)}
          >
            Why these agreements?
          </Button>
          <Button
            variant="ghost"
            size="sm"
            color="theme.textSecondary"
            px={0}
            _hover={{ color: "theme.accent", bg: "transparent" }}
            onClick={() => setSendNoteOpen(true)}
          >
            Send us a note or question about any of this
          </Button>
        </HStack>
      </Container>

      <WhyAgreementsModal open={whyModalOpen} onClose={() => setWhyModalOpen(false)} />

      <DialogRoot open={sendNoteOpen} onOpenChange={({ open }) => { if (!open) closeSendNote(); }}>
        <DialogContent
          maxW="lg"
          bg="theme.surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="theme.border"
          p={0}
        >
          <DialogHeader px={6} pt={5} pb={3}>
            <DialogTitle>Send us a note</DialogTitle>
            <DialogCloseTrigger onClick={closeSendNote} />
          </DialogHeader>

          <DialogBody px={6} pb={2}>
            {sendNoteSubmitted ? (
              <Text color="theme.textSecondary" lineHeight="1.8" py={2}>
                Thanks — we&apos;ll read it. Feel free to close this and continue.
              </Text>
            ) : (
              <>
                <Text mb={3} color="theme.textSecondary" fontSize="sm">
                  Questions, reactions, or anything you&apos;d like us to know about the Community Agreements — we read these.
                </Text>
                <Textarea
                  rows={5}
                  value={sendNoteText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSendNoteText(e.target.value)}
                  placeholder="Share your thoughts or questions..."
                  bg="theme.surface"
                  borderColor="theme.border"
                  _focus={{ borderColor: "theme.accent", boxShadow: "none" }}
                />
              </>
            )}
          </DialogBody>

          <DialogFooter px={6} py={4}>
            <HStack justify="flex-end" w="full">
              <Button variant="ghost" onClick={closeSendNote}>
                {sendNoteSubmitted ? "Close" : "Cancel"}
              </Button>
              {!sendNoteSubmitted && (
                <Button
                  bg="theme.accent"
                  color="white"
                  onClick={handleSendNote}
                  loading={sendNoteSubmitting}
                  disabled={!sendNoteText.trim()}
                >
                  Send
                </Button>
              )}
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
    </motion.div>
  );
}
