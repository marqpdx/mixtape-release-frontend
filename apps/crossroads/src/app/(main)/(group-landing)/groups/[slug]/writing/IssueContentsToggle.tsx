"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import styles from "./IssueCollection.module.css";

const DisclosureContext = createContext<{ expanded: boolean; toggle: () => void } | null>(null);

function useDisclosure() {
  const disclosure = useContext(DisclosureContext);
  if (!disclosure) throw new Error("Issue contents controls require IssueDisclosure");
  return disclosure;
}

export function IssueDisclosure({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <DisclosureContext.Provider value={{ expanded, toggle: () => setExpanded((current) => !current) }}>
      {children}
    </DisclosureContext.Provider>
  );
}

export function IssueContentsToggle({
  contentsId,
  count,
  remaining,
}: {
  contentsId: string;
  count: number;
  remaining?: number;
}) {
  const { expanded, toggle } = useDisclosure();
  return (
    <button
      type="button"
      className={remaining ? styles.more : styles.button}
      aria-expanded={expanded}
      aria-controls={contentsId}
      onClick={toggle}
    >
      {remaining
        ? (expanded ? "Hide pieces" : `+${remaining} more`)
        : (expanded ? "Hide pieces" : `Show all ${count} ${count === 1 ? "piece" : "pieces"}`)}
      {!remaining && <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>}
    </button>
  );
}

export function IssueContents({ id, children }: { id: string; children: ReactNode }) {
  const { expanded } = useDisclosure();
  return <div id={id} className={`gic-contents ${styles.contents}`} hidden={!expanded}>{children}</div>;
}
