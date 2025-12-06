// src/components/dispatch/DispatchEditorShell.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Heading, Spinner, Text, Flex, Button } from "@chakra-ui/react";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { DispatchDocument } from "./interfaces";
import TipTapEditor from "@components/editor/TipTapEditor";
import { useAutoSaveDispatchDoc } from "@hooks/editor/useAutoSaveDispatchDoc";
import { JSONContent } from "@tiptap/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useYjsSocketProvider } from "@/lib/dispatch/yjs/useYjsSocketProvider";
import { useSaveYjsState } from "@hooks/dispatch/useSaveYjsState";
import { TipTapDoc } from "@/types/dispatchTypes";
import ShareCollaboratorsModal from "./ShareCollaboratorsModal";
import { IconUsers, IconDeviceFloppy } from "@tabler/icons-react";

export default function DispatchEditorShell({ slug }: { slug: string }) {
  const [doc, setDoc] = useState<DispatchDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const latestContentRef = useRef<JSONContent | null>(null);

  const { user: identity, isLoading: identityLoading } = useAuth();

  // Initialize yjs socket provider for collaborative editing
  const { ydoc, provider, isReady } = useYjsSocketProvider(slug, {
    user: { name: identity?.profile?.display_name || "Anonymous", color: "#3498db" },
    enabled: !!identity && !identityLoading, // Only enable when identity is loaded
  });

  // Hook to save yjs state to backend
  const { saveYjsState, status: saveStatus, error: saveError } = useSaveYjsState(ydoc, slug);

  // Disable content autosave in collaborative mode (yjs handles sync)
  const autoSave = useAutoSaveDispatchDoc({
    documentSlug: slug,
    getContent: (): TipTapDoc => latestContentRef.current ?? { type: "doc", content: [] },
    isCollaborative: true, // All dispatch docs are collaborative
  });

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        console.log(" 🔍 Shell fetching document:", slug);
        const res = await axiosInstance.get(`/api/dispatch/documents/${slug}`);
        console.log(" 📄 Shell received document:", res.data);
        setDoc(res.data);
        setError(null);
      } catch (err) {
        console.error(" ❌ Shell failed to load document:", err);
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch the document if we have a slug and identity is loaded
    if (slug && !identityLoading) {
      fetchDoc();
    }
  }, [slug, identityLoading]);

  // Auto-save yjs state when navigating away or unmounting
  useEffect(() => {
    return () => {
      if (ydoc && slug) {
        console.log("💾 Auto-saving yjs state on unmount...");
        saveYjsState();
      }
    };
  }, [ydoc, slug, saveYjsState]);

  if (loading) {
    return (
      <Box p={10} textAlign="center">
        <Spinner />
        <Text mt={2} fontSize="sm" color="gray.500">Loading document...</Text>
      </Box>
    );
  }

  if (error || !doc) {
    return (
      <Box p={10} textAlign="center">
        <Text color="red.500">{error || "Document not found."}</Text>
      </Box>
    );
  }

  console.log(" 📄 Provider:", provider);
  console.log(" 📄 YDoc:", ydoc);
  console.log(" 📄 Awareness:", provider?.awareness);

  if (!ydoc || !provider || !provider.awareness) {
    return (
      <Box p={10} textAlign="center">
        <Spinner />
        <Text mt={2} fontSize="sm" color="gray.500">
          Connecting to collaborative editing…
        </Text>
      </Box>
    );
  }

  const collabReady = !!(provider && ydoc && provider.awareness);

  return (
    <Box maxW="6xl" mx="auto" py={10} px={4}>
      {/* Header with title, save, and share buttons */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">{doc.title}</Heading>
        <Flex gap={2}>
          <Button
            variant="solid"
            size="sm"
            onClick={saveYjsState}
            disabled={saveStatus === "saving"}
            colorPalette={saveStatus === "saved" ? "green" : saveStatus === "error" ? "red" : "blue"}
          >
            <IconDeviceFloppy size={18} style={{ marginRight: '6px' }} />
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Error" : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
          >
            <IconUsers size={18} style={{ marginRight: '6px' }} />
            Share
          </Button>
        </Flex>
      </Flex>

      {/* Share Modal */}
      <ShareCollaboratorsModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        documentSlug={slug}
      />

      {collabReady ? (
        <TipTapEditor
          initialContent={doc.content}
          autoSave={autoSave}
          onContentChange={(json) => {
            latestContentRef.current = json;
          }}
          collab={{
            ydoc: ydoc, // Pass the Y.Doc directly, not the provider
            // provider: provider, // Pass your custom provider
            awareness: provider.awareness,
            user: { name: identity?.profile?.display_name || "Anonymous", color: "#3498db" },
          }}
        />
      ) : (
        <TipTapEditor
          initialContent={doc.content}
          autoSave={autoSave}
          onContentChange={(json) => {
            latestContentRef.current = json;
          }}
        />
      )}
    </Box>
  );
}