import type { PublicSiteWritingResponse } from "@mixtape/api/clients/public/publicApi";

import { CatalogSidebar } from "@/components/CatalogSidebar";

interface CatalogLayoutProps {
  children: React.ReactNode;
  facets: PublicSiteWritingResponse["facets"];
}

export function CatalogLayout({ children, facets }: CatalogLayoutProps) {
  return (
    <div className="mals-catalog-layout">
      <main className="mals-catalog-main">{children}</main>
      <CatalogSidebar facets={facets} />
    </div>
  );
}
