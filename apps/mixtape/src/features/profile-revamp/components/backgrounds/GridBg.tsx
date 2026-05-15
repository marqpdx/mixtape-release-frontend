export default function GridBg() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', color: 'currentColor' }}>
      <defs>
        <pattern id="pr-grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.1" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#pr-grid)" />
    </svg>
  );
}
