// src/app/(root)/about/mixtape/constellation

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function ConstellationPage() {
  return (
    <ModuleLandingPage
      title="Constellation"
      paragraphs={[
        "Constellation reveals the hidden threads connecting people, ideas, and projects inside your community. It transforms relationships into stunning visual networks that help you see your ecosystem’s true shape.",
        "More than just pretty visuals, Constellation helps identify key connectors, emerging collaborations, and potential new alliances. It’s your map to unlock hidden potential.",
      ]}
      bullets={[
        "Visualize how people and ideas intersect.",
        "Explore dynamic graphs with interactive filtering.",
        "Find new relationships and collaborative pathways.",
      ]}
      ctaText="View Constellation"
      ctaLink="/join"
    />
  );
}
