// apps/mixtape/src/components/admin/AdminCardWrapper.tsx

"use client";

import { ReactNode, useState } from "react";
import { VStack, Text, Card, HStack } from "@chakra-ui/react";
// import { Button } from "@theme/recipes/button.recipe";
import AdminModal from "./AdminModal";
import { Button } from "@/theme/recipes/button.recipe";

interface AdminCardWrapperProps {
  title: string;
  modalTitle?: string;
  modalContent?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
}

export default function AdminCardWrapper({
  title,
  modalTitle,
  modalContent,
  onClick,
  children,
}: AdminCardWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasModal = Boolean(modalContent);

  return (
    <Card.Root>
      <Card.Header>
        <Text fontSize="lg" fontWeight="semibold">
          {title}
        </Text>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={4}>
          {children}
          {(onClick || hasModal) && (
            <HStack gap={3}>
              {onClick && (
                <Button size="sm" onClick={onClick}>
                  Open
                </Button>
              )}
              {hasModal && (
                <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
                  Preview
                </Button>
              )}
            </HStack>
          )}
        </VStack>
      </Card.Body>

      {hasModal && modalTitle && (
        <AdminModal
          title={modalTitle}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        >
          {modalContent}
        </AdminModal>
      )}
    </Card.Root>
  );
}
