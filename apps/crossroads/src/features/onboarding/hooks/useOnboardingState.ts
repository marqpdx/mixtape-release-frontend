"use client";

import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";

export interface OnboardingState {
  wizardComplete: boolean;
  highlightTourComplete: boolean;
  currentStep: number;
  currentHighlight: number;
}

const DEFAULT: OnboardingState = {
  wizardComplete: false,
  highlightTourComplete: false,
  currentStep: 0,
  currentHighlight: 0,
};

export function useOnboardingState(groupSlug: string) {
  const [state, setState, hydrated] = useLocalStorageState<OnboardingState>(
    `onboarding-${groupSlug}`,
    DEFAULT,
  );

  const update = (partial: Partial<OnboardingState>) =>
    setState({ ...state, ...partial });

  return { state, update, hydrated };
}
