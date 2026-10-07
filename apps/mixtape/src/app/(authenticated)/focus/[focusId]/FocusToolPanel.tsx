"use client";

// Focus-Centered Writing ADR, Phase 2, FCW-7: the selection row tools'
// panel. Shape and Meta reuse the Draft Room components exactly
// (AtelierShapeTab, AtelierMetaTab) per the ADR's "reuse, don't fork"
// constraint (§5) -- this component is the Focus view's own thin
// orchestration layer around them (fetch the piece, hold tool state,
// persist Meta/tags/categories), not a fork of their internals.
//
// Edit and Sections are placeholders here on purpose: their real behavior
// is FCW-8 (Edit instrument -- full-screen Page + Focus trail + Done) and
// FCW-9 (Sections instrument -- Draft <-> Dispatch reused as a Focus
// instrument), not this checkpoint.

import { useEffect, useState } from "react";
import { Box, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { TipTapRenderer, type TipTapDocument } from "@components/tiptap/TipTapRenderer";
import AtelierShapeTab from "@components/writing/draft-room/AtelierShapeTab";
import AtelierMetaTab from "@components/writing/draft-room/AtelierMetaTab";
import { Tag } from "@components/writing/composer/TagInput";
import { Category } from "@components/writing/composer/CategoryInput";

export type FocusTool = "edit" | "shape" | "meta" | "sections" | "preview";

interface PieceDetail {
  id: string;
  title: string;
  excerpt: string;
  body_json: Record<string, unknown> | null;
  writing_kind?: string;
  addressed_to?: string;
}

function usePieceDetail(pieceId: string | null) {
  const [detail, setDetail] = useState<PieceDetail | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pieceId) {
      setDetail(null);
      setTags([]);
      setCategories([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    Promise.all([
      axiosInstance.get(`/api/writing/pieces/${pieceId}`).then((res) => res.data as PieceDetail),
      axiosInstance.get(`/api/writing/pieces/${pieceId}/tags`).then((res) => (res.data || []) as Tag[]).catch(() => []),
      axiosInstance.get(`/api/writing/pieces/${pieceId}/categories`).then((res) => (res.data || []) as Category[]).catch(() => []),
    ])
      .then(([pieceDetail, pieceTags, pieceCategories]) => {
        if (!mounted) return;
        setDetail(pieceDetail);
        setTags(pieceTags);
        setCategories(pieceCategories);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [pieceId]);

  return { detail, tags, setTags, categories, setCategories, loading };
}

function FocusShapeTool({ pieceId }: { pieceId: string }) {
  const { detail, tags, setTags, categories, setCategories, loading } = usePieceDetail(pieceId);

  if (loading || !detail) return <Skeleton height="200px" />;

  const persistTags = (next: Tag[]) => {
    setTags(next);
    void axiosInstance.put(`/api/writing/pieces/${pieceId}/tags`, {
      tag_ids: next.map((t) => t.id),
    });
  };
  const persistCategories = (next: Category[]) => {
    setCategories(next);
    void axiosInstance.put(`/api/writing/pieces/${pieceId}/categories`, {
      category_ids: next.map((c) => c.id),
    });
  };

  return (
    <AtelierShapeTab
      pieceId={pieceId}
      initialTags={tags}
      initialCategories={categories}
      onTagsChange={persistTags}
      onCategoriesChange={persistCategories}
      pieceTitle={detail.title}
      writingKind={detail.writing_kind}
      excerpt={detail.excerpt}
    />
  );
}

function FocusMetaTool({ pieceId }: { pieceId: string }) {
  const { detail, loading } = usePieceDetail(pieceId);
  const [title, setTitle] = useState("");
  const [addressedTo, setAddressedTo] = useState("public");
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!detail) return;
    setTitle(detail.title || "");
    setAddressedTo(detail.addressed_to || "public");
  }, [detail]);

  if (loading || !detail) return <Skeleton height="120px" />;

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/api/writing/pieces/${pieceId}`, {
        title,
        addressed_to: addressedTo,
      });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2750);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AtelierMetaTab
      title={title}
      onTitleChange={setTitle}
      addressedTo={addressedTo}
      onAddressedToChange={setAddressedTo}
      onSave={() => void handleSave()}
      saving={saving}
      showTitleSaved={showSaved}
    />
  );
}

function FocusPreviewTool({ pieceId }: { pieceId: string }) {
  const { detail, loading } = usePieceDetail(pieceId);
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  if (loading || !detail) return <Skeleton height="200px" />;
  if (!detail.body_json) {
    return <Text color={mutedColor}>No content yet.</Text>;
  }
  return <TipTapRenderer content={detail.body_json as unknown as TipTapDocument} />;
}

function FocusComingSoonTool({ label, nextCheckpoint }: { label: string; nextCheckpoint: string }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  return (
    <Text color={mutedColor} fontSize="sm">
      The {label} instrument arrives in {nextCheckpoint}. Use &quot;Open in Draft Room&quot; from the classic
      surfaces for now.
    </Text>
  );
}

export default function FocusToolPanel({
  tool,
  pieceId,
}: {
  tool: FocusTool;
  pieceId: string;
  pieceSlug: string;
}) {
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box className="focus-tool-panel" borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
      <VStack align="stretch" gap={3}>
        {tool === "shape" && <FocusShapeTool pieceId={pieceId} />}
        {tool === "meta" && <FocusMetaTool pieceId={pieceId} />}
        {tool === "preview" && <FocusPreviewTool pieceId={pieceId} />}
        {tool === "edit" && <FocusComingSoonTool label="Edit" nextCheckpoint="FCW-8" />}
        {tool === "sections" && <FocusComingSoonTool label="Sections" nextCheckpoint="FCW-9" />}
      </VStack>
    </Box>
  );
}
