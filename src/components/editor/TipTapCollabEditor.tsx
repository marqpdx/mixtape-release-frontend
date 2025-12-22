// src/components/editor/TipTapCollabEditor.tsx
//
// Key changes in this version:
// - Seed happens ONLY after we consider the provider "synced" (prevents ballooning/dupe append).
// - Removed the "save yjs_state immediately after seed" client PATCH path.
//   Canonical yjs_state persistence is owned by the Node dispatch server (15s debounce),
//   and snapshot autosave is handled by your useCollabAutosave hook.
// - Kept lightweight debug logs; you can trim later.

"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import * as Y from "yjs";
import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Prose } from "@components/ui/prose";

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-block-id"),
        renderHTML: (attributes) => {
          if (!attributes.blockId) return {};
          return { "data-block-id": attributes.blockId };
        },
      },
    };
  },
});

const CollabStarterKit = StarterKit.configure({
  undoRedo: false,
  paragraph: false,
});

interface TipTapCollabEditorProps {
  initialContent?: JSONContent | string;
  yjsProvider: any;
  ydoc: Y.Doc;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

const TipTapCollabEditor = forwardRef<any, TipTapCollabEditorProps>(
  (
    {
      initialContent = "",
      yjsProvider,
      ydoc,
      editable = true,
      placeholder = "Type here...",
      className = "",
    },
    ref
  ) => {
    const bgColorEditor = useColorModeValue("#FBFBFA", "gray.800");

    // Tracks whether provider has "synced" state down to this client.
    // We deliberately seed ONLY after this flips true.
    const syncedRef = useRef(false);

    // Heuristic: if state has any meaningful bytes, treat as non-empty
    function ydocLooksEmpty(doc: Y.Doc) {
      const state = Y.encodeStateAsUpdate(doc);
      if (state.length > 8) return false; // non-empty enough to skip seed
      const frag = doc.getXmlFragment("default");
      return frag.length === 0;
    }

    const extensions = useMemo(() => {
      console.log("🔧 [CollabEditor] Creating extensions w/ Y.Doc:", ydoc.clientID);
      return [
        CollabStarterKit,
        CustomParagraph,
        Collaboration.configure({
          document: ydoc,
          field: "default",
        }),
      ];
    }, [ydoc]);

    const editor = useEditor({
      extensions,
      // IMPORTANT: don't rely on `content: initialContent` under collaboration
      content: "",
      editable,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "editor-content",
          placeholder,
        },
      },
    });

    useImperativeHandle(ref, () => editor, [editor]);

