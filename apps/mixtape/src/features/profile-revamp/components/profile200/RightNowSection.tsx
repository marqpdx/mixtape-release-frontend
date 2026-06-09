'use client';

interface RightNowSectionProps {
  status: string;
}

export function RightNowSection({ status }: RightNowSectionProps) {
  if (!status) return null;

  return (
    <>
      <style>{`
        @keyframes p200-pulse {
          0%   { transform: scale(0.7); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .p200-rn-pulse { animation: none !important; }
        }
      `}</style>
      <div
        className="p200-rn-root"
        style={{
          background: 'var(--warm)',
          border: '1px solid color-mix(in srgb, var(--accent) 32%, var(--warm))',
          borderRadius: 'var(--radius)',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', width: 9, height: 9, flexShrink: 0 }}>
            <div style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: 'var(--accent)',
            }} />
            <div
              className="p200-rn-pulse"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '1.5px solid var(--accent)',
                animation: 'p200-pulse 2.1s ease-out infinite',
              }}
            />
          </div>
          <p style={{
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'color-mix(in srgb, var(--accent) 75%, var(--ink))',
            margin: 0,
          }}>
            Right now
          </p>
        </div>
        <p style={{
          fontSize: 16,
          lineHeight: 1.5,
          fontWeight: 500,
          color: 'var(--ink)',
          marginTop: 11,
          marginBottom: 0,
        }}>
          {status}
        </p>
      </div>
    </>
  );
}
