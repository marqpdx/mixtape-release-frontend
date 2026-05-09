export type WorkTableContext =
  | { kind: "personal" }
  | { kind: "group"; id: string; slug: string; title: string; color?: string }
  | { kind: "initiative"; id: string; title: string; sponsor: "personal" | "group" };