    // Ensure editor respects editable prop changes
    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!!editable);
    }, [editor, editable]);

    // ✅ 1) Establish "synced" signal BEFORE any seeding logic runs.
    // Best case: provider emits "synced". Otherwise fallback timer.
    useEffect(() => {
      syncedRef.current = false;

      // Best case: provider emits "synced"
      if (yjsProvider?.on) {
        const onSynced = () => {
          syncedRef.current = true;
          console.log("✅ [CollabEditor] Provider synced");
        };

        try {
          yjsProvider.on("synced", onSynced);
          return () => {
            try {
              yjsProvider.off?.("synced", onSynced);
            } catch {}
          };
        } catch {
          // ignore
        }
      }

      // Fallback: assume synced shortly after mount (not ideal, but prevents immediate seed)
      const t = setTimeout(() => {
        syncedRef.current = true;
        console.log("✅ [CollabEditor] Synced fallback timer fired");
      }, 1200);

      return () => clearTimeout(t);
    }, [yjsProvider]);

    // ✅ 2) Seed only AFTER sync, and ONLY if the Yjs doc is still empty.
    // This prevents "seed then remote state arrives" ballooning.
    useEffect(() => {
      if (!editor) return;
      if (!ydoc) return;

      // Already handled for this Y.Doc instance
      if ((ydoc as any).__didSeed) return;

      const hasInitialContent = !!(ydoc as any).__initialContent;
      if (!hasInitialContent) return;

      const contentToSeed = (ydoc as any).__initialContent;

      let cancelled = false;

      async function maybeSeedAfterSync() {
        // wait for sync (poll)
        for (let i = 0; i < 40; i++) {
          if (cancelled) return;
          if (syncedRef.current) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        if (cancelled) return;

        // After sync: if doc already has content, DO NOT seed.
        if (!ydocLooksEmpty(ydoc)) {
          console.log("✅ [CollabEditor] Doc not empty after sync; skipping seed");
          (ydoc as any).__didSeed = true;
          delete (ydoc as any).__initialContent;
          return;
        }

        console.log("🌱 [CollabEditor] Seeding EMPTY doc after sync");

        // IMPORTANT: emitUpdate=true writes into Yjs so it can sync + be persisted by server.
        editor?.commands.setContent(contentToSeed as any, { emitUpdate: true });

        (ydoc as any).__didSeed = true;
        delete (ydoc as any).__initialContent;
      }

      void maybeSeedAfterSync();

      return () => {
        cancelled = true;
      };
    }, [editor, ydoc, yjsProvider]);

    // Debug: Track Y.Doc updates (keep while you validate ballooning fix; remove later)
    useEffect(() => {
      if (!ydoc) return;

      const handleUpdate = (update: Uint8Array, origin: any) => {
        console.log("🔄 [CollabEditor] Y.Doc update", {
          updateSize: update.length,
          originType: origin?.constructor?.name,
          clientID: ydoc.clientID,
        });
      };

      ydoc.on("update", handleUpdate);
      return () => {
        ydoc.off("update", handleUpdate);
      };
    }, [ydoc]);

    // Log editor setup
    useEffect(() => {
      if (!editor || !ydoc) return;

      const extensionNames = editor.extensionManager.extensions.map((e) => e.name);

      if (!extensionNames.includes("collaboration")) {
        console.error("❌ [CollabEditor] Collaboration extension missing", {
          extensionNames,
          ydocClientID: ydoc.clientID,
        });
      }

      console.log("🤝 [CollabEditor] Editor ready", {
        ydocClientID: ydoc.clientID,
        extensionNames,
      });
    }, [editor, ydoc]);

    const isBorderless = className.includes("borderless-editor");

    return (
      <React.Fragment>
        <Box
          className={className}
          {...(!isBorderless && {
            borderWidth: "1px",
            borderRadius: "md",
            p: 4,
          })}
          minH={isBorderless ? "auto" : "300px"}
        >
          <Box border={"1px solid gray"} pt={1} pl={1}>
            <Prose
              className="editor-content-prose"
              bg={bgColorEditor}
              maxW="full"
              css={{ "& > *": { marginBlock: 0 } }}
            >
              <EditorContent editor={editor} />
            </Prose>
          </Box>
        </Box>
      </React.Fragment>
    );
  }
);

TipTapCollabEditor.displayName = "TipTapCollabEditor";
export default TipTapCollabEditor;


// // src/components/editor/TipTapCollabEditor.tsx

// "use client";

// import { useEffect, forwardRef, useImperativeHandle, useMemo, useRef } from "react";
// import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
// import Collaboration from "@tiptap/extension-collaboration";
// import StarterKit from "@tiptap/starter-kit";
// import Paragraph from "@tiptap/extension-paragraph";
// import * as Y from "yjs";
// import { Box } from "@chakra-ui/react";
// import { useColorModeValue } from "@components/ui/color-mode";
// import { Prose } from "@components/ui/prose";
// import { axiosInstance } from "@providers/auth-provider/axiosInstance";
// import React from "react";

// const CustomParagraph = Paragraph.extend({
//   addAttributes() {
//     return {
//       blockId: {
//         default: null,
//         parseHTML: (element) => element.getAttribute("data-block-id"),
//         renderHTML: (attributes) => {
//           if (!attributes.blockId) return {};
//           return { "data-block-id": attributes.blockId };
//         },
//       },
//     };
//   },
// });

// const CollabStarterKit = StarterKit.configure({
//   undoRedo: false,
//   paragraph: false,
// });

// interface TipTapCollabEditorProps {
//   initialContent?: JSONContent | string;
//   yjsProvider: any;
//   ydoc: Y.Doc;
//   editable?: boolean;
//   placeholder?: string;
//   className?: string;
// }

// const TipTapCollabEditor = forwardRef<any, TipTapCollabEditorProps>(
//   (
//     {
//       initialContent = "",
//       yjsProvider,
//       ydoc,
//       editable = true,
//       placeholder = "Type here...",
//       className = "",
//     },
//     ref
//   ) => {
//     const bgColorEditor = useColorModeValue("#FBFBFA", "gray.800");

