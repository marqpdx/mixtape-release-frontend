// groups/announcements/QuickAnnouncementCreate.tsx
// Quick-create dialog for admins/stewards — title, content, priority only.
// Full form (expiry, CTA, notification) lives in the admin work area.
"use client";

import { useState } from "react";
import { Box, Flex, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconMegaphone } from "@tabler/icons-react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogCloseTrigger,
  DialogTrigger,
  DialogBackdrop,
} from "@/components/ui/dialog";
import {
  createAnnouncement,
  type AnnouncementPriority,
} from "@mixtape/api/clients/group/announcementApi";
import { toaster } from "@mixtape/core/lib/toaster";
import { announcementsQueueKey } from "./AnnouncementViewBox";

interface Props {
  groupSlug: string;
}

export function QuickAnnouncementCreate({ groupSlug }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");

  const mutation = useMutation({
    mutationFn: () =>
      createAnnouncement(groupSlug, {
        title: title.trim(),
        content: content.trim(),
        priority,
        expires_at: null,
        cta_text: "",
        cta_url: "",
        also_send_notification: false,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementsQueueKey(groupSlug) });
      setTitle("");
      setContent("");
      setPriority("normal");
      setOpen(false);
      toaster.success({ title: "Announcement posted" });
    },
    onError: () => toaster.error({ title: "Could not post announcement" }),
  });

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  return (
    <DialogRoot
      open={open}
      onOpenChange={(d) => setOpen(d.open)}
      lazyMount
      unmountOnExit
    >
      <DialogBackdrop />
      <DialogTrigger asChild>
        <Box
          className="gld-announce-btn"
          as="button"
          display="flex"
          alignItems="center"
          gap="6px"
          px="12px"
          py="6px"
          borderRadius="10px"
          bg="theme.accentSoft"
          color="theme.accent"
          fontSize="13px"
          fontWeight="600"
          cursor="pointer"
          _hover={{ opacity: 0.85 }}
          transition="opacity 0.12s"
          flexShrink={0}
        >
          <IconMegaphone size={15} />
          Announce
        </Box>
      </DialogTrigger>

      <DialogContent maxW="480px" borderRadius="18px" bg="theme.surface">
        <DialogCloseTrigger />
        <DialogHeader pb={2}>
          <DialogTitle fontSize="17px" fontWeight="700" color="theme.text">
            New Announcement
          </DialogTitle>
        </DialogHeader>
        <DialogBody pb={5}>
          <Stack gap={3}>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="theme.textSecondary" mb={1}>
                Title
              </Text>
              <Input
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="What do members need to know?"
                bg="theme.bg"
                borderColor="theme.border"
                _focus={{ borderColor: "theme.accent", boxShadow: "none" }}
              />
            </Box>

            <Box>
              <Text fontSize="13px" fontWeight="600" color="theme.textSecondary" mb={1}>
                Content
              </Text>
              <Textarea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                placeholder="Announcement body…"
                rows={4}
                bg="theme.bg"
                borderColor="theme.border"
                _focus={{ borderColor: "theme.accent", boxShadow: "none" }}
                resize="vertical"
              />
            </Box>

            <Box>
              <Text fontSize="13px" fontWeight="600" color="theme.textSecondary" mb={1}>
                Priority
              </Text>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "10px",
                  border: "1px solid var(--chakra-colors-theme-border, #ddd)",
                  background: "var(--chakra-colors-theme-bg, #fff)",
                  color: "var(--chakra-colors-theme-text, #222)",
                  fontSize: "14px",
                  width: "100%",
                }}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Box>

            <Flex justify="flex-end" pt={1}>
              <Box
                as="button"
                px="18px"
                py="8px"
                borderRadius="10px"
                bg="theme.accent"
                color="white"
                fontSize="14px"
                fontWeight="600"
                cursor={!canSubmit || mutation.isPending ? "not-allowed" : "pointer"}
                opacity={!canSubmit || mutation.isPending ? 0.55 : 1}
                transition="opacity 0.12s"
                _hover={canSubmit && !mutation.isPending ? { opacity: 0.88 } : {}}
                onClick={() => {
                  if (canSubmit && !mutation.isPending) mutation.mutate();
                }}
              >
                {mutation.isPending ? "Posting…" : "Post"}
              </Box>
            </Flex>
          </Stack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
