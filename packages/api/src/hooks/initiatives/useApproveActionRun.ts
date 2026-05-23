import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  approveActionRun,
  type ApproveActionRunRequest,
  type ActionRun,
} from '../../clients/switchboard/actionRunApi';
import { useActionRun } from './useActionRun';

export function useApproveActionRun() {
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  const approve = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveActionRunRequest }) =>
      approveActionRun(id, payload),
    onSuccess: (data) => {
      setActionRunId(data.id);
    },
  });

  const poll = useActionRun(actionRunId);

  return {
    approve: (id: string, payload: ApproveActionRunRequest = {}) =>
      approve.mutate({ id, payload }),
    approveAsync: (id: string, payload: ApproveActionRunRequest = {}) =>
      approve.mutateAsync({ id, payload }),
    isApproving: approve.isPending,
    actionRunId,
    actionRun: (poll.data ?? null) as ActionRun | null,
    isPolling: poll.isFetching && !!actionRunId,
    error: approve.error ?? (poll.data?.status === 'failed' ? poll.data.error_payload : null),
    reset: () => {
      setActionRunId(null);
      approve.reset();
    },
  };
}