//     // ---- Autosave / PATCH single-flight + backoff (429-safe) ----
//     const saveInFlightRef = useRef(false);
//     const saveAgainRef = useRef(false);

//     const lastSavedStateHashRef = useRef<string>("");
//     const lastSavedSnapshotHashRef = useRef<string>("");

//     const backoffUntilRef = useRef<number>(0);
//     const backoffMsRef = useRef<number>(0);

//     const syncedRef = useRef(false);

//     // Heuristic: if state has any meaningful bytes, treat as non-empty
//     function ydocLooksEmpty(doc: Y.Doc) {
//       const state = Y.encodeStateAsUpdate(doc);
//       if (state.length > 8) return false; // non-empty enough to skip seed
//       const frag = doc.getXmlFragment("default");
//       return frag.length === 0;
//     }

//     function stableHashString(s: string) {
//       // lightweight deterministic hash (good enough for diff gating)
//       let h = 0;
//       for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
//       return String(h);
//     }

//     function stableHashBytes(u8: Uint8Array) {
//       // hash first/last chunk + length (cheap) to avoid heavy hashing on big docs
//       const len = u8.length;
//       let h = len | 0;
//       const take = Math.min(64, len);
//       for (let i = 0; i < take; i++) h = (h * 31 + u8[i]) | 0;
//       for (let i = Math.max(0, len - take); i < len; i++) h = (h * 31 + u8[i]) | 0;
//       return `${len}:${h}`;
//     }

//     function uint8ArrayToBase64(bytes: Uint8Array): string {
//       // Chunked encode to avoid stack overflow
//       const chunkSize = 8192;
//       let binary = "";
//       for (let i = 0; i < bytes.length; i += chunkSize) {
//         const chunk = bytes.subarray(i, i + chunkSize);
//         binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
//       }
//       return btoa(binary);
//     }

//     async function sleep(ms: number) {
//       return new Promise((r) => setTimeout(r, ms));
//     }

//     async function performSaveBestPractice(args: {
//       ydoc: Y.Doc;
//       dispatchContentId: string;
//       contentSnapshot: any; // JSONContent/string
//       reason: "seed" | "autosave";
//     }) {
//       const { ydoc, dispatchContentId, contentSnapshot, reason } = args;

//       // Backoff gate (after 429)
//       const now = Date.now();
//       if (now < backoffUntilRef.current) {
//         // Schedule one retry; don't pile up retries
//         saveAgainRef.current = true;
//         return;
//       }

//       // Single-flight: if a save is already running, request exactly one follow-up.
//       if (saveInFlightRef.current) {
//         saveAgainRef.current = true;
//         return;
//       }

//       saveInFlightRef.current = true;

//       try {
//         // Encode state
//         const state = Y.encodeStateAsUpdate(ydoc);
//         if (state.length === 0) {
//           console.warn("⚠️ [CollabEditor] performSave: encoded state empty; skipping", { reason });
//           return;
//         }

//         // Diff gate on yjs_state
//         const stateHash = stableHashBytes(state);

//         // Snapshot hash
//         const snapshotString =
//           typeof contentSnapshot === "string" ? contentSnapshot : JSON.stringify(contentSnapshot);
//         const snapshotHash = stableHashString(snapshotString);

//         if (
//           stateHash === lastSavedStateHashRef.current &&
//           snapshotHash === lastSavedSnapshotHashRef.current
//         ) {
//           // Nothing new; do nothing.
//           return;
//         }

//         const base64State = uint8ArrayToBase64(state);

//         // Small log only (no payloads)
//         console.log("💾 [CollabEditor] PATCH dispatch content", {
//           reason,
//           bytes: state.length,
//           base64Len: base64State.length,
//         });

//         await axiosInstance.patch(`/api/dispatch/content/${dispatchContentId}`, {
//           yjs_state: base64State,
//           content_snapshot: contentSnapshot,
//         });

//         // Success: reset backoff, commit hashes
//         backoffMsRef.current = 0;
//         backoffUntilRef.current = 0;

