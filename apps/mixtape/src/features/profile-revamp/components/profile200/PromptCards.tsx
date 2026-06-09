'use client';

interface PromptCardsProps {
  whoAreYou: string;
  whyAreYouHere: string;
}

function PromptCard({ heading, body }: { heading: string; body: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
    }}>
      <p style={{
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        margin: '0 0 8px 0',
      }}>
        {heading}
      </p>
      <p style={{
        fontFamily: 'var(--font-read)',
        fontSize: 16,
        lineHeight: 1.5,
        color: 'var(--ink-2)',
        textWrap: 'pretty' as React.CSSProperties['textWrap'],
        margin: 0,
      }}>
        {body}
      </p>
    </div>
  );
}

export function PromptCards({ whoAreYou, whyAreYouHere }: PromptCardsProps) {
  if (!whoAreYou && !whyAreYouHere) return null;

  return (
    <div
      className="p200-promptcards-root"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 22,
      }}
    >
      {whoAreYou && <PromptCard heading="Who I am" body={whoAreYou} />}
      {whyAreYouHere && <PromptCard heading="Why I'm here" body={whyAreYouHere} />}
    </div>
  );
}
