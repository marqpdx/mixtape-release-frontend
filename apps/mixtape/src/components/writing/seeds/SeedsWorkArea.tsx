"use client";

import { Box, Heading, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { useSeedList } from "@/lib/writing/useSeedList";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import SeedList from "./SeedList";

export default function SeedsWorkArea() {
  const { seeds, loading, error, refetch } = useSeedList(20);

  const handlePromote = async (seedId: string) => {
    try {
      await axiosInstance.post(`/api/writing/seeds/${seedId}/promote`, {});
    } catch (err) {
      console.error(err);
    } finally {
      refetch();
    }
  };

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg">Seeds</Heading>
        <Text color="fg.muted">
          Quick idea motes you can later uplift into real content.
        </Text>
      </Box>

      {loading && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading seeds...</Text>
        </HStack>
      )}

      {error && <Text color="red.600">{error}</Text>}

      {!loading && (
        <SeedList
          seeds={seeds}
          showPromote
          onPromote={handlePromote}
        />
      )}
    </Stack>
  );
}
