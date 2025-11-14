// src/app/(root)/about/mixtape/crossroads

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function CrossroadsPage() {
  return (
    <ModuleLandingPage
      title="Crossroads"
      paragraphs={[
        "Crossroads is Mixtape’s bustling community square where people gather, share updates, and discover connections. It’s built for vibrant communities that thrive on discussion, storytelling, and shared identity.",
        "Whether you’re running a professional network, a creative collective, or a grassroots movement, Crossroads gives you flexible spaces to organize groups, publish updates, and host events — all under one roof.",
      ]}
      bullets={[
        "Create public or private spaces for your groups.",
        "Host events and manage RSVPs directly inside the platform.",
        "Customize group pages to reflect your community’s personality.",
      ]}
      ctaText="Explore Crossroads"
      ctaLink="/join"
    />
  );
}
