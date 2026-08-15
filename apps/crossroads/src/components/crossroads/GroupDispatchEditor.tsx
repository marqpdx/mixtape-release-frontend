"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

const DISPATCH_OPTIONS = [
  {
    value: "cloud_default",
    label: "Cloud-assisted (default)",
    description: "Standard cloud routing. No approval required.",
    superadminOnly: false,
  },
  {
    value: "local_preferred",
    label: "Local-first",
    description: "Local by default. Cloud requires per-operation user consent.",
    superadminOnly: false,
  },
  {
    value: "local_only",
    label: "Local only",
    description: "Cloud blocked. Admins may allow specific operations behind a consent gate.",
    superadminOnly: false,
  },
  {
    value: "local_strict",
    label: "Strict local (no cloud, ever)",
    description: "Regulated mode. Cloud path blocked unconditionally. Superadmin only.",
    superadminOnly: true,
  },
];

const MODEL_TIER_OPTIONS = [
  {
    value: "standard",
    label: "Standard (Mistral 7B)",
    description: "Suitable for drafts, summaries, and lightweight content.",
  },
  {
    value: "high",
    label: "High (Llama 3 70B)",
    description: "For legal briefs, clinical documentation, and synthesis over large corpora.",
  },
];

// Cloud-eligible verbs that can appear on the local_only override list
const OVERRIDE_VERBS = [
  { id: "draft", label: "Draft" },
  { id: "refine", label: "Refine" },
  { id: "synthesize", label: "Synthesize" },
  { id: "synopsis_linkedin", label: "LinkedIn Synopsis" },
];

interface DispatchState {
  dispatch_policy: string;
  local_model_tier: string;
  local_verb_overrides: string[];
}

interface Props {
  slug: string;
}

export function GroupDispatchEditor({ slug }: Props) {
  const { user } = useAuth();
  const isSuperuser = !!user?.is_superuser;

  const [current, setCurrent] = useState<DispatchState | null>(null);
  const [draft, setDraft] = useState<DispatchState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const selectedBorder = useColorModeValue("blue.300", "blue.600");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/groups/${slug}/context`);
      const state: DispatchState = {
        dispatch_policy: res.data.dispatch_policy ?? "cloud_default",
        local_model_tier: res.data.local_model_tier ?? "standard",
        local_verb_overrides: res.data.local_verb_overrides ?? [],
      };
      setCurrent(state);
      setDraft(state);
      setError(null);
    } catch {
      setError("Could not load dispatch settings.");
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    const overrides =
      draft.dispatch_policy === "local_only" ? draft.local_verb_overrides : [];
    try {
      await axiosInstance.patch(`/api/groups/${slug}`, {
        dispatch_policy: draft.dispatch_policy,
        local_model_tier: draft.local_model_tier,
        local_verb_overrides: overrides,
      });
      const saved = { ...draft, local_verb_overrides: overrides };
      setCurrent(saved);
      setDraft(saved);
      setMessage("Dispatch settings saved.");
    } catch {
      setMessage("Failed to save. You may not have permission.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <Text color="red.500" fontSize="sm" mt="10">
        {error}
      </Text>
    );
  }

  if (!draft || !current) return null;

  const isDirty =
    draft.dispatch_policy !== current.dispatch_policy ||
    draft.local_model_tier !== current.local_model_tier ||
    JSON.stringify([...draft.local_verb_overrides].sort()) !==
      JSON.stringify([...current.local_verb_overrides].sort());

  const visibleOptions = DISPATCH_OPTIONS.filter(
    (opt) => !opt.superadminOnly || isSuperuser
  );

  return (
    <Box mt="10">
      <Text fontWeight="600" mb="1">
        AI Dispatch Policy
      </Text>
      <Text fontSize="sm" color={mutedColor} mb="4">
        Controls how AI operations in this group route between local and cloud
        models.
      </Text>

      <VStack gap="2" align="stretch" mb="6">
        {visibleOptions.map((opt) => (
          <Box
            key={opt.value}
            p="3"
            borderRadius="md"
            border="1px solid"
            borderColor={
              draft.dispatch_policy === opt.value ? selectedBorder : borderColor
            }
            bg={draft.dispatch_policy === opt.value ? selectedBg : cardBg}
            cursor="pointer"
            onClick={() => setDraft({ ...draft, dispatch_policy: opt.value })}
            transition="all 0.15s"
          >
            <Text fontWeight="500" fontSize="sm">
              {opt.label}
            </Text>
            <Text fontSize="xs" color={mutedColor}>
              {opt.description}
            </Text>
          </Box>
        ))}
      </VStack>

      {draft.dispatch_policy !== "local_strict" && (
        <>
          <Text fontWeight="600" mb="1">
            Local Model Tier
          </Text>
          <Text fontSize="sm" color={mutedColor} mb="4">
            Model tier used when routing to the local inference stack.
          </Text>
          <VStack gap="2" align="stretch" mb="6">
            {MODEL_TIER_OPTIONS.map((opt) => (
              <Box
                key={opt.value}
                p="3"
                borderRadius="md"
                border="1px solid"
                borderColor={
                  draft.local_model_tier === opt.value
                    ? selectedBorder
                    : borderColor
                }
                bg={
                  draft.local_model_tier === opt.value ? selectedBg : cardBg
                }
                cursor="pointer"
                onClick={() =>
                  setDraft({ ...draft, local_model_tier: opt.value })
                }
                transition="all 0.15s"
              >
                <Text fontWeight="500" fontSize="sm">
                  {opt.label}
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  {opt.description}
                </Text>
              </Box>
            ))}
          </VStack>
        </>
      )}

      {draft.dispatch_policy === "local_only" && (
        <>
          <Text fontWeight="600" mb="1">
            Cloud Override Exceptions
          </Text>
          <Text fontSize="sm" color={mutedColor} mb="3">
            Checked operations surface a consent gate instead of being blocked.
          </Text>
          <VStack gap="2" align="stretch" mb="6">
            {OVERRIDE_VERBS.map((verb) => (
              <Checkbox.Root
                key={verb.id}
                checked={draft.local_verb_overrides.includes(verb.id)}
                onCheckedChange={({ checked }: { checked: boolean | string }) => {
                  if (checked) {
                    setDraft({
                      ...draft,
                      local_verb_overrides: [
                        ...draft.local_verb_overrides,
                        verb.id,
                      ],
                    });
                  } else {
                    setDraft({
                      ...draft,
                      local_verb_overrides: draft.local_verb_overrides.filter(
                        (v) => v !== verb.id
                      ),
                    });
                  }
                }}
              >
                <Checkbox.HiddenInput />
                <HStack gap="3">
                  <Checkbox.Control borderRadius="md">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Text fontSize="sm">{verb.label}</Text>
                  </Checkbox.Label>
                </HStack>
              </Checkbox.Root>
            ))}
          </VStack>
        </>
      )}

      {message && (
        <Text
          fontSize="sm"
          mb="3"
          color={message.includes("Failed") ? "red.500" : "green.600"}
        >
          {message}
        </Text>
      )}

      <Button
        size="sm"
        colorScheme="blue"
        onClick={handleSave}
        disabled={saving || !isDirty}
      >
        {saving ? "Saving..." : "Save Dispatch Settings"}
      </Button>
    </Box>
  );
}
