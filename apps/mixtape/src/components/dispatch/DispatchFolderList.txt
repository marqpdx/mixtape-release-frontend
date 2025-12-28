// src/components/dispatch/DispatchFolderList.tsx

"use client";

import React from "react";
import { Box, Heading, VStack } from "@chakra-ui/react";
import DispatchDocumentCard from "./DispatchDocumentCard";
import { DispatchDocument } from "./interfaces";

interface DispatchFolderListProps {
  documents: DispatchDocument[];
  onDocumentClick?: (slug: string) => void;
}

const groupByFolder = (docs: DispatchDocument[]) => {
  const grouped: Record<string, DispatchDocument[]> = {};
  docs.forEach((doc) => {
    const folder = doc.folder || "Uncategorized";
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(doc);
  });
  return grouped;
};

export default function DispatchFolderList({ documents, onDocumentClick }: DispatchFolderListProps) {
  const groupedDocs = groupByFolder(documents);

  return (
    <VStack align="stretch" gap={6}>
      {Object.entries(groupedDocs).map(([folder, docs]) => (
        <Box key={folder}>
          <Heading size="md" mb={3}>{folder}</Heading>
          <VStack align="stretch" gap={4}>
            {docs.map((doc) => (
              <DispatchDocumentCard
                key={doc.id}
                document={doc}
                onClick={onDocumentClick}
              />
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
}
