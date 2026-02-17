// apps/mixtape/src/components/lanternmail/LanternmailCampaignWorkArea.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Input,
  Portal,
  Select,
  Stack,
  Text,
  Textarea,
  VStack,
  createListCollection,
  Link,
} from "@chakra-ui/react";
import { Group } from "@mixtape/core/types/groupTypes";
import { LanternmailCampaign, LanternmailList } from "@mixtape/core/types/lanternmailTypes";
import { useLanternmail } from "@hooks/lanternmail/useLanternmail";
import { lanternmailApi } from "@mixtape/api/clients/lanternmail/lanternmailApi";
import { Alert } from "../ui/alerts";

export default function LanternmailCampaignWorkArea({ group }: { group: Group }) {
  const listmonkUrl = process.env.NEXT_PUBLIC_LISTMONK_URL || "http://localhost:9090";
  const { getGroupLists, loading } = useLanternmail();
  const [lists, setLists] = useState<LanternmailList[]>([]);
  const [campaigns, setCampaigns] = useState<LanternmailCampaign[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [listId, setListId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testEmails, setTestEmails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const listCollection = useMemo(
    () =>
      createListCollection({
        items: lists.map((list) => ({
          label: list.display_name,
          value: String(list.id),
        })),
      }),
    [lists]
  );

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const result = await getGroupLists(group.slug);
        setLists(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load lists";
        setError(message);
      }
    };

    fetchLists();
  }, [getGroupLists, group.slug]);

  const selectedList = useMemo(
    () => lists.find((list) => list.id === listId) || null,
    [lists, listId]
  );

  const refreshCampaigns = useCallback(async (listFilter?: number | null) => {
    try {
      const result = await lanternmailApi.listCampaigns(group.slug, listFilter ?? null);
      setCampaigns(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load campaigns";
      setError(message);
    }
  }, [group.slug]);

  useEffect(() => {
    refreshCampaigns(listId);
  }, [listId, refreshCampaigns]);

  const handleCreateCampaign = async () => {
    if (!listId) {
      setError("Select a list to create a campaign.");
      return;
    }
    if (!name || !subject || !body) {
      setError("Name, subject, and body are required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const campaign = await lanternmailApi.createCampaign(group.slug, {
        list_id: listId,
        name,
        subject,
        body,
        content_type: "richtext",
      });
      setActiveCampaignId(campaign?.id || null);
      setStatusMessage("Campaign created.");
      await refreshCampaigns(listId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create campaign";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestCampaign = async () => {
    if (!activeCampaignId) {
      setError("Create a campaign first.");
      return;
    }
    const emails = testEmails
      .split(/[,\s]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setError("Enter at least one test email.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await lanternmailApi.testCampaign(group.slug, activeCampaignId, emails);
      setStatusMessage("Test email sent.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send test";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!activeCampaignId) {
      setError("Create a campaign first.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await lanternmailApi.sendCampaign(group.slug, activeCampaignId);
      setStatusMessage("Campaign send started.");
      await refreshCampaigns(listId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send campaign";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack align="stretch" gap={6}>
      <Heading size="lg">Create Campaign</Heading>
      {error && <Alert status="error" title="Lanternmail" description={error} />}
      {statusMessage && <Alert status="success" title="Lanternmail" description={statusMessage} />}

      <Card.Root variant="outline">
        <Card.Body>
          <Stack gap={4}>
            <Field.Root>
              <Field.Label>List</Field.Label>
              <Select.Root
                value={listId ? [String(listId)] : []}
                onValueChange={({ value }) => {
                  const nextValue = value[0];
                  setListId(nextValue ? Number(nextValue) : null);
                }}
                collection={listCollection}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select a list" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {listCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
              {selectedList && (
                <Text fontSize="xs" color="gray.500">
                  {selectedList.description || "No description"}
                </Text>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>Campaign Name</Field.Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field.Root>

            <Field.Root>
              <Field.Label>Subject</Field.Label>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </Field.Root>

            <Field.Root>
              <Field.Label>Body</Field.Label>
              <Textarea
                rows={8}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </Field.Root>

            <HStack gap={3}>
              <Button size="sm" onClick={handleCreateCampaign} loading={isSubmitting} disabled={loading}>
                Create Draft
              </Button>
              <Button size="sm" variant="outline" onClick={handleSendCampaign} loading={isSubmitting}>
                Send Campaign
              </Button>
              {!activeCampaignId && (
                <Text fontSize="sm" color="gray.500">
                  Save draft to send
                </Text>
              )}
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Card.Root variant="outline">
        <Card.Body>
          <Stack gap={3}>
            <Heading size="sm">Send Test</Heading>
            <Field.Root>
              <Field.Label>Test Emails</Field.Label>
              <Input
                placeholder="email1@example.com, email2@example.com"
                value={testEmails}
                onChange={(event) => setTestEmails(event.target.value)}
              />
            </Field.Root>
            <Button size="sm" variant="outline" onClick={handleTestCampaign} loading={isSubmitting}>
              Send Test Email
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Box>
        <Heading size="md" mb={3}>
          Recent Campaigns
        </Heading>
        {campaigns.length === 0 ? (
          <Text color="gray.500">No campaigns found.</Text>
        ) : (
          <Stack gap={2}>
            {campaigns.map((campaign) => (
              <Card.Root key={campaign.id} variant="outline">
                <Card.Body>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="bold">{campaign.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {campaign.subject || "No subject"}
                      </Text>
                    </Box>
                    <HStack gap={3}>
                      <Text fontSize="sm" color="gray.500">
                        {campaign.status || "draft"}
                      </Text>
                      <Button
                        rel="noreferrer"
                        size="sm"
                        variant="outline"
                      >
                        <Link target="_blank" href={`${listmonkUrl}/admin/campaigns/${campaign.id}`}>Open in Listmonk</Link>
                      </Button>
                    </HStack>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </Stack>
        )}
      </Box>
    </VStack>
  );
}