//         lastSavedStateHashRef.current = stateHash;
//         lastSavedSnapshotHashRef.current = snapshotHash;

//         if (reason === "seed") {
//           console.log("✅ [CollabEditor] Initial yjs_state saved");
//         }
//       } catch (err: any) {
//         const status = err?.response?.status;

//         if (status === 429) {
//           // Exponential backoff with cap
//           const prev = backoffMsRef.current || 750;
//           const next = Math.min(prev * 2, 15_000);
//           backoffMsRef.current = next;
//           backoffUntilRef.current = Date.now() + next;

//           console.warn("⚠️ [CollabEditor] 429 from Django; backing off", { ms: next, reason });

//           // Ensure we retry once after backoff if there were changes
//           saveAgainRef.current = true;
//         } else {
//           console.error("❌ [CollabEditor] Failed to save", {
//             reason,
//             status,
//             message: err?.message,
//           });
//         }
//       } finally {
//         saveInFlightRef.current = false;

//         // If a save was requested during this save (or during backoff), run exactly once more.
//         if (saveAgainRef.current) {
//           saveAgainRef.current = false;

//           // Respect backoff timing if set
//           const wait = Math.max(0, backoffUntilRef.current - Date.now());
//           if (wait > 0) await sleep(wait);

//           // Run again (single additional flush)
//           await performSaveBestPractice(args);
//         }
//       }
//     }

//     const extensions = useMemo(() => {
//       console.log("🔧 Creating extensions array with Y.Doc:", ydoc.clientID);
//       return [
//         CollabStarterKit,
//         CustomParagraph,
//         Collaboration.configure({
//           document: ydoc,
//           field: "default",
//         }),
//       ];
//     }, [ydoc]);

//     const editor = useEditor({
//       extensions,
//       // IMPORTANT: do not rely on `content: initialContent` under collaboration
//       content: "",
//       editable,
//       immediatelyRender: false,
//       editorProps: {
//         attributes: {
//           class: "editor-content",
//           placeholder,
//         },
//       },
//     });

//     useImperativeHandle(ref, () => editor, [editor]);

//     // Ensure editor respects editable prop changes
//     useEffect(() => {
//       if (!editor) return;
//       editor.setEditable(!!editable);
//     }, [editor, editable]);

//     // ✅ Seed once, AFTER editor exists (collab binding attached)
//     // Store flag on ydoc (persists across remounts) instead of component ref
//     useEffect(() => {
//       if (!editor) return;
//       if (!ydoc) return;

//       // Check if we've already seeded this Y.Doc instance
//       if ((ydoc as any).__didSeed) {
//         console.log("⏭️ [CollabEditor] Y.Doc already seeded in previous mount, skipping");
//         return;
//       }

//       const frag = ydoc.getXmlFragment("default");
//       const isEmpty = frag.length === 0;

//       console.log(`🔍 [CollabEditor] Seed check - fragment empty: ${isEmpty}, fragment length: ${frag.length}`);

//       // Check if useYjsSocketProvider fetched content_snapshot for seeding
//       const hasInitialContent = !!(ydoc as any).__initialContent;
//       console.log(`🔍 [CollabEditor] Has __initialContent: ${hasInitialContent}`);

//       // ONLY seed if fragment is empty AND we have content
//       if (isEmpty && hasInitialContent) {
//         const contentToSeed = (ydoc as any).__initialContent;
//         const dispatchContentId = (ydoc as any).__dispatchContentId;

//         console.log("🌱 [CollabEditor] Seeding Y.Doc from content_snapshot");
//         editor.commands.setContent(contentToSeed as any, {
//           emitUpdate: false, // Don't broadcast - this is initial seed
//         });

//         // CRITICAL: save once after seed, but safely (single-flight + backoff)
//         setTimeout(() => {
//           if (!dispatchContentId) {
//             console.warn("⚠️ [CollabEditor] Missing __dispatchContentId; cannot persist seed");
//             return;
//           }

//           // Verify fragment has content before saving
//           const fragAfter = ydoc.getXmlFragment("default");
//           if (fragAfter.length === 0) {
//             console.warn("⚠️ [CollabEditor] Fragment empty right after seed; retrying save in 500ms");
//             setTimeout(() => {
//               const retryFrag = ydoc.getXmlFragment("default");
//               if (retryFrag.length === 0) {
//                 console.error("❌ [CollabEditor] Fragment still empty; aborting seed save");
//                 return;
//               }
//               void performSaveBestPractice({
//                 ydoc,
//                 dispatchContentId,
//                 contentSnapshot: contentToSeed,
//                 reason: "seed",
//               });
//             }, 500);
//             return;
//           }

