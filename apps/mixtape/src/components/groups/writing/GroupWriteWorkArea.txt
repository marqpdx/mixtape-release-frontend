'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { createStandaloneToast } from '@chakra-ui/toast';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import type { WritingPiece } from './interfaces';
import { useGetIdentity } from '@refinedev/core';
import { UserIdentity } from '@components/auth/interfaces';
import { useTempSocketProvider } from 'lib/dispatch/yjs/useTempSocketProvider';
import GroupWriteComposer from './GroupWriteComposer';

const { toast } = createStandaloneToast();

export default function GroupWriteWorkArea({
  pieceId,
  groupSlug,
  onClose,
  collabEnabled = true,
}: {
  pieceId: string;
  groupSlug: string;
  onClose?: () => void;
  collabEnabled?: boolean;
}) {

  if (!pieceId) {
    return <Box p={6}><Text color="red.500">Missing pieceId.</Text></Box>;
  }
  const [initialPiece, setInitialPiece] = useState<WritingPiece | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: identity, isLoading: identityLoading } = useGetIdentity<UserIdentity>();

  const slugForRoom = `${groupSlug}:${pieceId}`; // room key
  const { ydoc, provider, isReady } = useTempSocketProvider(slugForRoom, {
    user: { name: identity?.profile?.display_name || 'Anonymous', color: '#3498db' },
    enabled: collabEnabled && !!identity && !identityLoading,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/writing/pieces/${pieceId}`);
        if (!mounted) return;
        setInitialPiece(res.data);
      } catch (e: any) {
        toast({ title: 'Failed to load draft', description: e?.message, status: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [pieceId]);

  if (loading) {
    return (
      <Box p={6}>
        <VStack><Text>Loading…</Text></VStack>
      </Box>
    );
  }

  const collab = useMemo(() => {
    if (!collabEnabled) return undefined;
    if (!ydoc || !provider?.awareness) return undefined;
    return {
      ydoc,
      awareness: provider.awareness,
      user: { name: identity?.profile?.display_name || 'Anonymous', color: '#3498db' },
    };
  }, [collabEnabled, ydoc, provider?.awareness, identity?.profile?.display_name]);


  if (!initialPiece) {
    return (
      <Box p={6}>
        <VStack><Text>Draft not found.</Text></VStack>
      </Box>
    );
  }



  return (
    <Box w="100%" h="80vh" overflow="hidden">
      <GroupWriteComposer groupSlug={groupSlug} pieceId={pieceId} initialPiece={initialPiece} /* no changes needed */ />
      {/* If you want the composer to receive collab and forward it to GroupMainEditor,
          add a "collab" prop on GroupWriteComposer and thread it down. */}
    </Box>
  );
}
