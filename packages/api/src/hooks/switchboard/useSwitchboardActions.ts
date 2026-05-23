import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  submitClassifyAsync,
  submitSummarizeAsync,
  submitContextShapeAsync,
  submitDraftAsync,
  type ClassifyAsyncRequest,
  type SummarizeAsyncRequest,
  type ContextShapeAsyncRequest,
  type DraftAsyncRequest,
  type DraftActionResult,
} from '../../clients/switchboard/switchboardApi';
import { useActionRun } from '../initiatives/useActionRun';
import type { ActionRun } from '../../clients/switchboard/actionRunApi';

export type {
  ClassifyAsyncRequest,
  SummarizeAsyncRequest,
  ContextShapeAsyncRequest,
  DraftAsyncRequest,
  DraftActionResult,
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

export function useDraft() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: submitDraftAsync,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as DraftActionResult)
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
