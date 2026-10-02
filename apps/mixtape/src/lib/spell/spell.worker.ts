import nspell from "nspell";
import type { SpellFinding, SpellToken } from "./scan";

type ScanRequest = {
  id: number;
  tokens: SpellToken[];
  accepted: string[];
  replacements: Record<string, string>;
};

let checker: ReturnType<typeof nspell> | null = null;

async function getChecker() {
  if (checker) return checker;
  const response = await fetch("/app/api/spell/dictionary");
  if (!response.ok) throw new Error("US English dictionary unavailable");
  const dictionary = await response.json() as { aff: string; dic: string };
  checker = nspell(dictionary.aff, dictionary.dic);
  return checker;
}

self.onmessage = async (event: MessageEvent<ScanRequest>) => {
  const { id, tokens, accepted, replacements } = event.data;
  try {
    const spell = await getChecker();
    const acceptedSet = new Set(accepted.map((word) => word.toLocaleLowerCase("en-US")));
    const findings: SpellFinding[] = [];
    const cache = new Map<string, string[] | null>();

    for (const token of tokens) {
      const key = token.text.toLocaleLowerCase("en-US");
      if (acceptedSet.has(key) || /\d/.test(key)) continue;
      if (!cache.has(key)) {
        const replacement = replacements[key];
        cache.set(key, replacement ? [replacement] : spell.correct(token.text) ? null : spell.suggest(token.text).slice(0, 5));
      }
      const suggestions = cache.get(key);
      if (suggestions) findings.push({ ...token, suggestions });
    }
    self.postMessage({ id, findings });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : "Spell check unavailable" });
  }
};
