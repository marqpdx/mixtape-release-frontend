// apps/mixtape/src/app/(authenticated)/groups/[slug]/me/page.tsx

"use client";

import { useParams } from "next/navigation";
import { Box, Button, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import MemberProfileEdit from "@components/dashboard/member/MemberProfileEdit";

export default function GroupMePage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  return (
    <Box maxW="4xl" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <HStack mb={6}>
        <Button asChild size="sm" variant="outline" colorPalette="gray">
          <Link as={NextLink} href={`/groups/${slug}`}>
            <IconArrowLeft size={14} />
            Return to Group
          </Link>
        </Button>
      </HStack>

      <MemberProfileEdit />
    </Box>
  );
}
