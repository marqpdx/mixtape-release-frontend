import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  submitRetrieveAsync,
  submitFindAsync,
} from '../../clients/puddlejump/puddlejumpApi';
import { useActionRun } from '../initiatives/useActionRun';
import type {
  RetrieveAsyncRequest,
  RetrieveActionResult,
} from '@mixtape/core/types/puddlejump';

export type { RetrieveAsyncRequest, RetrieveActionResult };

function useAsyncVerb(
  submitFn: (payload: RetrieveAsyncRequest) => Promise<{ action_run_id: string }>
) {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: submitFn,
    onSuccess: (data) => setActionRunId(data.action_run_id),
  });

  const poll = useActionRun(actionRunId);

  const result =
    poll.data?.status === 'succeeded'
      ? (poll.data.result_payload as unknown as RetrieveActionResult)
      : null;

  return {
    submit: submit.mutate,
    submitAsync: submit.mutateAsync,
    isSubmitting: submit.isPending,
    actionRunId,
    actionRun: poll.data ?? null,
    isPolling: poll.isFetching && !!actionRunId,
    result,
    error: submit.error ?? (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      submit.reset();
    },
  };
}

export function useRetrieve() {
  return useAsyncVerb(submitRetrieveAsync);
}

export function useFind() {
  return useAsyncVerb(submitFindAsync);
}
