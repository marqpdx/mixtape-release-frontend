"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface GroupContextData {
  founding_story: string;
  non_negotiables: string[];
  voice_description: string;
  outward_feel: string;
  context_health_score: number;
  updated_at: string | null;
  dispatch_policy: 'cloud_default' | 'local_preferred' | 'local_only' | 'local_strict';
  local_model_tier: 'standard' | 'high';
  local_verb_overrides: string[];
}

const EMPTY: GroupContextData = {
  founding_story: "",
  non_negotiables: [],
  voice_description: "",
  outward_feel: "",
  context_health_score: 0,
  updated_at: null,
  dispatch_policy: 'cloud_default',
  local_model_tier: 'standard',
  local_verb_overrides: [],
};

const FIELDS: { key: keyof Pick<GroupContextData, "founding_story" | "voice_description" | "outward_feel">; label: string; hint: string }[] = [
  {
    key: "founding_story",
    label: "Founding Story",
    hint: "Describe why this group exists, how it started, and what it's building toward. Write in plain language — this becomes a direct instruction for AI tools that help facilitate the group.",
  },
  {
    key: "voice_description",
    label: "Voice & Tone",
    hint: "How does this group communicate? Describe the register, warmth, and style you want AI to reflect when writing on behalf of this community.",
  },
  {
    key: "outward_feel",
    label: "Outward Feel",
    hint: "What impression should someone get when they first encounter this group? Describe the atmosphere or energy you're cultivating.",
  },
];

interface Props {
  slug: string;
}

export function GroupContextEditor({ slug }: Props) {
  const [data, setData] = useState<GroupContextData>(EMPTY);
  const [draft, setDraft] = useState<GroupContextData>(EMPTY);
  const [nonNegDraft, setNonNegDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/groups/${slug}/context`);
      setData(res.data);
      setDraft(res.data);
      setNonNegDraft((res.data.non_negotiables as string[]).join("\n"));
      setError(null);
    } catch {
      setError("Could not load group context. You may not have permission.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const non_negotiables = nonNegDraft
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await axiosInstance.patch(`/api/groups/${slug}/context`, {
        ...draft,
        non_negotiables,
      });
      setData(res.data);
      setDraft(res.data);
      setNonNegDraft((res.data.non_negotiables as string[]).join("\n"));
      setMessage("Context saved.");
    } catch {
      setMessage("Failed to save. You may not have permission.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty =
    draft.founding_story !== data.founding_story ||
    draft.voice_description !== data.voice_description ||
    draft.outward_feel !== data.outward_feel ||
    nonNegDraft !== (data.non_negotiables as string[]).join("\n");

  if (loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxW="3xl" mx="auto" px="6" py="10">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="3xl" mx="auto" px="6" py="10">
      <Heading size="lg" mb="2">
        Group Context
      </Heading>
      <Text fontSize="sm" color={mutedColor} mb="8">
        These fields are used as natural-language instructions for AI tools that
        facilitate this group. Write in plain language — clarity matters more
        than polish.
      </Text>

      <VStack gap="8" align="stretch">
        {FIELDS.map(({ key, label, hint }) => (
          <Box key={key}>
            <Text fontWeight="600" mb="1">
              {label}
            </Text>
            <Text fontSize="sm" color={mutedColor} mb="2">
              {hint}
            </Text>
            <Textarea
              value={draft[key] as string}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              rows={4}
              borderColor={borderColor}
            />
          </Box>
        ))}

        <Box>
          <Text fontWeight="600" mb="1">
            Non-Negotiables
          </Text>
          <Text fontSize="sm" color={mutedColor} mb="2">
            List values or boundaries that must never be violated — one per
            line. AI tools will treat these as hard constraints.
          </Text>
          <Textarea
            value={nonNegDraft}
            onChange={(e) => setNonNegDraft(e.target.value)}
            rows={4}
            borderColor={borderColor}
            placeholder="e.g. No promotional content&#10;Assume positive intent&#10;No unsolicited advice"
          />
        </Box>
      </VStack>

      {message && (
        <Text
          fontSize="sm"
          mt="4"
          color={message.includes("Failed") ? "red.500" : "green.600"}
        >
          {message}
        </Text>
      )}

      <Button
        mt="6"
        size="sm"
        colorScheme="blue"
        onClick={handleSave}
        disabled={saving || !isDirty}
      >
        {saving ? "Saving..." : "Save Context"}
      </Button>
    </Box>
  );
}
