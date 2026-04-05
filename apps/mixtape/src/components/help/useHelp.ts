"use client";

import { useMemo } from "react";
import { useHelpContext } from "./HelpProvider";

export function useHelp() {
  const context = useHelpContext();

  const resolvedHelp = useMemo(() => context.resolveHelp(), [context]);

  return {
    ...context,
    resolvedHelp,
  };
}
