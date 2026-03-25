export default function StatCard({ icon, label, value, sub, color = 'var(--ac)' }) {
  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:'var(--R2)',padding:'16px 20px',display:'flex',gap:14,alignItems:'center' }}>
      <div style={{ fontSize:28,width:44,height:44,borderRadius:'var(--R1)',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize:11,color:'var(--tx3)',marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:22,fontWeight:700,color }}>{value}</div>
        {sub && <div style={{ fontSize:10,color:'var(--tx3)',marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}
