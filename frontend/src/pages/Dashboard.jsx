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
    [(data.current_month_hours ?? 0).toFixed(1) + 'h', t('dash.total_hours'), 'var(--pp)', '⏱️'],
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
        <div className="ct-t">🚀 渊博579 HR V7.0 — Phase 2 在线</div>
        <div style={{ color: 'var(--tx3)', fontSize: 12, lineHeight: 1.8 }}>
          ✅ 员工管理、供应商管理、仓库配置<br/>
          ✅ 工时记录 (CRUD + 仓库/财务审批流)<br/>
          ✅ 装卸柜记录 (CRUD + 拆分到工时)<br/>
          ✅ 打卡系统 (上班/下班打卡)<br/>
          ✅ 结算引擎 (hourly / piece / hourly_kpi / container + 夜班/周末/节假日补贴)<br/>
          🔜 月度结算、报价、推荐返佣 (Phase 3-5)
        </div>
      </div>
    </div>
  );
}
