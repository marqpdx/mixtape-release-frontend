import { useEffect, useRef, useState } from "react";
import { getActionRun, ActionRun } from "@mixtape/api/clients/switchboard/actionRunApi";

const TERMINAL_STATUSES: ActionRun["status"][] = ["succeeded", "failed"];
const POLL_INTERVAL_MS = 2000;

export function useActionRun(id: string | null): ActionRun | null {
  const [actionRun, setActionRun] = useState<ActionRun | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) {
      setActionRun(null);
      return;
    }

    const poll = async () => {
      try {
        const run = await getActionRun(id);
        setActionRun(run);
        if (TERMINAL_STATUSES.includes(run.status)) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      } catch {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    };

    void poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id]);

  return actionRun;
}
