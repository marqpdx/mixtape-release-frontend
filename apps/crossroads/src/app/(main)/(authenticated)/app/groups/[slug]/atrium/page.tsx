"use client";

import { use, useEffect } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

export default function GroupAtriumRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const bg = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      window.location.href = `${appUrl}/groups/${slug}/atrium`;
    }
  }, [slug]);

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bg}>
      <Spinner size="lg" />
    </Box>
  );
}
