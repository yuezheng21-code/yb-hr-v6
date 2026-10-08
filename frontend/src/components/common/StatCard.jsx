/** Minimal stat tile: label, value, optional note. `icon` is accepted for backward compatibility but not rendered. */
export default function StatCard({ label, value, sub, color }) {
  return (
    <div className="sc">
      <div className="sl">{label}</div>
      <div className="sv" style={color ? { color } : undefined}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 8 }}>{sub}</div>}
    </div>
  );
}
