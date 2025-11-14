// src/app/(root)/about/mixtape/websockets-realtime

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function WebsocketsRealtimePage() {
  return (
    <ModuleLandingPage
      title="Websockets & Real-Time Systems"
      paragraphs={[
        "We build modern applications that require real-time communication and collaboration. Our team leverages technologies like Socket.io and WebSockets to create interactive experiences that keep users connected and data synchronized.",
        "Our projects include real-time chat systems, collaborative document editing, presence indicators, and live data dashboards, all designed to scale and handle high concurrency.",
      ]}
      bullets={[
        "Socket.io expertise for scalable real-time messaging systems.",
        "Efficient event handling for collaborative features.",
        "Robust reconnection logic and connection state management.",
      ]}
      ctaText="Explore Real-Time Solutions"
      ctaLink="/contact"
    />
  );
}
