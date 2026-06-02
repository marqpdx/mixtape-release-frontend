'use client';
import { useProfileDrawer } from '../stores/profileDrawerStore';

interface Props {
  username: string;
  children: React.ReactNode;
}

export function ProfileDrawerTrigger({ username, children }: Props) {
  const open = useProfileDrawer(s => s.open);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.preventDefault(); open(username); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(username); } }}
      style={{ cursor: 'pointer', display: 'contents' }}
    >
      {children}
    </span>
  );
}
