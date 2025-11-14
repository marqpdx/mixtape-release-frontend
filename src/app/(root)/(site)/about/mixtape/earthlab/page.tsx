// src/app/(root)/about/mixtape/earthlab

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function EarthLabPage() {
  return (
    <ModuleLandingPage
      title="EarthLab"
      paragraphs={[
        "EarthLab bridges the digital and physical worlds by blending online learning with real-life experiences. It’s where communities create hybrid courses, organize local gatherings, and turn ideas into action.",
        "From workshops to research projects to cultural meetups, EarthLab makes it easy to go from reading about change to making it happen. It’s 'learn online, act offline.'",
      ]}
      bullets={[
        "Build hybrid courses with digital and physical components.",
        "Organize local gatherings, workshops, and study groups.",
        "Connect EarthLab activities directly to Circles for ongoing collaboration.",
      ]}
      ctaText="Enter EarthLab"
      ctaLink="/join"
    />
  );
}
