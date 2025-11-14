// app/(root)/about/mixtape/frontend-ui

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function FrontendUIDesignPage() {
  return (
    <ModuleLandingPage
      title="Frontend UI & Design Systems"
      paragraphs={[
        "We specialize in building scalable, component-driven frontends using modern frameworks like React and Chakra UI v3. Our focus is on maintainable design systems that ensure consistency, accessibility, and performance across large applications.",
        "Our teams have extensive experience crafting responsive layouts, complex state management, and dynamic UI interactions. We’re adept at translating creative designs into robust code while maintaining pixel-perfect quality and excellent user experiences.",
      ]}
      bullets={[
        "Expertise in component libraries and theming using Chakra UI v3 and custom design systems.",
        "Accessibility-first approach ensuring WCAG compliance and inclusive interfaces.",
        "Seamless integration of animations and transitions for modern, engaging UI.",
      ]}
      ctaText="View Frontend Portfolio"
      ctaLink="/contact"
    />
  );
}
