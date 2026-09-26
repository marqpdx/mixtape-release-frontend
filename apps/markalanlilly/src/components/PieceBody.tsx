"use client";

import { TipTapRenderer } from "@mixtape/content/TipTapRenderer";

export function PieceBody({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="mals-piece-body">
      <TipTapRenderer
        content={
          content as unknown as Parameters<typeof TipTapRenderer>[0]["content"]
        }
      />
    </div>
  );
}
