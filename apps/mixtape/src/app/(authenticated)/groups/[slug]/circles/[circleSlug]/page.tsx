// apps/mixtape/src/app/(authenticated)/groups/[slug]/circles/[circleSlug]/page.tsx
// Circle page: /groups/{parentSlug}/circles/{circleSlug}
// GroupPageCore fetches the circle by slug; CircleParentBar reads sponsor_group
// to render the back link to the parent group.

"use client";

import { useParams } from "next/navigation";
import { GroupPageCore } from "@/components/groups/GroupPageCore";

export default function CirclePage() {
  const { circleSlug } = useParams();
  const circleSlugStr = Array.isArray(circleSlug) ? circleSlug[0] : (circleSlug as string);
  return <GroupPageCore slug={circleSlugStr} />;
}
