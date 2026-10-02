import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { SpellFinding } from "@/lib/spell/scan";

export const spellFindingsKey = new PluginKey<DecorationSet>("spellFindings");

export const SpellFindings = Extension.create({
  name: "spellFindings",
  addProseMirrorPlugins() {
    return [new Plugin({
      key: spellFindingsKey,
      state: {
        init: () => DecorationSet.empty,
        apply(transaction, previous) {
          const findings = transaction.getMeta(spellFindingsKey) as SpellFinding[] | undefined;
          if (findings) {
            return DecorationSet.create(transaction.doc, findings.map((finding) =>
              Decoration.inline(finding.from, finding.to, {
                class: "spell-finding",
                title: "Spelling suggestion available",
              }),
            ));
          }
          return transaction.docChanged ? DecorationSet.empty : previous;
        },
      },
      props: { decorations: (state) => spellFindingsKey.getState(state) ?? DecorationSet.empty },
    })];
  },
});
