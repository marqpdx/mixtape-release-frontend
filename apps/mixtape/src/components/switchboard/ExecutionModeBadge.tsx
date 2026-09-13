'use client';

import { Badge } from '@chakra-ui/react';
import type { ActionRun } from '@mixtape/api/clients/switchboard/actionRunApi';

interface ExecutionModeBadgeProps {
  actionRun: ActionRun | null;
}

/**
 * SW-8 execution indicator — surfaces the "Local" / "Cloud (approved)"
 * distinction named in switchboard-mcp-adr.md's escalation example. The
 * ActionRun.cloud_approved field already exists on every action run;
 * this is the first place it's actually rendered.
 */
export default function ExecutionModeBadge({ actionRun }: ExecutionModeBadgeProps) {
  if (!actionRun || actionRun.status !== 'succeeded') return null;

  return actionRun.cloud_approved ? (
    <Badge className="emb-cloud" colorPalette="purple" variant="subtle" fontSize="xs">
      Cloud (approved)
    </Badge>
  ) : (
    <Badge className="emb-local" colorPalette="gray" variant="subtle" fontSize="xs">
      Local
    </Badge>
  );
}
