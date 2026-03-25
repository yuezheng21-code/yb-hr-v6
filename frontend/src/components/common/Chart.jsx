export default function Chart({ data = [], labelKey = 'label', valueKey = 'value', color = 'var(--ac)', height = 120 }) {
  if (!data.length) return <div style={{ height,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx3)',fontSize:11 }}>—</div>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const barW = Math.floor(100 / data.length);
  return (
    <svg width="100%" height={height} style={{ overflow:'visible' }}>
      {data.map((d, i) => {
        const h = Math.round((d[valueKey] / max) * (height - 20));
        const x = `${i * barW + barW * 0.1}%`;
        const w = `${barW * 0.8}%`;
        return (
          <g key={i}>
            <rect x={x} y={height - 20 - h} width={w} height={h} fill={color} rx="3" opacity="0.8" />
            <text x={`${i * barW + barW / 2}%`} y={height - 4} textAnchor="middle" fontSize="9" fill="var(--tx3)">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}
