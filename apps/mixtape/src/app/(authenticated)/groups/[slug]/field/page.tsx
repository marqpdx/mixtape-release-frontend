"use client";

import { use } from "react";
import { FieldSurface } from "@/components/field/FieldSurface";

export default function GroupFieldPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <FieldSurface groupSlug={slug} />;
}
