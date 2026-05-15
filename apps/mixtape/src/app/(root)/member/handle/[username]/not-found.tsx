export default function ProfileNotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: '#7a7367' }}>
      <p style={{ fontSize: 48, margin: 0 }}>?</p>
      <p style={{ fontSize: 18, margin: 0 }}>No member found at this address.</p>
      <a href="/" style={{ fontSize: 14, color: '#c2410c' }}>← Back to Mixtape</a>
    </div>
  );
}
