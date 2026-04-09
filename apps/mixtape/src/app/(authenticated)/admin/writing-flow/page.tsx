// apps/mixtape/src/app/(authenticated)/admin/writing-flow/page.tsx

'use client';

import * as React from 'react';
import NextLink from 'next/link';

// Chakra UI v3 (assumed available in your app)
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Link,
  Separator,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';

/**
 * NOTE: Replace these with your actual, already-existing routes.
 * This page is meant to be an inhouse UX artifact, not canon.
 */
const STAGE_LINKS: Record<
  WritingStageKey,
  Array<{ label: string; href: string }>
> = {
  capture: [
    { label: 'Seed Capture', href: '/seed' },
    { label: 'Member Workbench', href: '/member/admin/workbench' },
    {
      label: 'Member Landing',
      href: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.crossroads.place'}/members/admin`,
    },
  ],
  triage: [
    { label: 'My Writing (Pieces)', href: '/member/admin/hub?section=writing' },
    { label: 'Write Editor', href: '/member/admin/hub?section=write' },
    { label: 'Seed Capture', href: '/seed' },
  ],
  drafting: [
    { label: 'Write Editor', href: '/member/admin/hub?section=write' },
    { label: 'My Writing (Pieces)', href: '/member/admin/hub?section=writing' },
    { label: 'Import DOCX', href: '/member/admin/hub?section=import-document' },
  ],
  publish: [
    { label: 'My Writing (Pieces)', href: '/member/admin/hub?section=writing' },
    { label: 'Public Library', href: '/member/admin/library/writing' },
    { label: 'Member Writing Piece', href: '/member/admin/writing' },
  ],
  canon: [
    { label: 'Grist / Mill', href: '/member/admin/hub?section=mill' },
    { label: 'Puddlejump', href: '/puddlejump' },
    { label: 'Feedback Checklist', href: '/feedback/checklist' },
  ],
};

type WritingStageKey = 'capture' | 'triage' | 'drafting' | 'publish' | 'canon';

type StageConfig = {
  key: WritingStageKey;
  title: string;
  subtitle: string;
  placeholder: string;
};

const STAGES: StageConfig[] = [
  {
    key: 'capture',
    title: 'Stage 0 — Capture',
    subtitle: 'Low friction capture. Raw material.',
    placeholder:
      '- Composer quick posts\n- Seed (mobile)\n- Voice → Seed\n- Share target → Seed\n\nNotes:\n- What counts as “capture”?\n- What should auto-route into Storyline vs stay private?\n',
  },
  {
    key: 'triage',
    title: 'Stage 1 — Triage / Tidy',
    subtitle: 'Light curation: decide what to develop.',
    placeholder:
      '- Rename\n- Merge\n- Promote Seed → Draft\n- Add tags\n- Decide next step\n\nNotes:\n- What is the “inbox”?\n- What is the default action?\n',
  },
  {
    key: 'drafting',
    title: 'Stage 2 — Drafting',
    subtitle: 'Intentional writing. Real composition.',
    placeholder:
      '- WritingPiece drafting\n- Outline\n- Autosave\n- Spell/grammar\n- Replace rules\n\nNotes:\n- What makes a “Draft” distinct from a Seed?\n- What are the key editor affordances?\n',
  },
  {
    key: 'publish',
    title: 'Stage 3 — Publish / Schedule',
    subtitle: 'Move work into the world (or queue it).',
    placeholder:
      '- Publish post/article/dispatch/forum\n- Schedule\n- Add to Storyline\n\nNotes:\n- What pre-publish checklist exists?\n- Who can publish (roles)?\n',
  },
  {
    key: 'canon',
    title: 'Stage 4 — Canon / Knowledge Integration',
    subtitle: 'Extract, cite, integrate into Stackroom/Mill.',
    placeholder:
      '- Extract to Stackroom\n- Link sources\n- Add to Library/Course\n- Mill/Grist workflows\n\nNotes:\n- What is the “done” state?\n- When does something become canon?\n',
  },
];

const LS_KEY = 'mixtape:writing-flow:stage-notes:v1';

