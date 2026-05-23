import { useQuery } from '@tanstack/react-query';
import { getActionRun, type ActionRun } from '../../clients/switchboard/actionRunApi';

export const actionRunQueryKeys = {
  all: ['action-runs'] as const,
  detail: (id: string) => [...actionRunQueryKeys.all, id] as const,
};

export function useActionRun(actionRunId: string | null) {
  return useQuery<ActionRun>({
    queryKey: actionRunQueryKeys.detail(actionRunId ?? ''),
    queryFn: () => getActionRun(actionRunId!),
    enabled: !!actionRunId,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'succeeded' || status === 'failed') return false;
      return 1500;
    },
  });
}
