// src/app/(root)/about/mixtape/loom-codex

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function LoomCodexPage() {
  return (
    <ModuleLandingPage
      title="Loom & Codex"
      paragraphs={[
        "Loom & Codex is Mixtape’s knowledge sanctuary, where communities weave together insights, guides, and collective wisdom. It’s more than a document store — it’s a living library built by and for your people.",
        "Organize wikis, store documents, and curate resources your members can rely on. Loom & Codex makes sure your community’s best ideas are easy to find, share, and evolve.",
      ]}
      bullets={[
        "Collaborative editing and content curation.",
        "Rich search across documents and posts.",
        "Link knowledge directly to people, groups, or projects.",
      ]}
      ctaText="Browse Loom & Codex"
      ctaLink="/join"
    />
  );
}
