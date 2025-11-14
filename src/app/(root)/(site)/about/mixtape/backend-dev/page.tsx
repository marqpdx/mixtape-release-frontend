// src/app/(root)/about/mixtape/backend-dev

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function BackendDjangoPage() {
  return (
    <ModuleLandingPage
      title="Backend Development: Django & PostgreSQL"
      paragraphs={[
        "Our backend development expertise centers on Django, paired with PostgreSQL for scalable, relational data storage. We build secure, maintainable APIs, admin systems, and data pipelines tailored to real-world business needs.",
        "We’re experienced with advanced Django features like custom auth flows, complex model relationships, and integration with modern front-end frameworks.",
      ]}
      bullets={[
        "Design of RESTful APIs with Django REST Framework.",
        "Transactional integrity and complex query optimization in PostgreSQL.",
        "Advanced auth systems, including JWT and role-based permissions.",
      ]}
      ctaText="View Backend Solutions"
      ctaLink="/contact"
    />
  );
}


