// src/components/lantern/ListDetailModal.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  Portal,
  CloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Stat,
  Box,
  Tabs,
  Spinner,
} from "@chakra-ui/react";
// import { LanternmailList } from "content/lanternTypes";
// import { useLanternmail } from "@hooks/useLanternamil";
import { Divider } from "@components/common/Divider";
import AddSubscribersView from "./AddSubscribersView";
import { LanternmailList } from "@mixtape/core/types/lanternmailTypes";
import { Alert } from "../ui/alerts";
import { useLanternmail } from "@/hooks/lanternmail/useLanternmail";

interface Props {
  list: LanternmailList;
  isOpen: boolean;
  onClose: () => void;
}

interface ListStats {
  subscriber_count: number;
  campaign_count: number;
  last_campaign_date?: string;
  status: 'enabled' | 'disabled';
}

export default function ListDetailModal({ list, isOpen, onClose }: Props) {
  const { getListDetails, loading } = useLanternmail();
  const [stats, setStats] = useState<ListStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [view, setView] = useState<'details' | 'add-subscribers'>('details');

  useEffect(() => {
    if (isOpen && list) {
      fetchListDetails();
    }
  }, [isOpen, list]);

  const fetchListDetails = async () => {
    try {
      setError(null);
      const details = await getListDetails(list.group_slug, list.id);
      setStats(details);
    } catch (err: any) {
      setError(err.message || "Failed to load list details");
    }
  };


  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="65%"
            maxH="85vh"
            overflowY="auto"
            p={6}
            rounded="2xl"
            bg="background.surface"
          >
            {/* Header */}
            <Dialog.Header mb={4}>
              <VStack align="start" gap={2}>
                <HStack>
                  <Dialog.Title fontSize="xl" fontWeight="bold">
                    {view === 'add-subscribers' ? 'Add Subscribers' : list.display_name}
                  </Dialog.Title>
                  <Badge colorScheme={list.is_active ? "green" : "red"}>
                    {list.is_active ? "Active" : "Inactive"}
                  </Badge>
                </HStack>
                {view === 'details' && (
                  <>
                    <Text fontSize="sm" color="gray.600">
                      {list.description}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Internal: {list.listmonk_name} • Group: {list.group_title}
                    </Text>
                  </>
                )}
              </VStack>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" position="absolute" top="4" right="4" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              {/* Conditionally render based on view */}
              {view === 'add-subscribers' ? (
                <AddSubscribersView
                  list={list}
                  onBack={() => setView('details')}
                  onComplete={() => {
                    setView('details');
                    fetchListDetails(); // Refresh stats
                  }}
                />
              ) : (
                // Your existing details content
                <>
                  {error && <Alert title="Error Loading Details" description={error} />}

                  {loading ? (
                    <Box textAlign="center" py={8}>
                      <Spinner size="lg" />
                      <Text mt={4}>Loading list details...</Text>
                    </Box>
                  ) : (
                    <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
                      {/* Your existing tabs content, but update the Add Subscribers buttons */}
                      <Tabs.List gap={2} mb={4}>
                        {/* ... your existing tab triggers */}
                      </Tabs.List>

                      <Tabs.Content value="overview">
                        <VStack gap={6} align="stretch">
                          {/* Your existing stats */}

                          <Box>
                            <Text fontWeight="bold" mb={3}>Quick Actions</Text>
                            <VStack gap={3} align="stretch">
                              <Button
                                size="sm"
                                onClick={() => setView('add-subscribers')} // ✅ Wire this up
                              >
                                Add Subscribers
                              </Button>
                              {/* ... your other buttons */}
                            </VStack>
                          </Box>
                        </VStack>
                      </Tabs.Content>

                      <Tabs.Content value="subscribers">
                        <VStack gap={4} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Subscribers ({stats?.subscriber_count || 0})</Text>
                            <Button
                              size="sm"
                              onClick={() => setView('add-subscribers')} // ✅ Wire this up too
                            >
                              Add Subscriber
                            </Button>
                          </HStack>

                          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                            <Text color="gray.600" textAlign="center">
                              Subscriber management coming soon...
                            </Text>
                          </Box>
                        </VStack>
                      </Tabs.Content>

                      {/* ... your other tabs */}
                    </Tabs.Root>
                  )}
                </>
              )}
            </Dialog.Body>

            {/* Only show footer for details view */}
            {view === 'details' && (
              <Dialog.Footer justifyContent="flex-end" mt="6">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
