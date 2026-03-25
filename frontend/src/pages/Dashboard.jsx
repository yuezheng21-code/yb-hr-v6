import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';

export default function Dashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    api('/api/analytics/dashboard', { token })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Loading />;
  if (!data) return <div className="tm">{t('c.load_fail')}</div>;

  const mx = Math.max(...(data.daily_hours || []).map(d => d.total_hours), 1);

  const stats = [
    [data.employee_count, t('dash.employees'), 'var(--cy)', '👥'],
    [data.ts_pending, t('dash.pending_ts'), 'var(--og)', '⏳'],
    [data.ts_total_hours + 'h', t('dash.total_hours'), 'var(--pp)', '⏱️'],
    [data.abmahnung_active, t('dash.abmahnung'), 'var(--rd)', '⚠️'],
    [data.zeitkonto_alerts, t('dash.zk_alerts'), 'var(--og)', '📊'],
    [data.wv_active_projects, t('dash.wv_active'), 'var(--gn)', '📋'],
  ];

  return (
    <div>
      <div className="sr">
        {stats.map(([value, label, color, icon], idx) => (
          <div key={idx} className="sc">
            <div className="sl">{icon} {label}</div>
            <div className="sv" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {data.zeitkonto_alerts > 0 && (
        <div className="alert alert-og">
          ⚠ <b>{data.zeitkonto_alerts}</b> 名员工 Zeitkonto 超过+150h，请安排 Freizeitausgleich（§4 ArbZG）
        </div>
      )}
      {data.abmahnung_active > 0 && (
        <div className="alert alert-rd">
          ⚠ <b>{data.abmahnung_active}</b> 份 Abmahnung 有效中，请检查是否有员工达到 Kündigung 条件
        </div>
      )}

      <div className="cd">
        <div className="ct-t">{t('dash.chart')}</div>
        <div style={{ display:'flex',alignItems:'flex-end',gap:8,height:100 }}>
          {(data.daily_hours || []).map((d, i) => (
            <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center' }}>
              <div style={{ fontSize:9,color:'var(--tx3)',marginBottom:3 }}>{d.total_hours}h</div>
              <div style={{
                width:'100%',
                background:'linear-gradient(180deg,var(--ac),var(--ac3))',
                borderRadius:'4px 4px 2px 2px',
                height: Math.max(4, (d.total_hours / mx) * 88),
              }}/>
              <div style={{ fontSize:8,color:'var(--tx3)',marginTop:3 }}>{d.work_date?.slice(5)}</div>
            </div>
          ))}
          {(data.daily_hours || []).length === 0 && (
            <div style={{ color:'var(--tx3)',fontSize:11,padding:'20px 0' }}>{t('dash.no_data')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
