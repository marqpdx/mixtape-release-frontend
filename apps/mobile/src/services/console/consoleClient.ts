import {
  fetchOrientation,
  fetchReentry,
  fetchSignals,
  fetchStewardship,
} from '@mixtape/api/clients/console/consoleApi';
import type { ConsoleSurfaceData } from '../../types/console';

export interface ConsoleClient {
  getSurfaceData: () => Promise<ConsoleSurfaceData>;
}

function formatRelativeDayLabel(isoValue: string | null | undefined, fallback: string) {
  if (!isoValue) {
    return fallback;
  }

  const value = new Date(isoValue);
  if (Number.isNaN(value.getTime())) {
    return fallback;
  }

  return value.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const consoleClient: ConsoleClient = {
  async getSurfaceData() {
    const [reentry, signals, orientation, stewardship] = await Promise.all([
      fetchReentry(),
      fetchSignals(),
      fetchOrientation(),
      fetchStewardship(),
    ]);

    return {
      reentryItems: reentry.items.map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind === 'reading' ? 'Reading' : 'Draft',
        detail: item.status || 'Recent item',
      })),
      signalGroups: [
        ...signals.markers.map((group) => ({
          id: `marker-${group.signal}`,
          marker:
            group.symbol === '/!' || group.symbol === '/~' || group.symbol === '/?' || group.symbol === '/@'
              ? group.symbol
              : '/?',
          title: group.label,
          items: group.items.map((item) => item.body || item.label || item.piece_title),
        })),
        ...(signals.flagged_darts.length > 0
          ? [
              {
                id: 'flagged-darts',
                marker: '/!' as const,
                title: 'Flagged darts',
                items: signals.flagged_darts.map((item) => item.note_text || item.selected_text || item.piece_title),
              },
            ]
          : []),
        ...(signals.flagged_rereads.length > 0
          ? [
              {
                id: 'flagged-rereads',
                marker: '/~' as const,
                title: 'Flagged rereads',
                items: signals.flagged_rereads.map(
                  (item) =>
                    `${item.piece_title}${item.last_read_at ? ` • last read ${formatRelativeDayLabel(item.last_read_at, 'recently')}` : ''}`
                ),
              },
            ]
          : []),
      ],
      orientationSections: [
        {
          id: 'ori-initiatives',
          title: 'Active initiatives',
          items: orientation.initiatives.map((item) => ({
            id: item.id,
            label: item.title,
            detail: `${item.status} • updated ${formatRelativeDayLabel(item.updated_at, 'recently')}`,
          })),
        },
        {
          id: 'ori-groups',
          title: 'Active groups',
          items: orientation.groups.map((item) => ({
            id: item.id,
            label: item.title,
            detail: `${item.group_type} • updated ${formatRelativeDayLabel(item.updated_at, 'recently')}`,
          })),
        },
      ],
      stewardshipItems: [
        ...stewardship.stale_drafts.map(
          (item) => `${item.title} • stale ${item.days_stale}d${item.updated_at ? ` • updated ${formatRelativeDayLabel(item.updated_at, 'recently')}` : ''}`
        ),
        ...stewardship.overdue_reminders.map(
          (item) => `${item.title} • overdue ${item.days_overdue}d${item.body ? ` • ${item.body}` : ''}`
        ),
        ...stewardship.unresolved_questions.map((item) => item.body || item.label || item.piece_title),
      ],
    };
  },
};

export function getConsoleClient(): ConsoleClient {
  return consoleClient;
}
