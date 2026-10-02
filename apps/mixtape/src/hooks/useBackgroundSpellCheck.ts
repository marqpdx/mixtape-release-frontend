import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { spellFindingsKey } from "@/components/editor/extensions/SpellFindings";
import { collectSpellTokens, type SpellFinding } from "@/lib/spell/scan";

type ScanResponse = { id: number; findings?: SpellFinding[]; error?: string };

export function useBackgroundSpellCheck(editor: Editor | null, accepted: string[], replacements: Record<string, string>) {
  const [findings, setFindings] = useState<SpellFinding[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const requestId = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rulesKey = JSON.stringify({ accepted, replacements });
  const rules = useMemo(() => JSON.parse(rulesKey) as { accepted: string[]; replacements: Record<string, string> }, [rulesKey]);
  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const scanNow = useCallback(() => {
    if (!editor || !workerRef.current) return;
    const id = ++requestId.current;
    setStatus("loading");
    workerRef.current.postMessage({ id, tokens: collectSpellTokens(editor), ...rulesRef.current });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const worker = new Worker(new URL("../lib/spell/spell.worker.ts", import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<ScanResponse>) => {
      const { id, findings: next, error } = event.data;
      if (id !== requestId.current) return;
      if (error || !next) {
        setStatus("error");
        return;
      }
      setFindings(next);
      setStatus("ready");
      if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(spellFindingsKey, next));
    };
    worker.onerror = () => setStatus("error");

    const onUpdate = () => {
      ++requestId.current;
      setFindings([]);
      setStatus("loading");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(scanNow, 450);
    };
    editor.on("update", onUpdate);
    const ids = requestId;
    return () => {
      editor.off("update", onUpdate);
      if (timerRef.current) clearTimeout(timerRef.current);
      ++ids.current;
      worker.terminate();
      workerRef.current = null;
    };
  }, [editor, scanNow]);

  useEffect(() => {
    if (editor && workerRef.current) scanNow();
  }, [editor, rules, scanNow]);

  return { findings, status, scanNow };
}
