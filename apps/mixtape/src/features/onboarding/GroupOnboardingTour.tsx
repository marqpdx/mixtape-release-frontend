"use client";

// Temporary kill switch — onboarding tour intentionally disabled for now.
const TOUR_ENABLED = false;

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useOnboardingState } from "./hooks/useOnboardingState";
import { TourModal } from "./components/TourModal";
import { HighlightTour } from "./components/highlight/HighlightTour";

interface GroupOnboardingTourProps {
  groupSlug: string;
  groupTitle: string;
  groupEmblemUrl?: string;
  isMember: boolean;
}

/**
 * Drop this into any group page. Renders nothing until hydrated.
 * Shows the wizard modal on first authenticated visit, then the
 * Phase 2 highlight tour after the wizard is completed.
 */
export function GroupOnboardingTour({
  groupSlug,
  groupTitle,
  groupEmblemUrl,
  isMember,
}: GroupOnboardingTourProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { state, update, hydrated } = useOnboardingState(groupSlug);
  const [showHighlight, setShowHighlight] = useState(false);

  // Delay highlight tour activation slightly after wizard dismisses
  useEffect(() => {
    if (state.wizardComplete && !state.highlightTourComplete) {
      const timer = setTimeout(() => setShowHighlight(true), 600);
      return () => clearTimeout(timer);
    } else {
      setShowHighlight(false);
    }
  }, [state.wizardComplete, state.highlightTourComplete]);

  // Nothing to render until we know auth state and localStorage is hydrated
  if (!TOUR_ENABLED || !hydrated || authLoading || !isAuthenticated || !user || !isMember) return null;

  const username = user.username ?? "";
  const quickIntro = user.profile?.quick_intro ?? "";

  function handleWizardComplete(skipHighlight = false) {
    update({
      wizardComplete: true,
      highlightTourComplete: skipHighlight,
    });
  }

  function handleHighlightStopChange(stop: number) {
    update({ currentHighlight: stop });
  }

  function handleHighlightComplete() {
    update({ highlightTourComplete: true });
    setShowHighlight(false);
  }

  return (
    <>
      <TourModal
        groupSlug={groupSlug}
        groupTitle={groupTitle}
        groupEmblemUrl={groupEmblemUrl}
        username={username}
        quickIntro={quickIntro}
        isOpen={!state.wizardComplete}
        onComplete={handleWizardComplete}
      />

      {showHighlight && (
        <HighlightTour
          groupName={groupTitle}
          initialStop={state.currentHighlight}
          onStopChange={handleHighlightStopChange}
          onComplete={handleHighlightComplete}
        />
      )}
    </>
  );
}
