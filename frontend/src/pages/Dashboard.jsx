import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';

export default function Dashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    api('/api/v1/dashboard/stats', { token })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Loading />;
  if (!data) return <div className="tm">{t('c.load_fail')}</div>;

  const stats = [
    [data.active_employees ?? 0, t('dash.employees'), 'var(--cy)', '👥'],
    [data.pending_timesheets ?? 0, t('dash.pending_ts'), 'var(--og)', '⏳'],
    [(data.current_month_hours ?? 0) + 'h', t('dash.total_hours'), 'var(--pp)', '⏱️'],
    [data.total_suppliers ?? 0, t('nav.suppliers'), 'var(--gn)', '🏢'],
    [data.total_warehouses ?? 0, t('nav.warehouse_rates'), 'var(--ac)', '🏭'],
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
      <div className="cd">
        <div className="ct-t">📊 渊博579 HR V7.0</div>
        <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
          系统已升级到 V7.0。工时、装卸柜、结算等功能正在升级中，将在后续版本中提供。
        </div>
      </div>
    </div>
  );
}
