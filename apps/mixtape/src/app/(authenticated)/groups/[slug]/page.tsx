// apps/mixtape/src/app/(authenticated)/groups/[slug]/page.tsx

"use client";

import { useParams } from "next/navigation";
import { GroupPageCore } from "@/components/groups/GroupPageCore";

export default function GroupPage() {
  const { slug } = useParams();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);
  return <GroupPageCore slug={slugStr} />;
}
