import type { PublicWritingTag } from "@mixtape/api/clients/public/publicApi";

export function PublicWritingTags({ tags = [] }: { tags?: PublicWritingTag[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="pwt-tags" aria-label="Tags" style={{ display: "flex", flexWrap: "wrap", gap: "6px", listStyle: "none", padding: 0, margin: "10px 0 0", fontSize: "0.75rem", lineHeight: 1.5, color: "var(--theme-text-secondary)" }}>
      {tags.map((tag) => (
        <li key={tag.slug} style={{ border: "1px solid var(--theme-border)", borderRadius: "4px", padding: "2px 8px", overflowWrap: "anywhere" }}>{tag.title}</li>
      ))}
    </ul>
  );
}
