import Link from "next/link";

import { siteConfig } from "@/site.config";

export function SiteFooter() {
  return (
    <footer className="mals-footer">
      <div className="mals-footer-inner">
        <p>{siteConfig.name} / Wor(l)ds Online</p>
        <p>
          Writing held with care. Built with{" "}
          <Link href="https://crossroads.place">Crossroads</Link>.
        </p>
      </div>
    </footer>
  );
}
