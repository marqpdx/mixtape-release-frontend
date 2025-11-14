// src/app/(root)/about/mixtape/livewire

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function LivewirePage() {
  return (
    <ModuleLandingPage
      title="Livewire"
      paragraphs={[
        "Livewire powers real-time conversations across Mixtape, connecting members instantly through chat, direct messages, and dynamic group threads. It’s the heartbeat of fast, fluid communication.",
        "To keep communities safe and intentional, Livewire is available to members who’ve been invited or joined through a gentle onboarding process. Once inside, conversations happen in real time and stay organized for future reference.",
      ]}
      bullets={[
        "Real-time chat for individuals and groups.",
        "Threaded discussions to keep context clear.",
        "Integration with Circles for project-based conversations.",
      ]}
      ctaText="Learn How to Join Mixtape"
      ctaLink="/join"
    />
  );
}