type StageNotesState = Record<
  WritingStageKey,
  { titleOverride?: string; body: string }
>;

function buildDefaultState(): StageNotesState {
  return STAGES.reduce((acc, s) => {
    acc[s.key] = { body: s.placeholder };
    return acc;
  }, {} as StageNotesState);
}

function summarizeMarkdown(state: StageNotesState): string {
  const lines: string[] = [];
  lines.push('# Writing Lifecycle — Working Notes');
  lines.push('');
  for (const s of STAGES) {
    const title = state[s.key].titleOverride?.trim() || s.title;
    lines.push(`## ${title}`);
    lines.push('');
    lines.push(state[s.key].body.trim() ? state[s.key].body.trim() : '_(empty)_');
    lines.push('');
  }
  return lines.join('\n');
}

export default function WritingFlowAdminPage() {
  const [notes, setNotes] = React.useState<StageNotesState>(() => buildDefaultState());
  const [summary, setSummary] = React.useState<string>('');
  const [savedAt, setSavedAt] = React.useState<string>('');
  const [focusedStage, setFocusedStage] = React.useState<WritingStageKey | null>(null);

  // Load persisted notes
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StageNotesState;
      // Shallow validation / merge with defaults (so future stages don't break)
      const defaults = buildDefaultState();
      const merged: StageNotesState = { ...defaults };
      (Object.keys(defaults) as WritingStageKey[]).forEach((k) => {
        merged[k] = {
          titleOverride: parsed?.[k]?.titleOverride ?? defaults[k].titleOverride,
          body: parsed?.[k]?.body ?? defaults[k].body,
        };
      });
      setNotes(merged);
    } catch {
      // If localStorage is corrupted, fall back to defaults silently.
    }
  }, []);

  // Persist notes on change (debounced)
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(notes));
        setSavedAt(new Date().toLocaleTimeString());
      } catch {
        // Ignore (private mode / quota)
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [notes]);

  const onSummarize = () => {
    const md = summarizeMarkdown(notes);
    setSummary(md);
  };

  const onReset = () => {
    const next = buildDefaultState();
    setNotes(next);
    setSummary('');
  };

  const onClearLocalMemory = () => {
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
    setSavedAt('');
  };

  const copySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // ignore
    }
  };

  const gridTemplateColumns = React.useMemo(() => {
    if (!focusedStage) return 'repeat(5, minmax(240px, 1fr))';
    const otherWidth = 'minmax(120px, 14%)';
    return STAGES.map((s) => (s.key === focusedStage ? 'minmax(280px, 44%)' : otherWidth)).join(' ');
  }, [focusedStage]);

  return (
    <Box minH="100vh">
      {/* Simple inhouse nav */}
      <Box borderBottomWidth="1px">
        <Container maxW="100%">
          <Flex py="3" align="center" justify="space-between" gap="4" wrap="wrap">
            <HStack gap="3">
              <Heading size="md">Writing Flow (Inhouse)</Heading>
              <Text fontSize="sm" opacity={0.7}>
                Editable staging notes • {savedAt ? `Saved ${savedAt}` : 'Not yet saved'}
              </Text>
            </HStack>

            <HStack gap="2" wrap="wrap">
              <Link asChild>
                <NextLink href="/app/content-hub">Content Hub</NextLink>
              </Link>
              <Link asChild>
                <NextLink href="/app/storyline">Storyline</NextLink>
              </Link>
              <Link asChild>
                <NextLink href="/app/draft-room">Draft Room</NextLink>
              </Link>
              <Link asChild>
                <NextLink href="/app/stackroom">Stackroom</NextLink>
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="100%" py="4">
        <Flex align="start" justify="space-between" wrap="wrap" gap="3" mb="4">
          <VStack align="start" gap="1">
            <Heading size="lg">Writing Lifecycle Working Board</Heading>
            <Text opacity={0.8}>
              Click into any box and edit freely. This is intentionally non-canon.
            </Text>
          </VStack>

          <HStack gap="2" wrap="wrap">
            <Button onClick={onSummarize}>Summarize</Button>
            <Button variant="outline" onClick={copySummary} disabled={!summary}>
              Copy summary
            </Button>
            <Button variant="outline" onClick={onReset}>
              Reset
            </Button>
            <Button variant="outline" colorPalette="orange" onClick={onClearLocalMemory}>
              Clear Local Memory
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFocusedStage(null)}
              disabled={!focusedStage}
            >
              Show all equally
            </Button>
          </HStack>
        </Flex>

        {/* Five boxes left-to-right, sized like pricing cards */}
        <Box
          borderWidth="1px"
          rounded="lg"
          p="3"
          mb="4"
          bg="transparent"
        >
          <Text fontSize="sm" opacity={0.8}>
            Layout note: this row aims for ~62vh total height. On smaller screens it scrolls horizontally.
          </Text>
        </Box>

        <Box
          overflowX="auto"
          pb="2"
        >
          <Box
            minW="1100px"
            display="grid"
            gridTemplateColumns={gridTemplateColumns}
            gap="3"
            // Approx “pricing card row height”
            height="62vh"
            transition="grid-template-columns 0.22s ease"
          >
            {STAGES.map((stage) => {
              const stageState = notes[stage.key];
              const links = STAGE_LINKS[stage.key] ?? [];
              const isFocused = focusedStage === stage.key;
              const isCompressed = !!focusedStage && !isFocused;

              return (
                <Box
                  key={stage.key}
                  borderWidth="1px"
                  borderColor={isFocused ? 'blue.400' : undefined}
                  rounded="2xl"
                  p="3"
                  display="flex"
                  flexDirection="column"
                  minH="0"
                  cursor="pointer"
                  onClick={() => setFocusedStage(stage.key)}
                  transition="all 0.2s ease"
                  opacity={isCompressed ? 0.85 : 1}
                >
                  <VStack align="start" gap="2">
                    {/* Optional title override (kept editable, but separate from body) */}
                    <Input
                      value={stageState.titleOverride ?? ''}
                      placeholder={stage.title}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNotes((prev) => ({
                          ...prev,
                          [stage.key]: { ...prev[stage.key], titleOverride: v },
                        }));
                      }}
                    />

                    <Text fontSize="sm" opacity={0.8}>
                      {stage.subtitle}
                    </Text>
                    {isCompressed && (
                      <Text fontSize="xs" opacity={0.6}>
                        Focused elsewhere
                      </Text>
                    )}
                  </VStack>

                  <Separator my="3" />

                  {/* Main editable area */}
                  <Box flex="1" minH="0" display="flex" flexDirection="column" gap="2">
                    <Textarea
                      value={stageState.body}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNotes((prev) => ({
                          ...prev,
                          [stage.key]: { ...prev[stage.key], body: v },
                        }));
                      }}
                      resize="none"
                      height="100%"
                      minH="0"
                      placeholder={stage.placeholder}
                      spellCheck
                    />

                    {/* Non-editable links underneath */}
                    {links.length > 0 && (
                      <Box pt="1">
                        <Text fontSize="xs" opacity={0.7} mb="1">
                          Existing routes:
                        </Text>
                        <VStack align="start" gap="1">
                          {links.map((l) => (
                            l.href.startsWith('http') ? (
                              <Link target='_BLANK' key={`${stage.key}:${l.href}`} href={l.href} fontSize="sm">
                                {l.label}
                              </Link>
                            ) : (
                              <Link target='_BLANK' key={`${stage.key}:${l.href}`} asChild fontSize="sm">
                                <NextLink href={l.href}>{l.label}</NextLink>
                              </Link>
                            )
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Summary output */}
        <Box mt="5" borderWidth="1px" rounded="2xl" p="4">
          <Flex align="center" justify="space-between" wrap="wrap" gap="2" mb="3">
            <Heading size="md">Summary (Markdown)</Heading>
            <Text fontSize="sm" opacity={0.75}>
              Generated from the five boxes; paste back into chat or docs.
            </Text>
          </Flex>

          <Textarea
            value={summary}
            readOnly
            placeholder="Click “Summarize” to generate a consolidated markdown block."
            minH="220px"
            resize="vertical"
          />
        </Box>
      </Container>
    </Box>
  );
}
