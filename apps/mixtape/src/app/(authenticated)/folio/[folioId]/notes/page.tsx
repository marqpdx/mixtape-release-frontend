"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Text } from "@chakra-ui/react";
import { useFolios } from "@mixtape/api/hooks/folio";
import FolioWorkbench from "@/components/folio/workbench/FolioWorkbench";

// The route segment accepts a stable slug. Legacy UUID bookmarks are replaced
// with their canonical slug URL after resolving against the writer's own Folios.
// API operations continue to use the immutable UUID internally.
export default function FolioWorkbenchPage({ params }: { params: Promise<{ folioId: string }> }) {
  const { folioId: identifier } = use(params);
  const router = useRouter();
  const { data: folios = [], isLoading, isError } = useFolios();
  const folio = folios.find((item) => item.id === identifier) ?? folios.find((item) => item.slug === identifier);
  useEffect(() => {
    if (folio?.slug && identifier !== folio.slug) router.replace(`/folio/${folio.slug}/notes`);
  }, [folio?.slug, identifier, router]);
  if (isLoading) return <Box className="fwr-loading" p={6}><Text>Loading Folio…</Text></Box>;
  if (isError) return <Box className="fwr-error" p={6}><Text>Could not load your Folios. Refresh to try again.</Text></Box>;
  if (!folio) return <Box className="fwr-missing" p={6}><Text>Folio not found.</Text></Box>;
  return <FolioWorkbench key={folio.id} folioId={folio.id} />;
}
