export default function SunsetBg() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="pr-sun" cx="50%" cy="120%" r="80%">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="1" stopColor="#db2777" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#pr-sun)" />
    </svg>
  );
}
