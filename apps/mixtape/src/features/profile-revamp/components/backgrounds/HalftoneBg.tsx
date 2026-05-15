export default function HalftoneBg() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', color: 'currentColor' }}>
      <defs>
        <pattern id="pr-dots" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.6" fill="currentColor" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#pr-dots)" />
    </svg>
  );
}
