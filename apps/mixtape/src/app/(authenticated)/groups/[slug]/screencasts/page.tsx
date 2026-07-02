"use client";

import { useParams } from "next/navigation";
import { Box, Container } from "@chakra-ui/react";
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
        <GroupCapturesList groupSlug={groupSlug} />
      </Container>
    </Box>
  );
}
