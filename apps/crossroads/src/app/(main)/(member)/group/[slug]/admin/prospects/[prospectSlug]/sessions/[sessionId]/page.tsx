"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

interface Response {
  id: string; question_id: string; question_prompt_snapshot: string;
  kind: string; response_text: string; processing_status: string;
  human_refined_text: string | null;
}
interface Session {
  id: string; mode: string; status: string;
  submitted_at: string | null; meeting_date: string | null;
  responses: Response[];
}
interface Insight {
  id: string; kind: string; title: string; body: string; source: string; created_at: string;
}

const INSIGHT_KINDS = ["pain_point", "opportunity", "canon_domain", "tone_signal", "followup_question"];

function kindColor(kind: string) {
  if (kind === "pain_point") return "red";
  if (kind === "opportunity") return "green";
  if (kind === "canon_domain") return "purple";
  if (kind === "tone_signal") return "orange";
  return "gray";
}

export default function SessionDetailPage() {
  const params = useParams();
  const groupSlug = params.slug as string;
  const prospectSlug = params.prospectSlug as string;
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // refined text edit state per response
  const [refining, setRefining] = useState<Record<string, string>>({});
  const [savingRefine, setSavingRefine] = useState<Record<string, boolean>>({});

  // new insight form
  const [insightKind, setInsightKind] = useState("pain_point");
  const [insightTitle, setInsightTitle] = useState("");
  const [insightBody, setInsightBody] = useState("");
  const [savingInsight, setSavingInsight] = useState(false);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const refineBg = useColorModeValue("blue.50", "blue.900");

  const insightKindCollection = useMemo(() => createListCollection({
    items: INSIGHT_KINDS.map((k) => ({ label: k.replace(/_/g, " "), value: k })),
  }), []);

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        `/api/prospects/${prospectSlug}/sessions/${sessionId}/`
      );
      setSession(res.data);
      const initial: Record<string, string> = {};
      res.data.responses.forEach((r: Response) => {
        initial[r.id] = r.human_refined_text ?? "";
      });
      setRefining(initial);
    } catch {
      setError("Could not load session.");
    } finally {
      setLoading(false);
    }
  }, [prospectSlug, sessionId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, load]);

  async function handleSaveRefinement(responseId: string) {
    setSavingRefine((s) => ({ ...s, [responseId]: true }));
    try {
      await axiosInstance.patch(
        `/api/prospects/${prospectSlug}/sessions/${sessionId}/responses/${responseId}/`,
        { human_refined_text: refining[responseId] }
      );
    } finally {
      setSavingRefine((s) => ({ ...s, [responseId]: false }));
    }
  }

  async function handleAddInsight() {
    if (!insightTitle.trim() || !insightBody.trim()) return;
    setSavingInsight(true);
    try {
      const res = await axiosInstance.post(
        `/api/prospects/${prospectSlug}/sessions/${sessionId}/insights/`,
        { kind: insightKind, title: insightTitle.trim(), body: insightBody.trim() }
      );
      setInsights((i) => [res.data, ...i]);
      setInsightTitle("");
      setInsightBody("");
    } finally {
      setSavingInsight(false);
    }
  }

  if (authLoading || loading) {
    return <Box px="6" py="20" textAlign="center"><Spinner size="lg" /></Box>;
  }
  if (!isAuthenticated || !user?.is_superuser) {
    return <Box px="6" py="20" textAlign="center"><Text>Superuser access required.</Text></Box>;
  }
  if (error || !session) {
    return <Box px="6" py="10"><Text color="red.500">{error || "Not found."}</Text></Box>;
  }

  // Group responses by question
  const byQuestion: Record<string, Response[]> = {};
  session.responses.forEach((r) => {
    if (!byQuestion[r.question_id]) byQuestion[r.question_id] = [];
    byQuestion[r.question_id].push(r);
  });

  return (
    <Box maxW="3xl" mx="auto" px="6" py="10">
      <HStack mb="6" justify="space-between" align="center">
        <Box>
          <Heading size="lg">Session review</Heading>
          <Text fontSize="sm" color={mutedColor}>
            {session.mode.replace(/_/g, " ")} ·{" "}
            <Badge colorPalette={session.status === "submitted" ? "green" : "gray"} size="sm">
              {session.status.replace(/_/g, " ")}
            </Badge>
            {session.submitted_at ? ` · Submitted ${new Date(session.submitted_at).toLocaleDateString()}` : ""}
          </Text>
        </Box>
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${groupSlug}/admin/prospects/${prospectSlug}`}>← Prospect</NextLink>
        </ChakraLink>
      </HStack>

      {/* Responses */}
      <VStack gap="6" align="stretch" mb="10">
        {Object.entries(byQuestion).map(([qid, responses]) => {
          const first = responses[0];
          return (
            <Box key={qid} p="5" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg}>
              <Text fontWeight="600" mb="3">{first.question_prompt_snapshot}</Text>
              <VStack gap="3" align="stretch">
                {responses.map((r) => (
                  <Box key={r.id}>
                    <HStack mb="1">
                      <Badge size="sm" colorPalette={r.kind === "voice" ? "purple" : r.kind === "file" ? "orange" : "gray"}>
                        {r.kind}
                      </Badge>
                      {r.processing_status !== "done" && (
                        <Badge size="sm" colorPalette={r.processing_status === "failed" ? "red" : "blue"}>
                          {r.processing_status}
                        </Badge>
                      )}
                    </HStack>
                    {r.response_text ? (
                      <Text fontSize="sm" whiteSpace="pre-wrap" mb="2">{r.response_text}</Text>
                    ) : (
                      <Text fontSize="sm" color={mutedColor} mb="2">No text yet.</Text>
                    )}
                    <Box p="3" bg={refineBg} borderRadius="md">
                      <Text fontSize="xs" color={mutedColor} mb="1">Refined version</Text>
                      <Textarea
                        size="sm"
                        rows={3}
                        value={refining[r.id] ?? ""}
                        onChange={(e) => setRefining((s) => ({ ...s, [r.id]: e.target.value }))}
                        placeholder="Edit or summarise the response…"
                      />
                      <HStack mt="2">
                        <Button
                          size="xs"
                          onClick={() => handleSaveRefinement(r.id)}
                          loading={savingRefine[r.id]}
                        >
                          Save
                        </Button>
                      </HStack>
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Box>
          );
        })}
        {Object.keys(byQuestion).length === 0 && (
          <Text color={mutedColor} fontSize="sm">No responses submitted yet.</Text>
        )}
      </VStack>

      {/* Insights */}
      <Box>
        <Text fontWeight="600" mb="3">Insights</Text>
        <Box p="4" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg} mb="4">
          <VStack gap="2" align="stretch">
            <Select.Root
              collection={insightKindCollection}
              size="sm"
              value={[insightKind]}
              onValueChange={({ value }) => setInsightKind(value[0])}
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
                    {insightKindCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}<Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
            <Input size="sm" placeholder="Title" value={insightTitle} onChange={(e) => setInsightTitle(e.target.value)} />
            <Textarea size="sm" rows={3} placeholder="Body" value={insightBody} onChange={(e) => setInsightBody(e.target.value)} />
            <HStack>
              <Button
                size="sm"
                colorPalette="blue"
                onClick={handleAddInsight}
                loading={savingInsight}
                disabled={!insightTitle.trim() || !insightBody.trim()}
              >
                Add insight
              </Button>
            </HStack>
          </VStack>
        </Box>
        {insights.length === 0 ? (
          <Text fontSize="sm" color={mutedColor}>No insights yet.</Text>
        ) : (
          <VStack gap="2" align="stretch">
            {insights.map((i) => (
              <Box key={i.id} p="4" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg}>
                <HStack mb="1">
                  <Badge colorPalette={kindColor(i.kind)} size="sm">{i.kind.replace(/_/g, " ")}</Badge>
                  <Text fontSize="xs" color={mutedColor}>{new Date(i.created_at).toLocaleDateString()}</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="500">{i.title}</Text>
                <Text fontSize="sm" color={mutedColor}>{i.body}</Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
