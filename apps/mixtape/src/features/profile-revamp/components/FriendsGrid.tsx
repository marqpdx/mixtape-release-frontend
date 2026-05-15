import Image from 'next/image';
import type { FriendDTO } from '../api/types';

interface Props { friends: FriendDTO[] }

export default function FriendsGrid({ friends }: Props) {
  if (!friends.length) return null;
  return (
    <section>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Friends</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 12 }}>
        {friends.map(friend => (
          <a key={friend.username} href={`/member/handle/${friend.username}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface)', border: '1.5px solid var(--rule)' }}>
                {friend.avatarUrl ? (
                  <Image src={friend.avatarUrl} alt={friend.displayName} width={48} height={48} style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ink-soft)' }}>
                    {friend.displayName?.[0] ?? '?'}
                  </div>
                )}
              </div>
              {friend.online && (
                <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg)' }} />
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 76 }}>
              {friend.displayName}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
