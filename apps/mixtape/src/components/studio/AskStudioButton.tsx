"use client";

import { useState } from "react";
import { Box, Button, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  DialogBackdrop,
} from "@/components/ui/dialog";
import { WorkTableCommandField } from "@/components/worktable/WorkTableCommandField";
import type { WorkTableContext } from "@/components/worktable/types";

interface AskStudioButtonProps {
  groupId: string;
  groupSlug: string;
  groupTitle: string;
}

export function AskStudioButton({ groupId, groupSlug, groupTitle }: AskStudioButtonProps) {
  const [open, setOpen] = useState(false);
  const subtleBg = useColorModeValue("gray.50", "gray.900");

  const groupContext: WorkTableContext = {
    kind: "group",
    id: groupId,
    slug: groupSlug,
    title: groupTitle,
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        colorPalette="blue"
        onClick={() => setOpen(true)}
      >
        Ask Studio
      </Button>

      <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)} size="lg">
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask Studio</DialogTitle>
            <Text fontSize="xs" color="gray.500" mt={0.5}>
              Scoped to {groupTitle}
            </Text>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <Box bg={subtleBg} borderRadius="lg" p={4}>
              <WorkTableCommandField
                context={groupContext}
                onContextSwitch={() => {}}
                onContextReturn={() => setOpen(false)}
                onCapture={() => {}}
                onApertureCapture={() => {}}
                onHandover={() => {}}
              />
            </Box>
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
