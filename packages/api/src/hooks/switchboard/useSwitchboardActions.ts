import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  submitClassifyAsync,
  submitSummarizeAsync,
  submitContextShapeAsync,
  submitDraftAsync,
  submitRefineAsync,
  submitAdd,
  submitFind,
  submitTrack,
  submitResearchAsync,
  submitPatternAsync,
  submitSynthesizeAsync,
  submitSynthesizeNarrativeAsync,
  submitSynopsisLinkedInAsync,
  submitSynopsisPublicAsync,
  type ClassifyAsyncRequest,
  type SummarizeAsyncRequest,
  type ContextShapeAsyncRequest,
  type DraftAsyncRequest,
  type DraftActionResult,
  type RefineAsyncRequest,
  type RefineActionResult,
  type AddRequest,
  type AddResponse,
  type FindRequest,
  type FindResponse,
  type TrackRequest,
  type TrackResponse,
  type ResearchAsyncRequest,
  type ResearchActionResult,
  type PatternAsyncRequest,
  type PatternActionResult,
  type SynthesizeAsyncRequest,
  type SynthesizeActionResult,
  type SynthesizeNarrativeRequest,
  type SynthesizeNarrativeActionResult,
  type SynopsisLinkedInRequest,
  type SynopsisLinkedInActionResult,
  type SynopsisPublicRequest,
  type SynopsisPublicActionResult,
} from '../../clients/switchboard/switchboardApi';
import { approveActionRun, type ActionRun, type ApprovalMode } from '../../clients/switchboard/actionRunApi';
import { useActionRun } from '../initiatives/useActionRun';

export type {
  ClassifyAsyncRequest,
  SummarizeAsyncRequest,
  ContextShapeAsyncRequest,
  DraftAsyncRequest,
  DraftActionResult,
  RefineAsyncRequest,
  RefineActionResult,
  AddRequest,
  AddResponse,
  FindRequest,
  FindResponse,
  TrackRequest,
  TrackResponse,
  ResearchAsyncRequest,
  ResearchActionResult,
  PatternAsyncRequest,
  PatternActionResult,
  SynthesizeAsyncRequest,
  SynthesizeActionResult,
  SynthesizeNarrativeRequest,
  SynthesizeNarrativeActionResult,
  SynopsisLinkedInRequest,
  SynopsisLinkedInActionResult,
  SynopsisPublicRequest,
  SynopsisPublicActionResult,
  ApprovalMode,
};

function useAsyncAction<TPayload>(
  submitFn: (payload: TPayload) => Promise<{ action_run_id: string }>
) {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: submitFn,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result: Record<string, unknown> | null =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as Record<string, unknown>)
      : null;

  return {
    submit: submit.mutate,
    submitAsync: submit.mutateAsync,
    isSubmitting: submit.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error: submit.error ?? (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submit.reset();
    },
  };
}

export function useClassify() {
  return useAsyncAction<ClassifyAsyncRequest>(submitClassifyAsync);
}

export function useSummarize() {
  return useAsyncAction<SummarizeAsyncRequest>(submitSummarizeAsync);
}

export function useContextShape() {
  return useAsyncAction<ContextShapeAsyncRequest>(submitContextShapeAsync);
}

export function useRefine() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitLocal = useMutation({
    mutationFn: submitRefineAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const submitCloudMutation = useMutation({
    mutationFn: async (payload: RefineAsyncRequest & { approval_mode?: ApprovalMode }) => {
      const { approval_mode = 'standard', ...refinePayload } = payload;
      const { action_run_id } = await submitRefineAsync({ ...refinePayload, deferred: true });
      await approveActionRun(action_run_id, { approval_mode });
      return { action_run_id };
    },
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as RefineActionResult)
      : null;

  return {
    submit: submitLocal.mutate,
    submitAsync: submitLocal.mutateAsync,
    submitCloud: submitCloudMutation.mutate,
    submitCloudAsync: submitCloudMutation.mutateAsync,
    isSubmitting: submitLocal.isPending || submitCloudMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitLocal.error ??
      submitCloudMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitLocal.reset();
      submitCloudMutation.reset();
    },
  };
}

export function useDraft() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitLocal = useMutation({
    mutationFn: submitDraftAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  // Cloud path: create deferred ActionRun, then approve to dispatch with cloud_mode=True
  const submitCloudMutation = useMutation({
    mutationFn: async (payload: DraftAsyncRequest & { approval_mode?: ApprovalMode }) => {
      const { approval_mode = 'standard', ...draftPayload } = payload;
      const { action_run_id } = await submitDraftAsync({ ...draftPayload, deferred: true });
      await approveActionRun(action_run_id, { approval_mode });
      return { action_run_id };
    },
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as DraftActionResult)
      : null;

  return {
    submit: submitLocal.mutate,
    submitAsync: submitLocal.mutateAsync,
    submitCloud: submitCloudMutation.mutate,
    submitCloudAsync: submitCloudMutation.mutateAsync,
    isSubmitting: submitLocal.isPending || submitCloudMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitLocal.error ??
      submitCloudMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitLocal.reset();
      submitCloudMutation.reset();
    },
  };
}

export function useAdd() {
  const mutation = useMutation<AddResponse, Error, AddRequest>({
    mutationFn: submitAdd,
  });

  return {
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    result: mutation.data ?? null,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useFind() {
  const mutation = useMutation<FindResponse, Error, FindRequest>({
    mutationFn: submitFind,
  });

  return {
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    result: mutation.data ?? null,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useTrack() {
  const mutation = useMutation<TrackResponse, Error, TrackRequest>({
    mutationFn: submitTrack,
  });

  return {
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    result: mutation.data ?? null,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function usePattern() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: submitPatternAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as PatternActionResult)
      : null;

  return {
    submit: submitMutation.mutate,
    submitAsync: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitMutation.reset();
    },
  };
}

export function useResearch() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: submitResearchAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as ResearchActionResult)
      : null;

  return {
    submit: submitMutation.mutate,
    submitAsync: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitMutation.reset();
    },
  };
}

export function useSynthesize() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: submitSynthesizeAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as SynthesizeActionResult)
      : null;

  return {
    submit: submitMutation.mutate,
    submitAsync: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitMutation.reset();
    },
  };
}

export function useSynthesizeNarrative() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: submitSynthesizeNarrativeAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as SynthesizeNarrativeActionResult)
      : null;

  return {
    submit: submitMutation.mutate,
    submitAsync: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitMutation.reset();
    },
  };
}

export function useSynopsisLinkedIn() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: submitSynopsisLinkedInAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as SynopsisLinkedInActionResult)
      : null;

  return {
    submit: submitMutation.mutate,
    submitAsync: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitMutation.reset();
    },
  };
}

export function useSynopsisPublic() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: submitSynopsisPublicAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);
  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as SynopsisPublicActionResult)
      : null;

  return {
    submit: submitMutation.mutate,
    submitAsync: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error:
      submitMutation.error ??
      (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submitMutation.reset();
    },
  };
}
