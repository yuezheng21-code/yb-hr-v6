import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { StatCard, Chart } from '../components/common/index.js';

const MARGIN_ANALYSIS_MONTHS = 3;

export default function Dashboard({ token, user }) {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [margin, setMargin] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    Promise.all([
      api('/api/v1/dashboard/stats', { token }),
      api('/api/v1/dashboard/charts', { token }),
      api('/api/v1/dashboard/margin-analysis?months=' + MARGIN_ANALYSIS_MONTHS, { token }),
    ])
      .then(([s, c, m]) => { setStats(s); setCharts(c); setMargin(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Loading />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat Cards Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <StatCard icon="👥" label={t('dash.employees')} value={stats.active_employees} color="var(--cy)" />
          <StatCard icon="⏳" label={t('dash.pending_ts')} value={stats.pending_timesheets} color="var(--og)" />
          <StatCard icon="⏱️" label={t('dash.total_hours')} value={(stats.current_month_hours ?? 0).toFixed(1) + 'h'} color="var(--pp)" sub="当月已过账" />
          <StatCard icon="🏢" label={t('nav.suppliers')} value={stats.total_suppliers} color="var(--gn)" />
          <StatCard icon="🏭" label={t('nav.warehouse_rates')} value={stats.total_warehouses} color="var(--ac)" />
        </div>
      )}

      {/* Charts Row */}
      {charts && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 12 }}>📊 近6月工时趋势</div>
            <Chart data={charts.monthly_hours} labelKey="label" valueKey="value" color="var(--pp)" height={110} />
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 12 }}>💶 近6月结算金额趋势</div>
            <Chart data={charts.monthly_amount} labelKey="label" valueKey="value" color="var(--gn)" height={110} />
          </div>
        </div>
      )}

      {/* Warehouse Distribution + Margin */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {charts?.warehouse_distribution?.length > 0 && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 12 }}>🏭 本月仓库工时分布</div>
            {charts.warehouse_distribution.map((wh, i) => {
              const max = Math.max(...charts.warehouse_distribution.map(w => w.value), 1);
              const pct = Math.round(wh.value / max * 100);
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{wh.label}</span>
                    <span style={{ color: 'var(--tx3)' }}>{wh.value}h</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--ac)', borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {margin?.has_data ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 12 }}>📈 毛利分析 (近{MARGIN_ANALYSIS_MONTHS}月)</div>
            {margin.by_period.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)', fontSize: 11 }}>
                <span style={{ color: 'var(--tx3)' }}>{p.period}</span>
                <span>€{p.revenue.toFixed(0)}</span>
                <span style={{ color: p.profit >= 0 ? 'var(--gn)' : 'var(--rd)', fontWeight: 600 }}>
                  {p.profit >= 0 ? '+' : ''}€{p.profit.toFixed(0)} ({p.margin}%)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 12 }}>🚀 系统状态</div>
            <div style={{ color: 'var(--tx3)', fontSize: 11, lineHeight: 2 }}>
              {[
                '✅ 员工管理 · 供应商 · 仓库配置',
                '✅ 工时录入 · 仓库/财务双重审批',
                '✅ 装卸柜记录 · 自动拆分工时',
                '✅ 打卡系统 · 考勤记录',
                '✅ 月度结算 · 员工/供应商/项目',
                '✅ 推荐奖励 · 返佣系统',
                '✅ 报价单 · 成本测算',
                '✅ 派遣需求 · 人才储备池',
              ].map((s, i) => <div key={i}>{s}</div>)}
            </div>
          </div>
        )}
      </div>

      {/* Biz Line Distribution */}
      {charts?.biz_line_distribution?.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 12 }}>🏢 业务线分布 (当月)</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {charts.biz_line_distribution.map((b, i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ac2)' }}>{b.value}h</div>
                <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
