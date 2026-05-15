import type { QAItemDTO } from '../api/types';
import { sanitizeQA } from '../lib/sanitize';

interface Props { qa: QAItemDTO[] }

export default function AboutQA({ qa }: Props) {
  if (!qa.length) return null;
  return (
    <section>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>About</h3>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 12, columnGap: 16 }}>
        {qa.map(item => (
          <>
            <dt key={`q-${item.position}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', paddingTop: 2 }}>{item.q}</dt>
            <dd
              key={`a-${item.position}`}
              style={{ margin: 0, fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: sanitizeQA(item.a) }}
            />
          </>
        ))}
      </dl>
    </section>
  );
}