//           void performSaveBestPractice({
//             ydoc,
//             dispatchContentId,
//             contentSnapshot: contentToSeed,
//             reason: "seed",
//           });
//         }, 500);

//         // CRITICAL: Mark as seeded and clear __initialContent
//         (ydoc as any).__didSeed = true;
//         delete (ydoc as any).__initialContent;
//         console.log("🧹 [CollabEditor] Marked Y.Doc as seeded and cleared __initialContent");
//       } else {
//         if (!isEmpty) {
//           console.log("✅ [CollabEditor] Y.Doc already has content; skipping seed");
//           // Mark as "seeded" (content exists) to prevent future seed attempts
//           (ydoc as any).__didSeed = true;
//         }
//         // Clear __initialContent if it exists (shouldn't seed if fragment has content)
//         if (hasInitialContent) {
//           delete (ydoc as any).__initialContent;
//           console.log("🧹 [CollabEditor] Cleared stale __initialContent");
//         }
//       }
//     }, [editor, ydoc, initialContent]);

//     // Debug: Track Y.Doc updates (keep if you’re actively debugging; remove later)
//     useEffect(() => {
//       if (!ydoc) return;

//       const handleUpdate = (update: Uint8Array, origin: any) => {
//         console.log("🔄 Y.Doc update detected in TipTapCollabEditor:", {
//           updateSize: update.length,
//           origin,
//           clientID: ydoc.clientID,
//         });
//       };

//       ydoc.on("update", handleUpdate);
//       return () => {
//         ydoc.off("update", handleUpdate);
//       };
//     }, [ydoc]);

//     // Log editor setup
//     useEffect(() => {
//       if (!editor || !ydoc) return;

//       const extensionNames = editor.extensionManager.extensions.map((e) => e.name);

//       // ✅ fast signal if something’s miswired
//       if (!extensionNames.includes("collaboration")) {
//         console.error("❌ Collab invariant failed: editor exists but Collaboration extension missing", {
//           extensionNames,
//           ydocClientID: ydoc.clientID,
//         });
//       }

//       console.log("🤝 TipTapCollabEditor: Editor ready", {
//         ydocClientID: ydoc.clientID,
//         extensionNames,
//       });
//     }, [editor, ydoc]);

//     useEffect(() => {
//       syncedRef.current = false;

//       // Best case: provider emits "synced"
//       if (yjsProvider?.on) {
//         const onSynced = () => {
//           syncedRef.current = true;
//           console.log("✅ [CollabEditor] Provider synced");
//         };

//         try {
//           yjsProvider.on("synced", onSynced);
//           return () => {
//             try { yjsProvider.off?.("synced", onSynced); } catch {}
//           };
//         } catch {
//           // ignore
//         }
//       }

//       // Fallback: assume synced shortly after mount (not ideal, but prevents immediate seed)
//       const t = setTimeout(() => {
//         syncedRef.current = true;
//         console.log("✅ [CollabEditor] Synced fallback timer fired");
//       }, 1200);

//       return () => clearTimeout(t);
//     }, [yjsProvider]);


//     const isBorderless = className.includes("borderless-editor");

//     return (
//       <React.Fragment>
//         <Box
//           className={className}
//           {...(!isBorderless && {
//             borderWidth: "1px",
//             borderRadius: "md",
//             p: 4,
//           })}
//           minH={isBorderless ? "auto" : "300px"}
//         >
//           <Box border={"1px solid gray"} pt={1} pl={1}>
//             <Prose
//               className="editor-content-prose"
//               bg={bgColorEditor}
//               maxW="full"
//               css={{ "& > *": { marginBlock: 0 } }}
//             >
//               <EditorContent editor={editor} />
//             </Prose>
//           </Box>
//         </Box>
//       </React.Fragment>
//     );
//   }
// );

// TipTapCollabEditor.displayName = "TipTapCollabEditor";
// export default TipTapCollabEditor;
