// src/app/(root)/about/mixtape/cloud-devops

import ModuleLandingPage from "@components/about/ModuleLandingPage";

export default function CloudDevOpsPage() {
  return (
    <ModuleLandingPage
      title="Cloud Infrastructure & DevOps"
      paragraphs={[
        "Our teams deploy scalable applications across cloud environments, with infrastructure as code and robust monitoring solutions. We’re experienced in automating deployments, managing CI/CD pipelines, and ensuring high availability for mission-critical services.",
        "Our cloud solutions emphasize security, cost optimization, and operational transparency, enabling smooth deployments from development to production.",
      ]}
      bullets={[
        "Experience with AWS, DigitalOcean, CloudFlare, and private cloud deployments.",
        "Automated workflows using GitHub Actions and Docker.",
        "Monitoring and alerting for real-time visibility and incident response.",
      ]}
      ctaText="View Infrastructure Capabilities"
      ctaLink="/contact"
    />
  );
}
