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
  Textarea,
  IconButton,
  Dialog,
  Checkbox,
  Collapsible,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconNote,
  IconX,
  IconPlus,
  IconChevronDown,
  IconChevronUp,
  IconHelp,
} from "@tabler/icons-react";
import HowItWorksContent from "@/content/HowItWorksContent";

interface AgreementSection {
  id: string;
  title: string;
  content: string;
}

interface StickyNote {
  id: string;
  sectionId: string;
  text: string;
  createdAt: number;
}

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

const STORAGE_NOTES_KEY = "agreements_sticky_notes";

const isBrowser = typeof window !== "undefined";

const uid = () => Math.random().toString(36).slice(2, 9);

const safeGetItem = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export default function AgreementsPage() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // Extract group name and slug from query string client-side without useSearchParams
  useEffect(() => {
    if (!isBrowser) return;

    try {
      const url = new URL(window.location.href);
      setGroupName(url.searchParams.get("group") || "");
      setGroupSlug(url.searchParams.get("group_slug") || "");
    } catch {
      setGroupName("");
      setGroupSlug("");
    }
  }, []);

  // Load saved notes from localStorage (checkbox always starts unchecked)
  useEffect(() => {
    const rawNotes = safeGetItem(STORAGE_NOTES_KEY);
    if (rawNotes) {
      try {
        const parsed = JSON.parse(rawNotes) as StickyNote[];
        setNotes(parsed);
      } catch {
        // ignore parse errors, start fresh
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (!notes.length) {
      // still persist empty to allow clearing
      safeSetItem(STORAGE_NOTES_KEY, JSON.stringify([]));
      return;
    }
    safeSetItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  const sectionNotes = useMemo(() => {
    const map: Record<string, StickyNote[]> = {};
    for (const sec of AGREEMENTS) {
      map[sec.id] = [];
    }
    for (const n of notes) {
      if (!map[n.sectionId]) {
        map[n.sectionId] = [];
      }
      map[n.sectionId].push(n);
    }
    // Sort notes newest-first per section for a nicer UX
    for (const key of Object.keys(map)) {
      map[key] = map[key].slice().sort((a, b) => b.createdAt - a.createdAt);
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

  const removeNote = (id: string) =>
    setNotes((prev) => prev.filter((n) => n.id !== id));

  const handleContinue = () => {
    if (groupSlug) {
      window.location.href = `/app/groups/${groupSlug}`;
    } else {
      router.push("/member");
    }
  };

  return (
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
            Step 2 of 3
          </Text>
          <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
            Community Agreements
          </Heading>
          <Text color="theme.textSecondary">
            {groupName
              ? `You're joining ${groupName}. Please read and accept the shared agreements.`
              : "Please read and accept the shared agreements that keep Crossroads welcoming."}
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

                      <HStack mt={4} justify="space-between">
                        <HStack gap={3} color="theme.textSecondary">
                          <IconNote size={16} />
                          <Text fontSize="sm">Leave a note or question</Text>
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

                      {sectionNotes[sec.id]?.length ? (
                        <VStack align="stretch" mt={3} gap={2}>
                          {sectionNotes[sec.id].map((n) => (
                            <Box
                              key={n.id}
                              bg="theme.border"
                              borderRadius="md"
                              p={3}
                            >
                              <HStack justify="space-between" align="start">
                                <Text color="theme.text" whiteSpace="pre-wrap">
                                  {n.text}
                                </Text>
                                <IconButton
                                  aria-label="Remove note"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => removeNote(n.id)}
                                >
                                  <IconX size={16} />
                                </IconButton>
                              </HStack>
                              <Text
                                mt={1}
                                fontSize="xs"
                                color="theme.textSecondary"
                              >
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

        <HStack mt={6} gap={4} color="theme.textSecondary">
          <Button
            variant="ghost"
            size="sm"
            px={0}
            color="theme.textSecondary"
            _hover={{ color: "theme.accent", bg: "transparent" }}
            onClick={() => setHowItWorksOpen(true)}
          >
            <IconHelp size={16} />
            Why these agreements?
          </Button>
        </HStack>
      </Container>

      {/* How It Works Dialog */}
      <Dialog.Root open={howItWorksOpen} onOpenChange={({ open }: { open: boolean }) => setHowItWorksOpen(open)}>
        <Dialog.Content
          maxW="2xl"
          bg="theme.surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="theme.border"
          p={0}
          maxH="80vh"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Dialog.Header px={6} py={4} borderBottom="1px solid" borderColor="theme.border" flexShrink={0}>
            <Dialog.Title fontSize="lg" fontWeight="700">How Crossroads Works</Dialog.Title>
            <Dialog.CloseTrigger>
              <IconButton aria-label="Close" variant="ghost" size="sm">
                <IconX size={16} />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body px={6} py={5} overflowY="auto">
            <HowItWorksContent />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Root>

      {/* Note Dialog */}
      <Dialog.Root open={noteOpen} onOpenChange={({ open }: { open: boolean }) => setNoteOpen(open)}>
        <Dialog.Content
          maxW="lg"
          bg="theme.surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="theme.border"
          p={0}
        >
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
              Your note will be reviewed by staff. Please be concise and
              constructive.
            </Text>
            <Textarea
              rows={5}
              value={draftNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraftNote(e.target.value)}
              placeholder="Share your thoughts or questions..."
              bg="theme.surface"
              borderColor="theme.border"
              _focus={{ borderColor: "theme.accent", boxShadow: "none" }}
            />
          </Dialog.Body>

          <Dialog.Footer px={6} py={4}>
            <HStack justify="flex-end" w="full">
              <Button variant="ghost" onClick={() => setNoteOpen(false)}>
                Cancel
              </Button>
              <Button
                bg="theme.accent"
                color="white"
                onClick={saveNote}
                disabled={!draftNote.trim()}
              >
                Save note
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
