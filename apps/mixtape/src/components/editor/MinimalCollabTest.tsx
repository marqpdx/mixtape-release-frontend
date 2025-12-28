// MinimalCollabTest.tsx - Bare minimum TipTap + Yjs test
// NO toolbar, NO custom extensions, NO complex memoization
// Purpose: Isolate why Y.Doc update events don't fire

"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { Box, Text } from "@chakra-ui/react";

export default function MinimalCollabTest() {
  const [ydoc] = useState(() => {
    console.log("🔧 Creating Y.Doc");
    const doc = new Y.Doc();

    // Listen for updates
    doc.on('update', (update: Uint8Array, origin: any) => {
      console.log("🔄 ✅ Y.Doc UPDATE EVENT FIRED!", {
        updateSize: update.length,
        origin: origin,
        clientID: doc.clientID
      });
    });

    return doc;
  });

  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const handler = () => {
      setUpdateCount(c => c + 1);
    };
    ydoc.on('update', handler);
    return () => ydoc.off('update', handler);
  }, [ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
        field: 'default',
      }),
    ],
    content: '<p>Type here to test Y.Doc updates...</p>',
    immediatelyRender: false, // Required for Next.js SSR
  });

  useEffect(() => {
    console.log("🎨 MinimalCollabTest mounted");
    console.log("📄 Y.Doc clientID:", ydoc.clientID);
    console.log("🔌 Editor:", editor);

    if (editor) {
      console.log("📋 Editor extensions:", editor.extensionManager.extensions.map(e => e.name));
    }
  }, [editor, ydoc]);

  if (!editor) {
    return <Text>Loading editor...</Text>;
  }

  return (
    <Box p={4} borderWidth="2px" borderColor="blue.500">
      <Text fontWeight="bold" mb={2}>
        Minimal Collab Test - Y.Doc Update Count: {updateCount}
      </Text>
      <Text fontSize="sm" mb={4} color={updateCount > 0 ? "green.500" : "red.500"}>
        {updateCount > 0
          ? `✅ Y.Doc is receiving updates! (${updateCount} total)`
          : "❌ No Y.Doc updates yet - type in the editor below"
        }
      </Text>
      <Box borderWidth="1px" p={4} bg="white">
        <EditorContent editor={editor} />
      </Box>
      <Text fontSize="xs" mt={2} color="gray.500">
        Y.Doc clientID: {ydoc.clientID}
      </Text>
    </Box>
  );
}
