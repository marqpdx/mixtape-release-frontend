// src/components/chat/NewConversationDialog.tsx

"use client";

import { UserIdentity } from "@mixtape/core/types/auth";
import {
  Button,
  Dialog,
  Portal,
  Text,
  Stack,
  createOverlay,
  Box,
  RadioGroup,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import type { TrustProfile } from "./interfaces";
import { MemberPicker, type MemberCandidate } from "@/components/common/MemberPicker";

interface NewConversationDialogProps {
  title: string;
  allMembers: UserIdentity[];
  onStart: (usernames: string[], trustProfile: TrustProfile) => void;
}

const TRUST_PROFILES: { value: TrustProfile; label: string; description: string }[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Full features: searching, indexing, conversation memory, and message history.",
  },
  {
    value: "private",
    label: "Private",
    description: "Encrypted at rest. No searching, no indexing, no conversation memory.",
  },
  {
    value: "ephemeral",
    label: "Ephemeral",
    description: "Private, plus messages are permanently deleted after a set time. No recovery by anyone.",
  },
];

export const newConversationDialog = createOverlay<NewConversationDialogProps>(
  ({ title, allMembers, onStart, ...rest }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [trustProfile, setTrustProfile] = useState<TrustProfile>("private");

    const candidates = useMemo<MemberCandidate[]>(
      () => allMembers.map(u => ({
        id: u.id,
        displayName: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
        username: u.username,
      })),
      [allMembers]
    );

    const selectedUsernames = useMemo(() => {
      const idSet = new Set(selectedIds);
      return allMembers.filter(u => idSet.has(u.id)).map(u => u.username);
    }, [selectedIds, allMembers]);

    const toggleSelection = (id: number | string) => {
      const strId = String(id);
      setSelectedIds(prev =>
        prev.includes(strId) ? prev.filter(i => i !== strId) : [...prev, strId]
      );
    };

    return (
      <Dialog.Root {...rest}>
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              w={{ base: "90%", sm: "440px" }}
              maxW="md"
              rounded="2xl"
              shadow="lg"
              p="6"
              bg="background.surface"
            >
              <Dialog.Header mb="4">
                <Dialog.Title fontSize="xl" fontWeight="bold">
                  {title}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <MemberPicker
                  candidates={candidates}
                  selected={selectedIds}
                  onToggle={toggleSelection}
                  maxH="240px"
                />

                <Box mt="5" className="ncd-trust-selector">
                  <Text fontSize="sm" fontWeight="semibold" mb="2" color="text.primary">
                    Conversation type
                  </Text>
                  <RadioGroup.Root
                    value={trustProfile}
                    onValueChange={(details) => setTrustProfile(details.value as TrustProfile)}
                  >
                    <Stack gap="2">
                      {TRUST_PROFILES.map((p) => (
                        <RadioGroup.Item
                          key={p.value}
                          value={p.value}
                          p="3"
                          rounded="md"
                          border="1px solid"
                          borderColor={trustProfile === p.value ? "brand.500" : "border.default"}
                          bg={trustProfile === p.value ? "brand.50" : "transparent"}
                          cursor="pointer"
                        >
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemControl />
                          <Stack gap="0" ml="2">
                            <RadioGroup.ItemText fontSize="sm" fontWeight="medium">
                              {p.label}
                            </RadioGroup.ItemText>
                            <Text fontSize="xs" color="text.muted">
                              {p.description}
                            </Text>
                          </Stack>
                        </RadioGroup.Item>
                      ))}
                    </Stack>
                  </RadioGroup.Root>
                </Box>
              </Dialog.Body>

              <Dialog.Footer mt="6" justifyContent="flex-end" gap="3">
                <Button
                  variant="ghost"
                  onClick={() => newConversationDialog.close("new-chat")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onStart(selectedUsernames, trustProfile);
                    newConversationDialog.close("new-chat");
                  }}
                  disabled={selectedIds.length === 0}
                >
                  Start Chat
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }
);
