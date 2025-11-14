// src/app/(root)/about/mixtape/vector-rag

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function LlmRagPage() {
  return (
    <ModuleLandingPage
      title="Large Language Models & Vector Search"
      paragraphs={[
        "We are experienced in integrating Large Language Models (LLMs) with vector databases to deliver advanced retrieval-augmented generation (RAG) systems. This empowers applications to combine conversational AI with precise domain-specific knowledge.",
        "Our solutions include custom embedding pipelines, semantic search with vector stores like Qdrant, and scalable APIs for deploying AI-powered features in production environments.",
      ]}
      bullets={[
        "Implementation of RAG systems combining LLMs with vector search.",
        "Experience with Qdrant, Pinecone, and other vector databases.",
        "Custom pipelines for domain-specific embeddings and hybrid search.",
      ]}
      ctaText="Discuss AI Integration"
      ctaLink="/contact"
    />
  );
}
