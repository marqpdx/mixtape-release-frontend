// src/components/chat/NewConversationDialog.tsx

"use client";

import { UserIdentity } from "@mixtape/core/types/auth";
import {
  Button,
  Dialog,
  Portal,
  Text,
  Stack,
  Checkbox,
  createOverlay,
  Box,
  RadioGroup,
} from "@chakra-ui/react";
import { useState } from "react";
import type { TrustProfile } from "./interfaces";

interface NewConversationDialogProps {
  title: string;
  allMembers: UserIdentity[];
  onStart: (usernames: string[], trustProfile: TrustProfile) => void;
}

const TRUST_PROFILES: { value: TrustProfile; label: string; description: string }[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Full features, search, AI tools, and message history.",
  },
  {
    value: "private",
    label: "Private",
    description: "End-to-end encrypted. No AI features, no search, no Continuity.",
  },
  {
    value: "ephemeral",
    label: "Ephemeral",
    description: "Private, plus messages are permanently deleted after a set time.",
  },
];

export const newConversationDialog = createOverlay<NewConversationDialogProps>(
  ({ title, allMembers, onStart, ...rest }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [trustProfile, setTrustProfile] = useState<TrustProfile>("standard");

    if (process.env.NODE_ENV === 'development') {
      console.log("NewConversationDialog allMembers:", allMembers);
    }

    const toggleSelection = (username: string) => {
      setSelected((prev) =>
        prev.includes(username)
          ? prev.filter((u) => u !== username)
          : [...prev, username]
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
                {allMembers.length === 0 ? (
                  <Text fontSize="sm" color="text.muted">
                    No members available.
                  </Text>
                ) : (
                  <Stack gap="3" maxH="240px" overflowY="auto">
                    {allMembers.map((user) => {
                      const isChecked = selected.includes(user.username);
                      return (
                        <Checkbox.Root
                          key={user.id}
                          checked={isChecked}
                          onCheckedChange={() => toggleSelection(user.username)}
                          display="flex"
                          alignItems="center"
                          gap="3"
                          p="2"
                          rounded="md"
                          _hover={{ bg: "background.subtle" }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label fontSize="sm">
                            {user.first_name} {user.last_name || user.username}
                          </Checkbox.Label>
                        </Checkbox.Root>
                      );
                    })}
                  </Stack>
                )}

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
                    onStart(selected, trustProfile);
                    newConversationDialog.close("new-chat");
                  }}
                  disabled={selected.length === 0}
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
