'use client';
import { useRouter } from 'next/navigation';

function deriveLabel(from: string): string {
  const groupMatch = from.match(/^\/groups\/([^/]+)/);
  if (groupMatch) return 'group';
  return 'previous page';
}

export function ProfileBackLink({ from, label }: { from: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(from)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.875rem',
        color: 'var(--ink-soft)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem 0',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      }}
    >
      ← Back to {label ?? deriveLabel(from)}
    </button>
  );
}
