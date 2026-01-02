// src/components/write/PublishPanel.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Box, Stack, Heading, Button, Input, Textarea, Text,
  Checkbox, HStack, Badge, Alert
} from "@chakra-ui/react";
import { IconExternalLink, IconMail, IconUsers, IconUser } from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type ProseMirrorNode = {
  type?: string;
  text?: string;
  content?: ProseMirrorNode[];
};

type ProseMirrorDoc = {
  content?: ProseMirrorNode[];
};

type DocumentJSON = Record<string, unknown>;

interface PublishDestination {
  personal: boolean;
  groups: string[];
  lantern: boolean;
}

interface PublishPayload {
  title: string;
  body_json: DocumentJSON;
  excerpt?: string;
  writing_kind: 'post' | 'article' | 'dispatch' | 'forum' | 'announcement' | 'almanac' | 'page' | 'other';
  destinations: PublishDestination;
  canonical_url?: string;
  tags?: string[];
  scheduled_for?: string;
}

interface Props {
  draftId?: string;
  title: string;
  docJSON: DocumentJSON;
  tags?: string[];
  onPublishSuccess?: (pieceId: string) => void;
  onClose?: () => void;
}

export default function PublishPanel({
  draftId,
  title,
  docJSON,
  tags = [],
  onPublishSuccess,
  onClose
}: Props) {
  // Publishing options
  const [writingKind, setWritingKind] = useState<'post' | 'article'>('post');
  const [excerpt, setExcerpt] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Destinations
  const [toPersonal, setToPersonal] = useState(true);
  const [toGroups, setToGroups] = useState<string>(""); // comma-separated group slugs/ids
  const [toLantern, setToLantern] = useState(false);

  // Scheduling (future feature)
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  void setIsScheduled;
  void setScheduledFor;

  // UI state
  const [busy, setBusy] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'success' | 'error'>('success');

  // Auto-generate excerpt from content if empty
  useEffect(() => {
    if (!excerpt && docJSON && docJSON.content) {
      const textContent = extractTextFromDoc(docJSON as ProseMirrorDoc);
      const autoExcerpt = textContent.slice(0, 200);
      setExcerpt(autoExcerpt + (textContent.length > 200 ? "..." : ""));
    }
  }, [docJSON, excerpt]);

  const extractTextFromDoc = (doc: ProseMirrorDoc | null): string => {
    if (!doc || !doc.content) return "";

    const extractText = (node: ProseMirrorNode): string => {
      if (node.type === "text") {
        return node.text || "";
      }
      if (node.content) {
        return node.content.map(extractText).join("");
      }
      return "";
    };

    return doc.content.map(extractText).join(" ").trim();
  };

  const handlePublish = async () => {
    setBusy(true);
    setResultMsg(null);

    try {
      // Normalize destinations
      const groups = toGroups
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      // Build payload
      const payload: PublishPayload = {
        title: title.trim() || "Untitled",
        body_json: docJSON,
        excerpt: excerpt.trim() || undefined,
        writing_kind: writingKind,
        destinations: {
          personal: toPersonal,
          groups,
          lantern: toLantern,
        },
        canonical_url: canonicalUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        scheduled_for: isScheduled && scheduledFor ? scheduledFor : undefined,
      };

      // Include draft ID if converting from draft
      const endpoint = draftId
        ? `/api/writing/drafts/${draftId}/publish`
        : "/api/writing/publish";

      const res = await axiosInstance.post(endpoint, payload);

      setResultMsg("Published successfully!");
      setResultType('success');

      // Call success callback with the new piece ID
      if (onPublishSuccess && res.data?.id) {
        onPublishSuccess(res.data.id);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      console.error('Publish error:', error);
      const errorMsg = getErrorMessage(error);
      setResultMsg(`Publish failed: ${errorMsg}`);
      setResultType('error');
    } finally {
      setBusy(false);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
      const data = (error as { response?: { data?: { message?: string } } }).response?.data;
      if (data?.message) return data.message;
    }
    if (error instanceof Error) return error.message;
    return 'Unknown error';
  };

  const getDestinationPreview = () => {
    const destinations = [];
    if (toPersonal) destinations.push("Personal Feed");
    if (toLantern) destinations.push("Newsletter");
    if (toGroups.trim()) {
      const groupCount = toGroups.split(",").filter(s => s.trim()).length;
      destinations.push(`${groupCount} Group${groupCount > 1 ? 's' : ''}`);
    }
    return destinations.length > 0 ? destinations.join(", ") : "No destinations selected";
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} bg="white" _dark={{ bg: "gray.800" }}>
      <Heading size="lg" mb={4} color="green.600">
        Publish Writing
      </Heading>

      <Stack gap={5}>
        {/* Writing Kind Selection */}
        <Box>
          <Text fontWeight="semibold" mb={2}>Content Type</Text>
          <HStack>
            <Button
              variant={writingKind === 'post' ? 'solid' : 'outline'}
              colorScheme={writingKind === 'post' ? 'green' : undefined}
              onClick={() => setWritingKind('post')}
              size="sm"
            >
              Post
            </Button>
            <Button
              variant={writingKind === 'article' ? 'solid' : 'outline'}
              colorScheme={writingKind === 'article' ? 'green' : undefined}
              onClick={() => setWritingKind('article')}
              size="sm"
            >
              Article
            </Button>
          </HStack>
          <Text fontSize="xs" color="gray.600" mt={1}>
            {writingKind === 'article'
              ? "Longer-form content with versions and canonical URL support"
              : "Short-form social content for feeds and discussions"
            }
          </Text>
        </Box>

        {/* Destinations */}
        <Box>
          <Text fontWeight="semibold" mb={2}>Where to Publish</Text>
          <Stack gap={2}>
            <Checkbox.Root
              checked={toPersonal}
              onCheckedChange={({ checked }: { checked: boolean | string }) => setToPersonal(!!checked)}
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                <HStack gap={2}>
                  <IconUser size={16} />
                  <Text>Personal Feed</Text>
                </HStack>
              </Checkbox.Label>
            </Checkbox.Root>

            <Checkbox.Root
              checked={toLantern}
              onCheckedChange={({ checked }: { checked: boolean | string }) => setToLantern(!!checked)}
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                <HStack gap={2}>
                  <IconMail size={16} />
                  <Text>Newsletter (Lantern Mail)</Text>
                </HStack>
              </Checkbox.Label>
            </Checkbox.Root>
          </Stack>
        </Box>

        {/* Groups */}
        <Box>
          <Box fontWeight="semibold" mb={2}>
            <HStack gap={2}>
              <IconUsers size={16} />
              <Text>Groups</Text>
            </HStack>
          </Box>
          <Input
            placeholder="Enter group slugs or IDs (comma-separated)"
            value={toGroups}
            onChange={(e) => setToGroups(e.target.value)}
            size="sm"
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            Example: sustainability-circle, local-food-network
          </Text>
        </Box>

        {/* Excerpt */}
        <Box>
          <Text fontWeight="semibold" mb={2}>Excerpt</Text>
          <Textarea
            placeholder="Brief description or summary (optional)"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            resize="vertical"
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            {excerpt.length}/500 characters
          </Text>
        </Box>

        {/* Canonical URL (for articles) */}
        {writingKind === 'article' && (
          <Box>
            <Text fontWeight="semibold" mb={2}>
              <HStack gap={2}>
                <IconExternalLink size={16} />
                <Text>Canonical URL</Text>
              </HStack>
            </Text>
            <Input
              placeholder="https://example.com/original-post (optional)"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              size="sm"
            />
            <Text fontSize="xs" color="gray.600" mt={1}>
              If this content was originally published elsewhere
            </Text>
          </Box>
        )}

        {/* Preview */}
        <Box p={3} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
          <Text fontWeight="semibold" fontSize="sm" mb={1}>Publishing to:</Text>
          <Text fontSize="sm" color="gray.700" _dark={{ color: "gray.300" }}>
            {getDestinationPreview()}
          </Text>
          <Badge colorScheme="green" size="sm" mt={1}>
            {writingKind.toUpperCase()}
          </Badge>
        </Box>

        {/* Result Message */}
        {resultMsg && (
          <Alert.Root status={resultType} size="sm">
            <Alert.Indicator />
            <Alert.Title>{resultMsg}</Alert.Title>
          </Alert.Root>
        )}

        {/* Actions */}
        <HStack gap={3} pt={2}>
          <Button
            onClick={handlePublish}
            loading={busy}
            colorScheme="green"
            size="lg"
            flex={1}
            disabled={!toPersonal && !toLantern && !toGroups.trim()}
          >
            {busy ? 'Publishing...' : 'Publish Now'}
          </Button>

          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              size="lg"
              disabled={busy}
            >
              Cancel
            </Button>
          )}
        </HStack>

        <Text fontSize="xs" color="gray.500" textAlign="center">
          {draftId ? 'Converting draft to published piece' : 'Creating new published piece'}
        </Text>
      </Stack>
    </Box>
  );
}
