"use client";

import { useState } from "react";
import type { TypographySetting } from "../types";

interface Props {
  listSlug: string;
  setting: TypographySetting;
}

export function MastheadSubscribeForm({ listSlug, setting }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const isJournal = setting === "journal";
  const bodySize = isJournal ? "1.188rem" : "1.063rem";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
      const res = await fetch(`${baseUrl}/api/lanternmail/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list_slug: listSlug }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p style={{ color: "var(--theme-text-secondary)", fontSize: bodySize, margin: 0 }}>
        You&rsquo;re subscribed.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        style={{
          flex: "1 1 200px",
          padding: "8px 12px",
          fontSize: bodySize,
          border: "1px solid var(--theme-border)",
          background: "var(--theme-bg)",
          color: "var(--theme-text)",
          outline: "none",
          borderRadius: "0",
          fontFamily: "inherit",
        }}
        onFocus={(e) => { e.currentTarget.style.outline = "2px solid var(--theme-accent-soft)"; e.currentTarget.style.outlineOffset = "2px"; }}
        onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
      />
      {isJournal ? (
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "8px 0",
            fontSize: bodySize,
            fontWeight: "600",
            color: "var(--theme-text)",
            background: "transparent",
            border: "none",
            cursor: status === "loading" ? "wait" : "pointer",
            textDecoration: "underline",
            textDecorationColor: "var(--theme-accent)",
            textDecorationThickness: "2px",
            fontFamily: "inherit",
          }}
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      ) : (
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "8px 20px",
            fontSize: bodySize,
            fontWeight: "600",
            background: "var(--theme-accent)",
            color: "var(--theme-bg)",
            border: "none",
            borderRadius: "0",
            cursor: status === "loading" ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      )}
      {status === "error" && (
        <p style={{ width: "100%", color: "var(--theme-text-secondary)", fontSize: "0.875rem", margin: "4px 0 0" }}>
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
