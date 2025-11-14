// app/welcome/agreements/page.tsx

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
  Textarea,
  IconButton,
  Dialog,
  Checkbox,
  Collapsible,
  Kbd,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconNote,
  IconX,
  IconPlus,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import NextLink from "next/link";

// --- Types ---
interface AgreementSection {
  id: string;
  title: string;
  content: string;
}

interface StickyNote {
  id: string; // uuid-ish
  sectionId: string;
  text: string;
  createdAt: number;
}

// --- Mock content (replace with your live agreements copy) ---
const AGREEMENTS: AgreementSection[] = [
  {
    id: "respect",
    title: "Respect & Care",
    content:
      "We speak to people, not about them. We assume good intent and repair harm when it occurs.",
  },
  {
    id: "consent",
    title: "Consent & Privacy",
    content:
      "We honor personal boundaries. Ask before DM'ing sensitive topics. Do not share private posts outside their context.",
  },
  {
    id: "place",
    title: "Place & Belonging",
    content:
      "We recognize place as more than coordinates. Local context, culture, and care for land and people come first.",
  },
];

// Helper
const uid = () => Math.random().toString(36).slice(2, 9);

export default function AgreementsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const groupName = params?.get("group") || ""; // if coming via group invite

  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [agreeChecked, setAgreeChecked] = useState(false);

  // Dialog state
  const [noteOpen, setNoteOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  // Collapsible state map (keep it simple)
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // Load/save local notes & acceptance
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("agreements_sticky_notes");
      const saved = raw ? (JSON.parse(raw) as StickyNote[]) : [];
      setNotes(saved);
      const accept = window.localStorage.getItem("agreements_accepted");
      setAgreeChecked(accept === "true");
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("agreements_sticky_notes", JSON.stringify(notes));
    } catch (_) {}
  }, [notes]);

  const sectionNotes = useMemo(() => {
    const map: Record<string, StickyNote[]> = {};
    for (const sec of AGREEMENTS) map[sec.id] = [];
    for (const n of notes) {
      if (!map[n.sectionId]) map[n.sectionId] = [];
      map[n.sectionId].push(n);
    }
    return map;
  }, [notes]);

  const openNoteDialog = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setDraftNote("");
    setNoteOpen(true);
  };

  const saveNote = () => {
    if (!activeSectionId || !draftNote.trim()) return;
    const newNote: StickyNote = {
      id: uid(),
      sectionId: activeSectionId,
      text: draftNote.trim(),
      createdAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteOpen(false);
  };

  const removeNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const onAgree = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("agreements_accepted", agreeChecked ? "true" : "false");
      } catch (_) {}
    }
    // Route to dashboard (member) — adjust to your canonical path
    router.push("/member");
  };

  return (
    <Box minH="100vh" bg="theme.bg" py={{ base: 10, md: 16 }} px={{ base: 6, md: 8 }}>
      <Container maxW="3xl" px={0}>
        {/* Header */}
        <VStack align="start" gap={2} mb={6}>
          <Text
            fontSize="sm"
            color="theme.textSecondary"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Step 2 of 3
          </Text>

          <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
            Community Agreements
          </Heading>

          <Text color="theme.textSecondary">
            {groupName
              ? `You're joining ${groupName}. Before you step in, please read and accept the shared agreements that keep Crossroads welcoming and respectful.`
              : "Before you step in, please read and accept the shared agreements that keep Crossroads welcoming and respectful."}
          </Text>
        </VStack>

        {/* Agreements list */}
        <VStack align="stretch" gap={4}>
          {AGREEMENTS.map((sec) => {
            const isOpen = !!openMap[sec.id];
            return (
              <Box key={sec.id} bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="xl" p={0}>
                <Collapsible.Root open={isOpen} onOpenChange={({ open }) => setOpenMap((m) => ({ ...m, [sec.id]: open }))}>
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
                      <HStack gap={3}>
                        <Heading as="h3" size="md" color="theme.text" fontWeight="700">
                          {sec.title}
                        </Heading>
                      </HStack>
                      {isOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </Button>
                  </Collapsible.Trigger>

                  <Collapsible.Content>
                    <Box px={5} pb={4} pt={2}>
                      <Text color="theme.text" lineHeight="1.8">{sec.content}</Text>

                      {/* Notes toolbar */}
                      <HStack mt={4} justify="space-between">
                        <HStack gap={3} color="theme.textSecondary">
                          <IconNote size={16} />
                          <Text fontSize="sm">Leave a note or question for the team</Text>
                        </HStack>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNoteDialog(sec.id)}
                        >
                          <IconPlus size={16} />
                          Add note
                        </Button>
                      </HStack>

                      {/* Existing notes */}
                      {sectionNotes[sec.id]?.length ? (
                        <VStack align="stretch" mt={3} gap={2}>
                          {sectionNotes[sec.id].map((n) => (
                            <Box key={n.id} bg="theme.border" borderRadius="md" p={3}>
                              <HStack justify="space-between" align="start">
                                <Text color="theme.text" whiteSpace="pre-wrap">{n.text}</Text>
                                <IconButton
                                  aria-label="Remove note"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => removeNote(n.id)}
                                >
                                  <IconX size={16} />
                                </IconButton>
                              </HStack>
                              <Text mt={1} fontSize="xs" color="theme.textSecondary">
                                {new Date(n.createdAt).toLocaleString()}
                              </Text>
                            </Box>
                          ))}
                        </VStack>
                      ) : null}
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            );
          })}
        </VStack>

        {/* Agreement checkbox + Continue */}
        <HStack mt={8} justify="space-between" align="center">
          <HStack>
            <Checkbox.Root
              checked={agreeChecked}
              onCheckedChange={({ checked }) => setAgreeChecked(!!checked)}
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
          </HStack>
          <Button
            bg="theme.accent"
            color="white"
            borderRadius="xl"
            px={6}
            py={5}
            size="lg"
            onClick={() => router.push("/welcome/finish" + (groupName ? `?group=${encodeURIComponent(groupName)}` : ""))}
            disabled={!agreeChecked}
            _hover={{ transform: "translateY(-2px)", shadow: "lg" }}

          >
            Continue
          </Button>
        </HStack>

        {/* Footer links */}
        <HStack mt={6} gap={4} color="theme.textSecondary">
          <Link as={NextLink} href="/about/how-it-works" _hover={{ color: "theme.accent" }}>
            Why these agreements?
          </Link>
          <Text>•</Text>
          <Link as={NextLink} href="/about/public" _hover={{ color: "theme.accent" }}>
            Read more from the community
          </Link>
        </HStack>
      </Container>

      {/* Sticky-note Dialog */}
      <Dialog.Root open={noteOpen} onOpenChange={(e) => setNoteOpen(!!e.open)}>
        <Dialog.Content maxW="lg" bg="theme.surface" borderRadius="xl" border="1px solid" borderColor="theme.border" p={0}>
          <Dialog.Header px={6} py={4}>
            <Dialog.Title>Add a note</Dialog.Title>
            <Dialog.CloseTrigger>
              <IconButton aria-label="Close" variant="ghost" size="sm">
                <IconX size={16} />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body px={6} pb={2}>
            <Text mb={2} color="theme.textSecondary" fontSize="sm">
              Your note will be reviewed by staff. Please be concise and constructive.
            </Text>
            <Textarea
              rows={5}
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Share your thoughts or questions about this section..."
              bg="theme.surface"
              borderColor="theme.border"
              _focus={{ borderColor: "theme.accent", boxShadow: "none" }}
            />
          </Dialog.Body>

          <Dialog.Footer px={6} py={4}>
            <HStack justify="flex-end" w="full">
              <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
              <Button bg="theme.accent" color="white" onClick={saveNote} disabled={!draftNote.trim()}>
                Save note
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
