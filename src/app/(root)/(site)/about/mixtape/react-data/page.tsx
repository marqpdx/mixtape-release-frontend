// src/app/(root)/about/mixtape/react-data

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function ReactDataPage() {
  return (
    <ModuleLandingPage
      title="React & Data Fetching Patterns"
      paragraphs={[
        "We have deep proficiency in building data-driven applications using React and modern query libraries. Our teams implement advanced caching strategies, optimized API consumption, and efficient state management for high-performance single-page apps.",
        "We excel at integrating frontends with REST APIs, GraphQL, and custom backend services, ensuring seamless user experiences even across complex data interactions.",
      ]}
      bullets={[
        "Experience with Refine.dev, React Query, SWR, and Axios for advanced data fetching.",
        "Custom hooks for encapsulating reusable data logic and API interactions.",
        "Pattern-based approaches for error handling, retries, and offline support.",
      ]}
      ctaText="Discuss React Projects"
      ctaLink="/contact"
    />
  );
}
