"use client";

import { useEffect, useState } from "react";
import { HIGHLIGHT_TARGETS, resolveTarget } from "./useHighlightTargets";
import { CoachCard } from "./CoachCard";

// Stops that exist in the DOM (resolved at runtime).
// Stops missing from the DOM are skipped gracefully.

interface HighlightTourProps {
  groupName: string;
  initialStop: number;
  onStopChange: (stop: number) => void;
  onComplete: () => void;
}

export function HighlightTour({
  groupName,
  initialStop,
  onStopChange,
  onComplete,
}: HighlightTourProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStop);
  // Resolved targets — only those present in the DOM
  const [activeTargets, setActiveTargets] = useState(HIGHLIGHT_TARGETS);

  // Filter to DOM-present targets on mount (after hydration)
  useEffect(() => {
    const present = HIGHLIGHT_TARGETS.filter((t) => resolveTarget(t.key) !== null);
    setActiveTargets(present.length > 0 ? present : HIGHLIGHT_TARGETS);
  }, []);

  const total = activeTargets.length;
  const isFinal = currentIndex >= total;

  function go(index: number) {
    const clamped = Math.max(0, Math.min(index, total));
    setCurrentIndex(clamped);
    onStopChange(clamped);
  }

  const current = activeTargets[currentIndex];

  if (isFinal || !current) {
    return (
      <CoachCard
        heading=""
        copy=""
        currentIndex={currentIndex}
        total={total}
        groupName={groupName}
        isFinal
        onNext={() => {}}
        onPrev={() => go(currentIndex - 1)}
        onDismiss={onComplete}
      />
    );
  }

  return (
    <CoachCard
      heading={current.heading}
      copy={current.copy}
      currentIndex={currentIndex}
      total={total}
      groupName={groupName}
      isFinal={false}
      onNext={() => go(currentIndex + 1)}
      onPrev={() => go(currentIndex - 1)}
      onDismiss={onComplete}
    />
  );
}
