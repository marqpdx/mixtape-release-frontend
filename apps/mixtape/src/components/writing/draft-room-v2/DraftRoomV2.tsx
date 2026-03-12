// components/writing/draft-room-v2/DraftRoomV2.tsx
//
// Three-pane writing workspace:
//   Left (250px)  — Draft Queue
//   Center (flex)  — Embedded Editor
//   Right (320px)  — Inspector / Back Room

"use client";

import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useDraftRoom } from "./useDraftRoom";
import { DraftQueue } from "./DraftQueue";
import { DraftEditor, DraftEditorEmpty } from "./DraftEditor";
import { DraftInspector } from "./DraftInspector";

interface SponsorConfig {
  type: "member";
  id: string;
  slug: string;
  displayName: string;
}

interface DraftRoomV2Props {
  sponsor: SponsorConfig;
}

export default function DraftRoomV2({ sponsor }: DraftRoomV2Props) {
  const {
    drafts,
    draftsLoading,
    selectedPieceId,
    piece,
    pieceLoading,
    selectPiece,
    title,
    setTitle,
    docJSON,
    setDocJSON,
    excerpt,
    setExcerpt,
    createDraft,
    refetchDrafts,
  } = useDraftRoom(sponsor);

  const bg = useColorModeValue("white", "gray.950");

  const hasBody = Boolean(
    docJSON &&
    Array.isArray(docJSON.content) &&
    (docJSON.content as Record<string, unknown>[]).length > 0
  );

  return (
    <Flex
      h="calc(100vh - 120px)"
      bg={bg}
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={useColorModeValue("gray.200", "gray.700")}
    >
      {/* Left: Draft Queue */}
      <Box w="250px" flexShrink={0}>
        <DraftQueue
          drafts={drafts}
          isLoading={draftsLoading}
          selectedPieceId={selectedPieceId}
          onSelect={selectPiece}
          onNewDraft={createDraft}
        />
      </Box>

      {/* Center: Editor */}
      <Box flex="1" minW={0}>
        {pieceLoading ? (
          <VStack h="100%" justify="center">
            <Spinner size="lg" />
            <Text fontSize="sm" color="gray.500">Loading draft...</Text>
          </VStack>
        ) : piece && selectedPieceId ? (
          <DraftEditor
            key={selectedPieceId}
            pieceId={selectedPieceId}
            title={title}
            docJSON={docJSON}
            excerpt={excerpt}
            onTitleChange={setTitle}
            onDocChange={setDocJSON}
            onExcerptChange={setExcerpt}
          />
        ) : (
          <DraftEditorEmpty />
        )}
      </Box>

      {/* Right: Inspector */}
      {piece && selectedPieceId && (
        <Box w="320px" flexShrink={0}>
          <DraftInspector
            key={selectedPieceId}
            piece={piece}
            title={title}
            excerpt={excerpt}
            docJSON={docJSON as Record<string, unknown> | null}
            hasBody={hasBody}
            sponsor={sponsor}
            onPublished={refetchDrafts}
          />
        </Box>
      )}
    </Flex>
  );
}
