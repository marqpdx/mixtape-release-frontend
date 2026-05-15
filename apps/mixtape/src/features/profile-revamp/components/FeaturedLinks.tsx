import type { LinkDTO } from '../api/types';

interface Props { links: LinkDTO[] }

const ICON_LABELS: Record<string, string> = {
  IG: 'IG', SH: 'SH', NL: 'NL', PR: 'PR',
  BC: 'BC', SC: 'SC', YT: 'YT', EM: 'EM', IT: 'IT', BG: 'BG',
};

export default function FeaturedLinks({ links }: Props) {
  if (!links.length) return null;
  return (
    <section>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Links</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(link => (
          <li key={link.position}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--rule)', textDecoration: 'none', color: 'var(--ink)' }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, width: 24, textAlign: 'center', color: 'var(--accent)' }}>
                {ICON_LABELS[link.icon] ?? link.icon}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{link.title}</p>
                {link.sub && <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)' }}>{link.sub}</p>}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
