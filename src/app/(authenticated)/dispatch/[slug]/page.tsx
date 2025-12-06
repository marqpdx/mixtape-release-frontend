// src/app/(protected)/dispatch/[slug]/page.tsx

"use client";

import { use } from "react";
import DispatchEditorShell from "@components/dispatch/DispatchEditorShell";

export default function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = use(props.params);
  return <DispatchEditorShell slug={slug} />;
}
