// src/lib/dispatch/yjs/useTipTapYjsSocketProvider.ts

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { CustomSocketIOAdapter } from "./customSocketIoAdapter";
import { TipTapDoc } from "@/types/dispatchTypes";

interface UserInfo {
  name: string;
  color: string;
}

interface TipTapYjsProviderOptions {
  user: UserInfo;
  initialContent?: TipTapDoc;
  enabled?: boolean;
}

interface TipTapYjsProviderResult {
  provider: CustomSocketIOAdapter | null;
  ydoc: Y.Doc | null;
  status: "connecting" | "connected" | "disconnected";
  isInitialized: boolean; // ✅ NEW: Track if content has been initialized
}

export function useTipTapYjsSocketProvider(
  documentId: string,
  options: TipTapYjsProviderOptions
): TipTapYjsProviderResult {
  const enabled = options.enabled ?? true;
  const hasInitialized = useRef(false);

  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">(
    enabled ? "connecting" : "disconnected"
  );
  const [provider, setProvider] = useState<CustomSocketIOAdapter | null>(null);
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    console.log("🚀 Initializing YJS provider for document:", documentId);

    const doc = new Y.Doc();
    setYDoc(doc);

    let ioProvider: CustomSocketIOAdapter;

    const setup = async () => {
      try {
        ioProvider = new CustomSocketIOAdapter(doc, {
          documentId,
          user: options.user,
        });

        await ioProvider.initialize();
        setProvider(ioProvider);

        ioProvider.socket.on("connect", () => {
          console.log("🔌 Socket connected, waiting for sync...");
          setStatus("connected");
        });

        ioProvider.socket.on("disconnect", () => {
          console.log("🔌 Socket disconnected");
          setStatus("disconnected");
        });

        ioProvider.socket.on("error", (error: any) => {
          console.error("🔌 Socket error:", error);
          setStatus("disconnected");
        });

        ioProvider.socket.on("synced", () => {
          console.log("🔄 YJS synced with server");

          if (!doc || doc.isDestroyed) {
            console.warn("⚠️ YJS document was destroyed during sync");
            return;
          }

          if (options.initialContent && !hasInitialized.current) {
            try {
              const yXmlFragment = doc.getXmlFragment("default");

              if (yXmlFragment.length === 0) {
                console.log("📝 Initializing empty YJS document with saved content");

                doc.transact(() => {
                  if (options.initialContent?.content) {
                    importTipTapContentToYJS(yXmlFragment, {
                      type: "doc",
                      content: options.initialContent.content,
                    });
                  }
                });

                console.log("✅ YJS document initialized with saved content");
              } else {
                console.log("📄 YJS document already has content, skipping initialization");
              }

              hasInitialized.current = true;
              setIsInitialized(true);
            } catch (error) {
              console.error("❌ Error initializing YJS content:", error);
              hasInitialized.current = true;
              setIsInitialized(true);
            }
          } else {
            hasInitialized.current = true;
            setIsInitialized(true);
          }
        });
      } catch (error) {
        console.error("❌ Error creating YJS provider:", error);
        setStatus("disconnected");
      }
    };

    setup();

    return () => {
      console.log("🧹 Cleaning up YJS provider");
      try {
        ioProvider?.disconnect();
      } catch (error) {
        console.error("Error disconnecting provider:", error);
      }
      try {
        if (!doc.isDestroyed) {
          doc.destroy();
        }
      } catch (error) {
        console.error("Error destroying document:", error);
      }
      hasInitialized.current = false;
      setIsInitialized(false);
      setProvider(null);
      setYDoc(null);
    };
  }, [documentId, enabled, options.initialContent?.content]);



  return {
    provider,
    ydoc,
    status,
    isInitialized,
  };
}

// Helper function to convert TipTap JSON to YJS XML operations
function importTipTapContentToYJS(yXmlFragment: Y.XmlFragment, tipTapDoc: TipTapDoc) {
  if (!tipTapDoc.content || tipTapDoc.content.length === 0) return;

  tipTapDoc.content.forEach((node, index) => {
    const xmlElement = convertNodeToXmlElement(node);
    if (xmlElement) {
      yXmlFragment.insert(index, [xmlElement]);
    }
  });
}

function convertNodeToXmlElement(node: any): Y.XmlElement | Y.XmlText | null {
  if (node.type === "text") {
    return new Y.XmlText(node.text || "");
  }

  if (node.type === "paragraph") {
    const element = new Y.XmlElement("paragraph");
    if (node.content) {
      node.content.forEach((child: any, index: number) => {
        const childElement = convertNodeToXmlElement(child);
        if (childElement) {
          element.insert(index, [childElement]);
        }
      });
    }
    return element;
  }

  if (node.type === "heading") {
    const element = new Y.XmlElement("heading");
    if (node.attrs?.level) {
      element.setAttribute("level", node.attrs.level.toString());
    }
    if (node.content) {
      node.content.forEach((child: any, index: number) => {
        const childElement = convertNodeToXmlElement(child);
        if (childElement) {
          element.insert(index, [childElement]);
        }
      });
    }
    return element;
  }

  // Add more node types as needed
  console.warn(`Unknown node type: ${node.type}`);
  return null;
}

