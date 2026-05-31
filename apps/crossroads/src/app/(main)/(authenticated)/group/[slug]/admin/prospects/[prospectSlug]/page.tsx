// apps/crossroads/app/(main)/(member)/group/[slug]/admin/prospects/[prospectSlug]/page.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  createListCollection,
  Heading,
  HStack,
  Input,
  Portal,
  Select,
  Spinner,
  Text,
  Textarea,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import NextLink from "next/link";

interface Prospect {
  id: string; name: string; slug: string; status: string;
  primary_contact_name: string; primary_contact_email: string;
  primary_contact_phone: string; business_type: string; website: string; summary: string;
  converted_to_group_slug: string | null;
}

interface ConvertResult {
  group: string;
  migrated_count: number;
  skipped_count: number;
  detail: string[];
}
interface Session {
  id: string; mode: string; status: string; created_at: string;
  submitted_at: string | null; meeting_date: string | null;
  resume_token: string; intake_url?: string;
}
interface Note {
  id: string; body: string; created_at: string;
}

const STATUS_OPTIONS = [
  "new", "contacted", "intake_started", "meeting_scheduled",
  "proposal_stage", "won", "lost", "archived",
];

function statusColor(s: string) {
  if (s === "submitted" || s === "reviewed") return "green";
  if (s === "in_progress") return "blue";
  return "gray";
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ProspectDetailPage() {
  const params = useParams();
  const groupSlug = params.slug as string;
  const prospectSlug = params.prospectSlug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editStatus, setEditStatus] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [saving, setSaving] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [newIntakeUrl, setNewIntakeUrl] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState("pre_meeting");
  const [deletingProspect, setDeletingProspect] = useState(false);

  const [convertTitle, setConvertTitle] = useState("");
  const [convertGroupType, setConvertGroupType] = useState("community");
  const [convertSlug, setConvertSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<ConvertResult | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [slugCheckState, setSlugCheckState] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const convertedCardBg = useColorModeValue("green.50", "green.900");
  const convertedItemBg = useColorModeValue("white", "gray.800");

  const statusCollection = useMemo(() => createListCollection({
    items: STATUS_OPTIONS.map((s) => ({ label: s.replace(/_/g, " "), value: s })),
  }), []);
  const groupTypeCollection = useMemo(() => createListCollection({
    items: [
      { label: "Community", value: "community" },
      { label: "Circle", value: "circle" },
      { label: "Persona", value: "persona" },
      { label: "Coalition", value: "coalition" },
    ],
  }), []);
  const modeCollection = useMemo(() => createListCollection({
    items: [
      { label: "pre meeting", value: "pre_meeting" },
      { label: "guided live", value: "guided_live" },
      { label: "hybrid", value: "hybrid" },
    ],
  }), []);

  const checkSlugAvailability = useCallback((slug: string) => {
    setSlugCheckState(slug.trim() ? "checking" : "idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!slug.trim()) return;
    debounceRef.current = setTimeout(async () => {
      try {
        await axiosInstance.get(`/api/public/groups/${slug.trim()}/admission-status`);
        // 200 means group exists → slug taken
        setSlugCheckState("taken");
      } catch {
        // 404 means no group with that slug → available
        setSlugCheckState("available");
      }
    }, 400);
  }, []);

  const load = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        axiosInstance.get(`/api/prospects/${prospectSlug}/`),
        axiosInstance.get(`/api/prospects/${prospectSlug}/sessions/`),
      ]);
      setProspect(pRes.data);
      setEditStatus(pRes.data.status);
      setEditSummary(pRes.data.summary || "");
      setSessions(sRes.data);
      // Pre-populate convert title/slug from prospect if not yet converted
      if (!pRes.data.converted_to_group_slug) {
        const name = pRes.data.name ?? "";
        setConvertTitle(name);
        const derived = toSlug(name);
        setConvertSlug(derived);
        checkSlugAvailability(derived);
      }
    } catch {
      setError("Could not load prospect.");
    } finally {
      setLoading(false);
    }
  }, [prospectSlug, checkSlugAvailability]);

  const handleConvertTitleChange = useCallback((value: string) => {
    setConvertTitle(value);
    if (!slugEdited) {
      const derived = toSlug(value);
      setConvertSlug(derived);
      checkSlugAvailability(derived);
    }
  }, [slugEdited, checkSlugAvailability]);

  const handleConvertSlugChange = useCallback((value: string) => {
    setConvertSlug(value);
    setSlugEdited(true);
    checkSlugAvailability(value);
  }, [checkSlugAvailability]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, load]);

  async function handleSave() {
    if (!prospect) return;
    setSaving(true);
    try {
      const res = await axiosInstance.patch(`/api/prospects/${prospectSlug}/`, {
        status: editStatus,
        summary: editSummary,
      });
      setProspect(res.data);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProspect() {
    if (!confirm(`Delete ${prospect?.name} and all their sessions?`)) return;
    setDeletingProspect(true);
    try {
      await axiosInstance.delete(`/api/prospects/${prospectSlug}/`);
      window.location.href = `/group/${groupSlug}/admin/prospects`;
    } finally {
      setDeletingProspect(false);
    }
  }

  async function handleCreateSession() {
    setCreatingSession(true);
    setSessionWarning(null);
    setNewIntakeUrl(null);
    try {
      const res = await axiosInstance.post(`/api/prospects/${prospectSlug}/sessions/`, {
        mode: sessionMode,
      });
      setSessions((s) => [res.data, ...s]);
      setNewIntakeUrl(res.data.intake_url);
      if (res.data.warning) setSessionWarning(res.data.warning);
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await axiosInstance.post(`/api/prospects/${prospectSlug}/notes/`, { body: newNote.trim() });
      setNotes((n) => [res.data, ...n]);
      setNewNote("");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleConvert() {
    if (!convertTitle.trim() || !convertSlug.trim()) return;
    if (slugCheckState !== "available") return;
    if (!confirm(`Create group "${convertTitle}" (/${convertSlug}) and convert ${prospect?.name} to client? This cannot be undone.`)) return;
    setConverting(true);
    setConvertError(null);
    setConvertResult(null);
    try {
      const res = await axiosInstance.post(`/api/prospects/${prospectSlug}/convert/`, {
        title: convertTitle.trim(),
        group_type: convertGroupType,
        slug: convertSlug.trim(),
      });
      setConvertResult(res.data as ConvertResult);
      // Refresh prospect so header shows converted state
      const updated = await axiosInstance.get(`/api/prospects/${prospectSlug}/`);
      setProspect(updated.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setConvertError(msg ?? "Conversion failed. Try again.");
    } finally {
      setConverting(false);
    }
  }

  if (authLoading || loading) {
    return <Box px="6" py="20" textAlign="center"><Spinner size="lg" /></Box>;
  }
  if (!isAuthenticated || !user?.is_superuser) {
    return <Box px="6" py="20" textAlign="center"><Text>Superuser access required.</Text></Box>;
  }
  if (error || !prospect) {
    return <Box px="6" py="10"><Text color="red.500">{error || "Not found."}</Text></Box>;
  }

  return (
    <Box maxW="3xl" mx="auto" px="6" py="10">
      <HStack mb="6" justify="space-between" align="center">
        <Heading size="lg">{prospect.name}</Heading>
        <HStack>
          <Button size="sm" colorPalette="red" variant="ghost" onClick={handleDeleteProspect} loading={deletingProspect}>
            Delete prospect
          </Button>
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href={`/group/${groupSlug}/admin/prospects`}>← Prospects</NextLink>
          </ChakraLink>
        </HStack>
      </HStack>

      {/* Edit status + summary */}
      <Box p="5" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg} mb="6">
        <Text fontWeight="600" mb="3">Details</Text>
        <VStack gap="2" align="stretch">
          <HStack>
            <Text fontSize="sm" w="100px" color={mutedColor}>Status</Text>
            <Select.Root
              collection={statusCollection}
              size="sm"
              value={[editStatus]}
              onValueChange={({ value }) => setEditStatus(value[0])}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {statusCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}<Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </HStack>
          <HStack align="flex-start">
            <Text fontSize="sm" w="100px" color={mutedColor} pt="2">Notes</Text>
            <Textarea size="sm" rows={3} value={editSummary} onChange={(e) => setEditSummary(e.target.value)} placeholder="Internal summary…" flex="1" />
          </HStack>
          <HStack>
            <Button size="sm" colorPalette="blue" onClick={handleSave} loading={saving}>Save</Button>
          </HStack>
        </VStack>
      </Box>

      {/* Sessions */}
      <Box mb="8">
        <HStack mb="3" justify="space-between" align="center">
          <Text fontWeight="600">Intake sessions</Text>
          <HStack gap="2">
            <Select.Root
              collection={modeCollection}
              size="sm"
              value={[sessionMode]}
              onValueChange={({ value }) => setSessionMode(value[0])}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger minW="140px">
                  <Select.ValueText />
                </Select.Trigger>
                <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {modeCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}<Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
            <Button size="sm" colorPalette="blue" onClick={handleCreateSession} loading={creatingSession}>
              New session
            </Button>
          </HStack>
        </HStack>

        {sessionWarning && (
          <Box p="3" bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="md" mb="3">
            <Text fontSize="sm" color="orange.700">⚠ {sessionWarning}</Text>
          </Box>
        )}
        {newIntakeUrl && (
          <Box p="3" bg="green.50" border="1px solid" borderColor="green.200" borderRadius="md" mb="3">
            <Text fontSize="sm" fontWeight="500" color="green.800" mb="1">Intake link created:</Text>
            <Text fontSize="sm" color="green.700" wordBreak="break-all">{newIntakeUrl}</Text>
            <Button size="xs" mt="2" onClick={() => { navigator.clipboard.writeText(newIntakeUrl); }}>Copy link</Button>
          </Box>
        )}

        {sessions.length === 0 ? (
          <Text fontSize="sm" color={mutedColor}>No sessions yet.</Text>
        ) : (
          <VStack gap="2" align="stretch">
            {sessions.map((s) => (
              <ChakraLink asChild key={s.id} _hover={{ textDecoration: "none" }}>
                <NextLink href={`/group/${groupSlug}/admin/prospects/${prospectSlug}/sessions/${s.id}`}>
                  <Box
                    p="4" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg}
                    _hover={{ borderColor: "blue.300" }} cursor="pointer"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="500">{s.mode.replace(/_/g, " ")}</Text>
                      <Badge colorPalette={statusColor(s.status)} size="sm">{s.status.replace(/_/g, " ")}</Badge>
                    </HStack>
                    <Text fontSize="xs" color={mutedColor}>
                      Created {new Date(s.created_at).toLocaleDateString()}
                      {s.submitted_at ? ` · Submitted ${new Date(s.submitted_at).toLocaleDateString()}` : ""}
                      {s.meeting_date ? ` · Meeting ${s.meeting_date}` : ""}
                    </Text>
                  </Box>
                </NextLink>
              </ChakraLink>
            ))}
          </VStack>
        )}
      </Box>

      {/* EC-D1: Convert to Client */}
      <Box mb="8" p="5" border="1px solid" borderColor={prospect.converted_to_group_slug ? "green.200" : borderColor} borderRadius="md" bg={prospect.converted_to_group_slug ? convertedCardBg : cardBg}>
        <Text fontWeight="600" mb="3">Convert to client</Text>

        {prospect.converted_to_group_slug ? (
          <VStack align="flex-start" gap="2">
            <HStack>
              <Badge colorPalette="green">Converted</Badge>
              <Text fontSize="sm">This prospect is linked to group</Text>
              <ChakraLink asChild fontSize="sm" color="blue.500" fontWeight="600">
                <NextLink href={`/group/${prospect.converted_to_group_slug}`}>{prospect.converted_to_group_slug}</NextLink>
              </ChakraLink>
            </HStack>
            {convertResult && (
              <Box w="full" mt="2">
                <Text fontSize="sm" fontWeight="600" mb="2">
                  Migration result — {convertResult.migrated_count} field{convertResult.migrated_count !== 1 ? "s" : ""} populated
                  {convertResult.skipped_count > 0 ? `, ${convertResult.skipped_count} skipped` : ""}
                </Text>
                {/* EC-D2: GroupContext answers with "from intake" flag */}
                <VStack align="stretch" gap="1">
                  {convertResult.detail.map((line, i) => (
                    <HStack key={i} p="2" bg={convertedItemBg} border="1px solid" borderColor="green.200" borderRadius="sm" gap="3">
                      <Badge colorPalette="orange" size="sm" flexShrink={0}>from intake</Badge>
                      <Text fontSize="xs" color={mutedColor} flex="1">{line}</Text>
                    </HStack>
                  ))}
                </VStack>
                <Text fontSize="xs" color={mutedColor} mt="3">
                  Group admin should review and confirm these answers still hold.
                </Text>
              </Box>
            )}
          </VStack>
        ) : (
          <VStack align="stretch" gap="3">
            <Text fontSize="sm" color={mutedColor}>
              A new group will be created and intake responses mapped into its context, marked as "brought from intake."
            </Text>
            {/* Title */}
            <HStack>
              <Text fontSize="sm" w="80px" color={mutedColor} flexShrink={0}>Name</Text>
              <Input
                size="sm"
                placeholder="Group name"
                value={convertTitle}
                onChange={(e) => handleConvertTitleChange(e.target.value)}
              />
            </HStack>
            {/* Group type */}
            <HStack>
              <Text fontSize="sm" w="80px" color={mutedColor} flexShrink={0}>Type</Text>
              <Select.Root
                collection={groupTypeCollection}
                size="sm"
                value={[convertGroupType]}
                onValueChange={({ value }) => setConvertGroupType(value[0])}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {groupTypeCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}<Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </HStack>
            {/* Slug */}
            <HStack>
              <Text fontSize="sm" w="80px" color={mutedColor} flexShrink={0}>Slug</Text>
              <Input
                size="sm"
                placeholder="group-slug"
                value={convertSlug}
                onChange={(e) => handleConvertSlugChange(e.target.value)}
                borderColor={
                  slugCheckState === "available" ? "green.400" :
                  slugCheckState === "taken" ? "red.400" : undefined
                }
              />
            </HStack>
            {slugCheckState === "checking" && (
              <Text fontSize="xs" color={mutedColor} pl="88px">Checking…</Text>
            )}
            {slugCheckState === "available" && (
              <Text fontSize="xs" color="green.600" pl="88px">✓ Slug available</Text>
            )}
            {slugCheckState === "taken" && (
              <Text fontSize="xs" color="red.500" pl="88px">✗ Slug already taken — choose another.</Text>
            )}
            <HStack justify="flex-end">
              <Button
                size="sm"
                colorPalette="green"
                onClick={handleConvert}
                loading={converting}
                disabled={!convertTitle.trim() || !convertSlug.trim() || slugCheckState !== "available"}
              >
                Create group &amp; convert
              </Button>
            </HStack>
            {convertError && (
              <Text fontSize="sm" color="red.500">{convertError}</Text>
            )}
          </VStack>
        )}
      </Box>

      {/* Notes */}
      <Box>
        <Text fontWeight="600" mb="3">Staff notes</Text>
        <VStack gap="2" align="stretch" mb="3">
          <Textarea size="sm" rows={2} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note…" />
          <HStack>
            <Button size="sm" onClick={handleAddNote} loading={savingNote} disabled={!newNote.trim()}>Add note</Button>
          </HStack>
        </VStack>
        {notes.map((n) => (
          <Box key={n.id} p="3" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg} mb="2">
            <Text fontSize="sm">{n.body}</Text>
            <Text fontSize="xs" color={mutedColor}>{new Date(n.created_at).toLocaleDateString()}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
