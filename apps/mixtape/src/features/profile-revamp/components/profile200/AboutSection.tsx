'use client';

interface AboutSectionProps {
  quickIntro: string;
}

export function AboutSection({ quickIntro }: AboutSectionProps) {
  if (!quickIntro) return null;

  return (
    <div className="p200-about-root">
      <p style={{
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        margin: 0,
      }}>
        About
      </p>
      <p style={{
        fontFamily: 'var(--font-read)',
        fontSize: 21,
        lineHeight: 1.5,
        color: 'var(--ink)',
        textWrap: 'pretty' as React.CSSProperties['textWrap'],
        marginTop: 12,
        marginBottom: 0,
      }}>
        {quickIntro}
      </p>
    </div>
  );
}
