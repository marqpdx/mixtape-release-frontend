import Link from "next/link";

import { siteConfig } from "@/site.config";

export function SiteHeader() {
  return (
    <header className="mals-header">
      <div className="mals-header-inner">
        <Link className="mals-wordmark" href="/">
          {siteConfig.wordmark}
        </Link>
        <nav className="mals-desktop-nav" aria-label="Primary navigation">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <details className="mals-mobile-menu">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            {siteConfig.nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
