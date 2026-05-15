import type { ActivityDTO } from '../api/types';
import { formatDistanceToNow } from 'date-fns';

interface Props { activity: ActivityDTO[] }

export default function ActivityFeed({ activity }: Props) {
  if (!activity.length) return null;
  return (
    <section>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Activity</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activity.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap', paddingTop: 2 }}>
              {formatDistanceToNowSafe(item.when)}
            </span>
            <span style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.4 }}>{item.what}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatDistanceToNowSafe(when: string): string {
  try {
    return formatDistanceToNow(new Date(when), { addSuffix: false });
  } catch {
    return when;
  }
}
