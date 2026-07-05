"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, Container, HStack, Text } from "@chakra-ui/react";
import { IconChevronLeft } from "@tabler/icons-react";
import { GroupCapturesList } from "@/components/MediaCapture/GroupCapturesList";
import { GroupMemberHeader } from "@components/groups/headers/GroupMemberHeader";
import { useGroup } from "@mixtape/api/hooks/groups/useGroups";

export default function GroupScreencastsPage() {
  const { slug } = useParams();
  const groupSlug = Array.isArray(slug) ? slug[0] : (slug as string);
  const { group } = useGroup(groupSlug);

  return (
    <Box minH="100vh" className="mc-page-root">
      {group && <GroupMemberHeader group={group} />}
      <Container maxW="1100px" py={8} px={{ base: 4, md: 8 }}>
        <HStack gap={1} mb={5} color="fg.muted" fontSize="sm">
          <IconChevronLeft size={14} />
          <Link href={`/groups/${groupSlug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Text _hover={{ color: "fg" }} transition="color 0.15s">
              {group?.title ?? groupSlug}
            </Text>
          </Link>
          <Text color="fg.subtle">/</Text>
          <Text color="fg">Screencasts</Text>
        </HStack>
        <GroupCapturesList groupSlug={groupSlug} />
      </Container>
    </Box>
  );
}
