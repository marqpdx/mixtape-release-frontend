// src/components/groups/writing/GroupWriteComposer.tsx

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, HStack, VStack, IconButton, Button, Textarea, Accordion } from '@chakra-ui/react';
import { createStandaloneToast } from '@chakra-ui/toast';
import { IconSparkles } from '@tabler/icons-react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';

import { DestinationsPicker } from './controls/DestinationsPicker';
import { PlacementSummary } from './controls/PlacementSummary';

import GroupMainEditor, { GroupMainEditorHandle } from './editor/GroupMainEditor';
import GroupTitleInput from './controls/GroupTitleInput';

import type {
  PublishAndPlacePayload,
  PublishDestinations,
  PlacementOptions,
  GroupOverridesMap,
  WritingPiece,
} from './interfaces';

import { useWorkingCopyAutosave } from 'lib/writing/useWorkingCopyAutosave';

const { toast } = createStandaloneToast();

let renderCount = 0;

type Props = {
  pieceId: string;
  initialPiece: WritingPiece;
  groupSlug: string;
  defaultWorkspaceOpen?: boolean;
  autosaveDebounceMs?: number;
  autoFocus?: boolean;
};

export default function GroupWriteComposer({
  pieceId,
  initialPiece,
  groupSlug,
  defaultWorkspaceOpen = false,
  autosaveDebounceMs = 2500,
  autoFocus = true,
}: Props) {
  // renderCount++;
  // console.log(`MINIMAL GroupWriteComposer render #${renderCount}`);


  const editorRef = useRef<GroupMainEditorHandle | null>(null);

  // Local state for editing
  const [title, setTitle] = useState<string>(initialPiece?.title || '');
  const [docJSON, setDocJSON] = useState<any>(initialPiece?.body_json || { type: 'doc', content: [] });
  const [excerpt, setExcerpt] = useState<string>(initialPiece?.excerpt || '');
  const [writingKind, setWritingKind] = useState<string>(initialPiece?.writing_kind || 'post');

  console.log(`📝  Current state:`, { title, docJSON, excerpt });

  // Publishing state
  const [dests, setDests] = useState<PublishDestinations>({ personal: true, groups: [], lantern: false });
  const [opts, setOpts] = useState<PlacementOptions>({ visibility: 'public' });
  const [groupOverrides, setGroupOverrides] = useState<GroupOverridesMap>({});

  // UI state
  const [workspaceOpen, setWorkspaceOpen] = useState(defaultWorkspaceOpen);
  const [isPublishing, setIsPublishing] = useState(false);


    // Create refs to hold current values
  const titleRef = useRef(title);
  const docJSONRef = useRef(docJSON);
  const excerptRef = useRef(excerpt);

  // Update refs when state changes
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { docJSONRef.current = docJSON; }, [docJSON]);
  useEffect(() => { excerptRef.current = excerpt; }, [excerpt]);

  // Autosave hook
  const { schedule, saveNow, saveStatus: autosaveStatus } = useWorkingCopyAutosave(pieceId, autosaveDebounceMs);

  // console.log(`💾 Autosave status:`, autosaveStatus);

  // useEffect(() => {
  //   console.log(`🔄 Component rendered with pieceId: ${pieceId}`);
  // });


  // ONE-TIME initialization of working copy (only when component first mounts)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!pieceId || hasInitialized.current) return;

    hasInitialized.current = true;
    console.log('🎯 One-time working copy initialization for piece:', pieceId);

    saveNow({
      title: initialPiece?.title || '',
      body_json: initialPiece?.body_json || { type: 'doc', content: [] },
      excerpt: initialPiece?.excerpt || ''
    }).catch((e) => {
      console.error('❌ Failed to initialize working copy:', e);
    });
  }, [pieceId, saveNow]); // Only pieceId and saveNow as dependencies


  const onTitleChange = useCallback((newTitle: string) => {
    console.log(`📝 Title changing to: "${newTitle}"`);
    setTitle(newTitle);
    schedule({
      title: newTitle,
      body_json: docJSONRef.current,
      excerpt: excerptRef.current
    });
  }, [schedule]);

  const onDocChange = useCallback((newDoc: any) => {
    console.log(`📄 Doc changing`);
    setDocJSON(newDoc);
    schedule({
      title: titleRef.current,
      body_json: newDoc,
      excerpt: excerptRef.current
    });
  }, [schedule]);

  const onExcerptChange = useCallback((newExcerpt: string) => {
    setExcerpt(newExcerpt);
    schedule({
      title: titleRef.current,
      body_json: docJSONRef.current,
      excerpt: newExcerpt
    });
  }, [schedule]);

  // Apply working copy to canonical piece (save as draft)
  const handleSaveDraft = useCallback(async () => {
    try {
      console.log('💾 Applying working copy to piece:', pieceId);

      await axiosInstance.post(`/api/writing/pieces/${pieceId}/apply-working-copy`);

      toast({
        title: 'Draft saved!',
        description: 'Your changes have been saved to the draft',
        status: 'success'
      });

    } catch (e: any) {
      console.error('❌ Failed to save draft:', e);
      toast({
        title: 'Save failed',
        description: e?.response?.data?.message || e?.message || 'Please try again',
        status: 'error'
      });
    }
  }, [pieceId]);


  // Build publish payload
  const buildPayload = useCallback((): PublishAndPlacePayload => {
    return {
      title,
      body_json: docJSON,
      excerpt,
      writing_kind: writingKind,
      destinations: dests,
      placement_options: opts,
      group_overrides: groupOverrides,
    };
  }, [title, docJSON, excerpt, writingKind, dests, opts, groupOverrides]);


  // Handle publish
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;

    try {
      setIsPublishing(true);
      console.log('🚀 Publishing piece:', pieceId);

      // First apply working copy to piece
      await axiosInstance.post(`/api/writing/pieces/${pieceId}/apply-working-copy`);

      // Then publish with placement options
      const payload = buildPayload();
      const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/publish-and-place`, payload);

      toast({
        title: 'Published!',
        description: res?.data?.message || 'Your post has been published',
        status: 'success'
      });

      // TODO: Navigate to published post or group posts list

    } catch (e: any) {
      console.error('❌ Failed to publish:', e);
      toast({
        title: 'Publish failed',
        description: e?.response?.data?.message || e?.message || 'Please try again',
        status: 'error'
      });
    } finally {
      setIsPublishing(false);
    }
  }, [pieceId, buildPayload, isPublishing]);


  // Compute responsive width
  const contentWidth = workspaceOpen ? 'calc(100% - 360px)' : '100%';


  return (
    <HStack gap={0} align="stretch" h="100%" w="100%">
      {/* Main content */}
      <Box flex="1" w={contentWidth} pr={{ base: 4, md: 8 }} overflowY="auto">
        <VStack gap={4} align="stretch">

          {/* Title Input */}
          <GroupTitleInput
            value={title}
            onChange={onTitleChange}
            placeholder="Enter your title..."
          />

          {/* Main Editor */}
          <GroupMainEditor
            ref={editorRef}
            initialDoc={docJSON}
            onChange={onDocChange}
            placeholder="Start writing your story…"
            autoFocus={autoFocus}
          />

          {/* Excerpt */}
          <Textarea
            value={excerpt}
            onChange={(e) => onExcerptChange(e.target.value)}
            placeholder="Optional summary / excerpt"
            size="sm"
          />

          {/* Primary Actions */}
          <HStack gap={3}>
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              loading={autosaveStatus === 'saving'}
              loadingText="Saving..."
            >
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              colorScheme="green"
              loading={isPublishing}
              loadingText="Publishing..."
            >
              Publish
            </Button>
            <IconButton
              aria-label="Toggle copy desk"
              onClick={() => setWorkspaceOpen((s) => !s)}
              variant="outline"
            >
              <IconSparkles size={18} />
            </IconButton>
          </HStack>

          {/* Publishing Options (Collapsible) */}
          <Accordion.Root defaultValue={[]}>
            <Accordion.Item value="publish">
              <Accordion.ItemTrigger>Publishing & destinations</Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <VStack align="stretch" gap={4} mt={3}>
                  {/* <DestinationsPicker
                    initialDestinations={{ personal: false, groups: [], lantern: false }}
                    initialVisibility="public"
                    onChange={(d, o, g) => {
                      setDests(d);
                      setOpts(o);
                      setGroupOverrides(g);
                    }}
                  /> */}
                  {/* <PlacementSummary dests={dests} options={opts} /> */}
                  <HStack justify="flex-start">
                    <Button
                      onClick={handlePublish}
                      colorScheme="green"
                      loading={isPublishing}
                      loadingText="Publishing..."
                    >
                      Publish
                    </Button>
                  </HStack>
                </VStack>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>

        </VStack>
      </Box>

      {/* Right Rail / Copy Desk */}
      {workspaceOpen && (
        <Box w="360px" borderLeft="1px solid" borderColor="gray.200" p={4} bg="bg.canvas">
          <VStack align="stretch" gap={4}>
            {/* <DestinationsPicker
              initialDestinations={{ personal: true, groups: [], lantern: false }}
              initialVisibility="public"
              onChange={(d, o, g) => {
                setDests(d);
                setOpts(o);
                setGroupOverrides(g);
              }}
            /> */}
            {/* <PlacementSummary dests={dests} options={opts} /> */}

            {/* TODO: Add AI Copy Desk Agents here */}
            {/* <AISummaryAgent />
            <ResearchAgent />
            <CommunityToneAgent />
            <GroupGuidelinesAgent />
            <TaggingAgent /> */}
          </VStack>
        </Box>
      )}
    </HStack>
  );


  // return (
  //   <Box p={4}>
  //     <Text>Minimal composer - no state, no hooks</Text>
  //     <Text>Piece ID: {pieceId}</Text>
  //   </Box>
  // );
}