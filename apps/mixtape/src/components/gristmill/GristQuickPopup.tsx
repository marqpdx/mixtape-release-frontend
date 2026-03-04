// apps/mixtape/src/components/gristmill/GristQuickPopup.tsx
//
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CloseButton,
  HStack,
  IconButton,
  Input,
  Link,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { LuSparkles, LuSend, LuSave, LuTriangleAlert } from "react-icons/lu";
import { parseGrist, promoteDraft, saveDraft } from "@mixtape/api/clients/gristmill/gristmillApi";
import { toaster } from "@components/ui/toaster";
import { useAuth } from "@/lib/auth/AuthContext";

const STORAGE_KEY = "grist_quick_popup_unsent_v1";
const CONTEXT_STORAGE_KEY = "grist_quick_popup_issue_context_v1";
const FEEDBACK_CHECKLIST_REFRESH_EVENT = "feedback-checklist-refresh";
const GRIST_HELP_TEXT = `/issue Brief title
severity: medium
area: editor
steps: ...`;

type PersistedDraft = {
  text: string;
  timestamp: number;
  pathname: string;
};

function normalizeIssueShortcut(input: string): string {
  return input.replace(/(^|\n)\/is(\s+)/g, "$1/issue$2");
}

export default function GristQuickPopup() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isSuperuser = !!user?.is_superuser;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [issueContext, setIssueContext] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [autosaveStamp, setAutosaveStamp] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [routePath, setRoutePath] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const currentPath = typeof window === "undefined"
    ? ""
    : `${window.location.pathname}${window.location.search}`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyPath = () => setRoutePath(`${window.location.pathname}${window.location.search}`);
    applyPath();
    window.addEventListener("popstate", applyPath);
    return () => window.removeEventListener("popstate", applyPath);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedDraft;
      if (parsed?.text) {
        setText(parsed.text);
        const livePath = `${window.location.pathname}${window.location.search}`;
        setRoutePath(parsed.pathname || livePath);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(CONTEXT_STORAGE_KEY);
      if (saved) setIssueContext(saved);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (issueContext.trim()) {
        window.localStorage.setItem(CONTEXT_STORAGE_KEY, issueContext);
      } else {
        window.localStorage.removeItem(CONTEXT_STORAGE_KEY);
      }
    } catch {
      // no-op
    }
  }, [issueContext]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const persistLocal = useCallback(
    (nextText: string) => {
      if (typeof window === "undefined") return;
      const payload: PersistedDraft = {
        text: nextText,
        timestamp: Date.now(),
        pathname: `${window.location.pathname}${window.location.search}`,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setAutosaveStamp(payload.timestamp);
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      persistLocal(text);
    }, 800);
    return () => window.clearTimeout(handle);
  }, [open, text, persistLocal]);

  const clearLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    setAutosaveStamp(null);
  }, []);

  const insertCommand = useCallback((command: "/issue " | "/event ") => {
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => `${prev}${prev && !prev.endsWith("\n") ? "\n" : ""}${command}`);
      return;
    }

    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${command}${text.slice(end)}`;
    setText(next);

    window.setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const caret = start + command.length;
      ta.focus();
      ta.setSelectionRange(caret, caret);
    }, 0);
  }, [text]);

  const parseForWarning = useCallback(async (gristText: string) => {
    try {
      const result = await parseGrist(gristText);
      setWarning(result.warning || null);
      return result;
    } catch {
      return null;
    }
  }, []);

  const applyIssueContext = useCallback(
    (rawText: string) => {
      const ctx = issueContext.trim();
      if (!ctx) return rawText;

      const marker = `[ctx: ${ctx}]`;
      return rawText
        .split("\n")
        .map((line) => {
          const match = line.match(/^(\s*)\/issue(\s+)(.*)$/i);
          if (!match) return line;
          const [, leading, spacing, rest] = match;
          if (rest.includes(marker)) return line;
          const tail = rest.trim();
          return `${leading}/issue${spacing}${marker}${tail ? ` ${tail}` : ""}`;
        })
        .join("\n");
    },
    [issueContext]
  );

  const handleSaveDraft = useCallback(async () => {
    if (!text.trim()) return;
    setSavingDraft(true);
    try {
      const submitText = applyIssueContext(text);
      await parseForWarning(submitText);
      const saved = await saveDraft(submitText);
      setDraftId(saved.id);
      if (saved.warning) setWarning(saved.warning);
      persistLocal(text);
      window.dispatchEvent(new CustomEvent(FEEDBACK_CHECKLIST_REFRESH_EVENT));
      toaster.create({
        title: "Draft saved",
        description: "Saved to Grist Mill drafts.",
        type: "success",
      });
    } catch {
      toaster.create({
        title: "Save failed",
        description: "Draft is still kept locally.",
        type: "error",
      });
    } finally {
      setSavingDraft(false);
    }
  }, [applyIssueContext, parseForWarning, persistLocal, text]);

  const handlePromote = useCallback(async () => {
    if (!text.trim()) return;
    setPromoting(true);
    try {
      const submitText = applyIssueContext(text);
      await parseForWarning(submitText);

      let nextDraftId = draftId;
      if (!nextDraftId) {
        const saved = await saveDraft(submitText);
        nextDraftId = saved.id;
        setDraftId(saved.id);
        if (saved.warning) setWarning(saved.warning);
      }

      await promoteDraft(
        nextDraftId,
        undefined,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        `${window.location.pathname}${window.location.search}`
      );

      clearLocal();
      setText("");
      setDraftId(null);
      setWarning(null);
      window.dispatchEvent(new CustomEvent(FEEDBACK_CHECKLIST_REFRESH_EVENT));

      toaster.create({
        title: "Promoted",
        description: "Added to checklist/work queue.",
        type: "success",
      });
    } catch {
      toaster.create({
        title: "Promote failed",
        description: "Your text is preserved locally.",
        type: "error",
      });
    } finally {
      setPromoting(false);
    }
  }, [applyIssueContext, clearLocal, draftId, parseForWarning, text]);

  useEffect(() => {
    if (!isSuperuser) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key === ".") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (meta && event.key === "Enter" && open) {
        event.preventDefault();
        if (!promoting && !savingDraft) {
          void handlePromote();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePromote, isSuperuser, open, promoting, savingDraft]);

  if (isLoading || !isAuthenticated || !isSuperuser) {
    return null;
  }

  return (
    <>
      <Box position="fixed" right="18px" bottom="18px" zIndex={1500}>
        <IconButton
          aria-label="Open Grist quick popup"
          onClick={() => setOpen((prev) => !prev)}
          borderRadius="full"
          size="md"
          boxShadow="lg"
          colorPalette="teal"
        >
          <LuSparkles />
        </IconButton>
      </Box>

      {open ? (
        <Box
          role="dialog"
          aria-label="Grist quick capture"
          position="fixed"
          right={{ base: "10px", md: "18px" }}
          bottom={{ base: "68px", md: "78px" }}
          w={{ base: "calc(100vw - 20px)", md: "560px" }}
          maxW="96vw"
          borderWidth="1px"
          borderColor="border"
          bg="bg.panel"
          borderRadius="xl"
          boxShadow="2xl"
          zIndex={1500}
          p={4}
        >
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between" align="center">
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold">Quick Grist Capture</Text>
                <Text fontSize="xs" color="fg.muted">
                  Cmd/Ctrl + Enter promotes immediately. Cmd/Ctrl + . toggles this popup.
                </Text>
              </VStack>
              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="outline"
                  minW="24px"
                  h="24px"
                  p={0}
                  onClick={() => setShowHelp((prev) => !prev)}
                  aria-label="Toggle Grist help"
                >
                  ?
                </Button>
                <CloseButton onClick={() => setOpen(false)} />
              </HStack>
            </HStack>

            {showHelp ? (
              <Box p={2} borderWidth="1px" borderColor="border" borderRadius="md" bg="bg.subtle">
                <Text fontSize="xs" whiteSpace="pre-wrap" color="fg.muted">
                  {GRIST_HELP_TEXT}
                </Text>
              </Box>
            ) : null}

            <HStack gap={2}>
              <Input
                size="sm"
                value={routePath || currentPath}
                readOnly
                color="fg.muted"
                borderColor="border.muted"
                flex="1"
              />
              <Button asChild size="xs" variant="outline">
                <Link href="/app/feedback/checklist">Checklist</Link>
              </Button>
            </HStack>

            <HStack gap={2}>
              <Button
                size="xs"
                borderRadius="full"
                colorPalette="purple"
                variant="subtle"
                onClick={() => insertCommand("/issue ")}
              >
                is
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                colorPalette="blue"
                variant="subtle"
                onClick={() => insertCommand("/event ")}
              >
                ev
              </Button>
              <Input
                size="xs"
                value={issueContext}
                onChange={(event) => setIssueContext(event.currentTarget.value)}
                placeholder="Context (applies to /issue)"
                maxW={{ base: "full", md: "280px" }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
              />
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIssueContext("")}
                disabled={!issueContext.trim()}
              >
                Clear
              </Button>
            </HStack>

            <Textarea
              ref={textareaRef}
              minH="180px"
              maxH="40vh"
              resize="vertical"
              value={text}
              onChange={(event) => setText(normalizeIssueShortcut(event.target.value))}
              placeholder={GRIST_HELP_TEXT}
              fontFamily="mono"
              fontSize="sm"
            />

            {warning ? (
              <HStack gap={2} align="start" color="orange.500">
                <LuTriangleAlert />
                <Text fontSize="xs">{warning}</Text>
              </HStack>
            ) : null}

            <HStack justify="space-between" align="center" wrap="wrap" gap={2}>
              <HStack gap={2}>
                <Badge variant="subtle" colorPalette="blue">{draftId ? "Draft linked" : "No draft yet"}</Badge>
                <Text fontSize="xs" color="fg.muted">
                  {autosaveStamp ? `Autosaved locally ${new Date(autosaveStamp).toLocaleTimeString()}` : "Autosave pending..."}
                </Text>
              </HStack>

              <HStack gap={2}>
                <Button size="sm" variant="outline" onClick={handleSaveDraft} disabled={savingDraft || promoting || !text.trim()}>
                  <LuSave />
                  Save Draft
                </Button>
                <Button size="sm" colorPalette="teal" onClick={() => void handlePromote()} disabled={savingDraft || promoting || !text.trim()}>
                  <LuSend />
                  Promote
                </Button>
                {draftId ? (
                  <Button asChild size="sm" variant="ghost">
                    <a href="/dashboard?section=mill">Open in Grist Mill</a>
                  </Button>
                ) : null}
              </HStack>
            </HStack>
          </VStack>
        </Box>
      ) : null}
    </>
  );
}
