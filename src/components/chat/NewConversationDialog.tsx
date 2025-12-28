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
} from "@chakra-ui/react";
import { useState } from "react";

interface NewConversationDialogProps {
  title: string;
  allMembers: UserIdentity[];
  onStart: (usernames: string[]) => void;
}

export const newConversationDialog = createOverlay<NewConversationDialogProps>(
  ({ title, allMembers, onStart, ...rest }) => {
    const [selected, setSelected] = useState<string[]>([]);

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
              w={{ base: "90%", sm: "400px" }}
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
                  <Stack gap="3" maxH="300px" overflowY="auto">
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
                    onStart(selected);
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
