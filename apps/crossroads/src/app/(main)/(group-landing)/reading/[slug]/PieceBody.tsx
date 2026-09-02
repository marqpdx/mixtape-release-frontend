"use client";

// PieceBody — client component wrapper for TipTapRenderer.
// Isolated here so the reading page itself stays a server component for SSR/SEO.

import { TipTapRenderer } from "@mixtape/content/TipTapRenderer";

interface Props {
  body_json: Record<string, unknown>;
}

export function PieceBody({ body_json }: Props) {
  return (
    <TipTapRenderer
      content={body_json as unknown as Parameters<typeof TipTapRenderer>[0]["content"]}
    />
  );
}
