// src/app/(protected)/dispatch/author/[slug]/page.tsx

import { Box } from "@chakra-ui/react";
import TipTapEditor from "@components/editor/TipTapEditor";
// import TipTapEditor from "@components/author/TipTapEditor";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <Box>
      <h1>Author Pagdddxe forddddddd {slug}</h1>
      {/* <TipTapCollaborativeEditor roomId={slug} username="Author" /> */}
      <TipTapEditor />
    </Box>
  );
}
