"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  List,
  Portal,
  Select,
  Spinner,
  Stack,
  Text,
  createListCollection,
  Link,
  Card,
} from "@chakra-ui/react";
import {
  useNotificationMutations,
  useNotificationPreferences,
  useNotificationSummary,
  useNotificationsPage,
} from "@mixtape/api/hooks/activity";
import type { Notification, NotificationBucket, NotificationLevel } from "@mixtape/core/types/activityTypes";

const bucketCollection = createListCollection({
  items: [
    { label: "All", value: "all" },
    { label: "Messages", value: "messages" },
    { label: "Activity", value: "activity" },
    { label: "System", value: "system" },
  ],
});

const levelCollection = createListCollection({
  items: [
    { label: "Realtime", value: "realtime" },
    { label: "Digest", value: "digest" },
    { label: "Mute", value: "mute" },
  ],
});

function formatWhen(value: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function NotificationsPage() {
  const [bucket, setBucket] = useState<string>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[]>([]);

  const { summary } = useNotificationSummary();
  const { preferences } = useNotificationPreferences();
  const { markRead, markAllRead, dismiss, setPreference } = useNotificationMutations();

  const { page, isLoading } = useNotificationsPage({
    bucket: bucket === "all" ? undefined : bucket,
    cursor,
  });

  useEffect(() => {
    if (!page) return;
    setItems((prev) => (cursor ? [...prev, ...page.results] : page.results));
  }, [page, cursor]);

  useEffect(() => {
    setCursor(null);
  }, [bucket]);

  const unreadCount = summary?.notifications_unread_count ?? 0;
  const byBucket = summary?.notifications_unread_by_bucket ?? {};

  const canLoadMore = Boolean(page?.nextCursor);

  const [prefBucket, setPrefBucket] = useState<NotificationBucket>("activity");
  const [activityCode, setActivityCode] = useState<string>("");
  const [level, setLevel] = useState<NotificationLevel>("realtime");

  const handleSetPreference = () => {
    if (!prefBucket && !activityCode) return;
    setPreference.mutate({
      bucket: activityCode ? undefined : prefBucket,
      activity_code: activityCode || undefined,
      level,
    });
  };

  const unreadIds = useMemo(
    () => items.filter((n) => !n.is_read).map((n) => n.id),
    [items]
  );

  return (
    <Container maxW="6xl" py={10}>
      <Stack gap={8}>
        <Stack gap={2}>
          <Heading size="2xl">Notifications</Heading>
          <Text color="fg.muted">
            Track mentions, system alerts, and activity across Mixtape.
          </Text>
        </Stack>

        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <Flex wrap="wrap" gap={3} align="center" justify="space-between">
                <HStack gap={3}>
                  <Badge colorScheme="blue" variant="subtle">
                    {unreadCount} unread
                  </Badge>
                  <Text color="fg.muted">
                    Messages {byBucket.messages ?? 0} · Activity {byBucket.activity ?? 0} · System {byBucket.system ?? 0}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markRead.mutate(unreadIds)}
                    disabled={unreadIds.length === 0 || markRead.isPending}
                  >
                    Mark visible read
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => markAllRead.mutate(bucket === "all" ? undefined : bucket)}
                    disabled={markAllRead.isPending}
                  >
                    Mark all read
                  </Button>
                </HStack>
              </Flex>

              <Select.Root
                value={[bucket]}
                onValueChange={({ value }) => setBucket(value[0] || "all")}
                collection={bucketCollection}
              >
                <Select.HiddenSelect />
                <Select.Control maxW="240px">
                  <Select.Trigger>
                    <Select.ValueText placeholder="Filter bucket" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {bucketCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>

              {isLoading && (
                <HStack>
                  <Spinner size="sm" />
                  <Text color="fg.muted">Loading notifications...</Text>
                </HStack>
              )}

              {!isLoading && items.length === 0 && (
                <Text color="fg.muted">No notifications yet.</Text>
              )}

              <List.Root gap={4}>
                {items.map((n) => (
                  <List.Item key={n.id}>
                    <Card.Root>
                      <Card.Body>
                        <Stack gap={2}>
                          <HStack gap={2} flexWrap="wrap">
                            <Badge colorScheme={n.is_read ? "gray" : "green"} variant="subtle">
                              {n.bucket}
                            </Badge>
                            <Badge colorScheme="purple" variant="subtle">
                              {n.priority}
                            </Badge>
                            <Badge colorScheme="orange" variant="subtle">
                              {n.level}
                            </Badge>
                            <Text color="fg.muted" fontSize="sm">
                              {formatWhen(n.last_occurred_at)}
                            </Text>
                          </HStack>
                          <Text fontWeight="semibold">
                            {n.actor_name ? `${n.actor_name} ` : ""}
                            {n.verb || "updated"}
                            {n.object_name ? ` ${n.object_name}` : ""}
                            {n.aggregate_count > 1 ? ` (${n.aggregate_count})` : ""}
                          </Text>
                          {n.action_url && (
                            <Link as={NextLink} href={n.action_url}>
                              Open
                            </Link>
                          )}
                          <HStack gap={2}>
                            {!n.is_read && (
                              <Button size="xs" variant="outline" onClick={() => markRead.mutate([n.id])}>
                                Mark read
                              </Button>
                            )}
                            <Button size="xs" variant="ghost" onClick={() => dismiss.mutate(n.id)}>
                              Dismiss
                            </Button>
                          </HStack>
                        </Stack>
                      </Card.Body>
                    </Card.Root>
                  </List.Item>
                ))}
              </List.Root>

              {canLoadMore && (
                <Box>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCursor(page?.nextCursor ?? null)}
                  >
                    Load more
                  </Button>
                </Box>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Body>
            <Stack gap={4}>
              <Heading size="md">Notification Preferences</Heading>
              <Text color="fg.muted">
                Preferences are applied immediately. Digest currently behaves like realtime until digest emails are
                enabled.
              </Text>

              <Stack gap={3}>
                <Text fontWeight="medium">New preference</Text>
                <Flex wrap="wrap" gap={3} align="center">
                  <Select.Root
                    value={[prefBucket]}
                    onValueChange={({ value }) =>
                      setPrefBucket((value[0] as NotificationBucket) || "activity")
                    }
                    collection={bucketCollection}
                  >
                    <Select.HiddenSelect />
                    <Select.Control maxW="200px">
                      <Select.Trigger>
                        <Select.ValueText placeholder="Bucket" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                        <Select.ClearTrigger />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {bucketCollection.items
                            .filter((item) => item.value !== "all")
                            .map((item) => (
                              <Select.Item item={item} key={item.value}>
                                {item.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>

                  <Input
                    maxW="260px"
                    placeholder="Activity code (optional)"
                    value={activityCode}
                    onChange={(e) => setActivityCode(e.target.value)}
                  />

                  <Select.Root
                    value={[level]}
                    onValueChange={({ value }) => setLevel((value[0] || "realtime") as NotificationLevel)}
                    collection={levelCollection}
                  >
                    <Select.HiddenSelect />
                    <Select.Control maxW="200px">
                      <Select.Trigger>
                        <Select.ValueText placeholder="Level" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                        <Select.ClearTrigger />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {levelCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>

                  <Button onClick={handleSetPreference} loading={setPreference.isPending}>
                    Save preference
                  </Button>
                </Flex>
              </Stack>

              {preferences.length > 0 && (
                <Stack gap={2}>
                  <Text fontWeight="medium">Existing preferences</Text>
                  <List.Root gap={2}>
                    {preferences.map((pref) => (
                      <List.Item key={pref.id}>
                        <Text>
                          <strong>{pref.activity_code || pref.bucket}</strong> → {pref.level}
                        </Text>
                      </List.Item>
                    ))}
                  </List.Root>
                </Stack>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Container>
  );
}
