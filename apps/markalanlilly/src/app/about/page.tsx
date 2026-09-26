import type { Metadata } from "next";
import Image from "next/image";

import { CatalogLayout } from "@/components/CatalogLayout";
import { PieceBody } from "@/components/PieceBody";
import { StateNotice } from "@/components/StateNotice";
import { loadCatalog, loadProfile } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const [catalog, profile] = await Promise.all([
    loadCatalog({ limit: 1 }),
    loadProfile(),
  ]);

  if (!catalog.data) return <StateNotice>{catalog.error}</StateNotice>;

  return (
    <CatalogLayout facets={catalog.data.facets}>
      <article className="mals-section mals-about-page">
        <div className="mals-section-heading">
          <p>A person among people</p>
          <h1>About</h1>
        </div>
        <div className="mals-about-lede">
          <div>
            <p className="mals-large-copy">
              {profile.data?.quick_intro ||
                "I am another human trying to make the best of a complicated and beautiful world."}
            </p>
            <p>
              My work has moved through service, trauma, healing, technology,
              community, knowledge, and the practical question of how we help
              one another remain capable and alive to possibility.
            </p>
          </div>
          <div className="mals-about-image">
            <Image
              src="/images/flowers-banner.jpg"
              alt="Orange flowers in summer light"
              fill
              sizes="(max-width: 720px) 100vw, 34vw"
            />
          </div>
        </div>
        {profile.data?.bio_json && (
          <div className="mals-about-body">
            <PieceBody content={profile.data.bio_json} />
          </div>
        )}
        {profile.error && <StateNotice>{profile.error}</StateNotice>}
      </article>
    </CatalogLayout>
  );
}
