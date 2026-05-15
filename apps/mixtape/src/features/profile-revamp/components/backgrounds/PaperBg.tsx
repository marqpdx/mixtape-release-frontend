export default function PaperBg() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <pattern id="pr-grain" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.4" fill="currentColor" opacity="0.06" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#pr-grain)" />
    </svg>
  );
}
