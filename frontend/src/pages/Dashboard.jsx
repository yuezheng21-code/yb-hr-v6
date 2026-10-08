import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { StatCard, Chart } from '../components/common/index.js';

// Number of months to include in the margin analysis dashboard widget
const MARGIN_ANALYSIS_MONTHS = 3;

export default function Dashboard({ token, user }) {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [margin, setMargin] = useState(null);
  const [referralSummary, setReferralSummary] = useState(null);
  const [commissionSummary, setCommissionSummary] = useState(null);
  const [dispatchSummary, setDispatchSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    Promise.all([
      api('/api/v1/dashboard/stats', { token }),
      api('/api/v1/dashboard/charts', { token }),
      api('/api/v1/dashboard/margin-analysis?months=' + MARGIN_ANALYSIS_MONTHS, { token }),
      api('/api/v1/dashboard/referral-summary', { token }),
      api('/api/v1/dashboard/commission-summary', { token }),
      ['admin', 'hr', 'mgr', 'fin'].includes(user?.role)
        ? api('/api/v1/dashboard/dispatch-summary', { token }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([s, c, m, r, com, dis]) => { setStats(s); setCharts(c); setMargin(m); setReferralSummary(r); setCommissionSummary(com); setDispatchSummary(dis); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Loading />;

  const whMax = Math.max(1, ...(charts?.warehouse_distribution || []).map(w => w.value));
  const TIER_COLORS = { bronze: '#b4783c', silver: '#9a9aa6', gold: 'var(--og)', platinum: 'var(--ac)' };

  return (
    <div className="mz">
      {stats && (
        <div className="mz-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          <StatCard label={t('dash.employees')} value={stats.active_employees} />
          <StatCard label={t('dash.pending_ts')} value={stats.pending_timesheets} color={stats.pending_timesheets ? 'var(--og)' : undefined} />
          <StatCard label={t('dash.total_hours')} value={(stats.current_month_hours ?? 0).toFixed(1) + 'h'} sub="当月已过账" />
          <StatCard label={t('nav.suppliers')} value={stats.total_suppliers} />
          <StatCard label={t('nav.warehouse_rates')} value={stats.total_warehouses} />
        </div>
      )}

      {charts && (
        <div className="mz-grid mz-g2">
          <Card title="近 6 月工时趋势"><Chart data={charts.monthly_hours} labelKey="label" valueKey="value" height={120} /></Card>
          <Card title="近 6 月结算金额趋势"><Chart data={charts.monthly_amount} labelKey="label" valueKey="value" height={120} /></Card>
        </div>
      )}

      <div className="mz-grid mz-g2">
        {charts?.warehouse_distribution?.length > 0 && (
          <Card title="本月仓库工时分布">
            {charts.warehouse_distribution.map((wh, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span>{wh.label}</span><span className="mz-muted mz-num">{wh.value}h</span>
                </div>
                <div className="mz-bar"><div style={{ width: `${wh.value / whMax * 100}%` }} /></div>
              </div>
            ))}
          </Card>
        )}

        {margin?.has_data ? (
          <Card title={`毛利分析（近 ${MARGIN_ANALYSIS_MONTHS} 月）`}>
            {margin.by_period.map((p, i) => (
              <div key={i} className="mz-row" style={{ fontSize: 12 }}>
                <span className="mz-muted" style={{ width: 80 }}>{p.period}</span>
                <span className="mz-grow mz-num">€{p.revenue.toFixed(0)}</span>
                <span className="mz-num" style={{ color: p.profit >= 0 ? 'var(--gn)' : 'var(--rd)' }}>
                  {p.profit >= 0 ? '+' : ''}€{p.profit.toFixed(0)} · {p.margin}%
                </span>
              </div>
            ))}
          </Card>
        ) : (
          <Card title="毛利分析">
            <div className="mz-empty">暂无已结算数据。完成月度结算后这里会显示收入、利润与毛利率。</div>
          </Card>
        )}
      </div>

      {charts?.biz_line_distribution?.length > 0 && (
        <Card title="业务线分布（当月）">
          <div className="mz-stats">
            {charts.biz_line_distribution.map((b, i) => (
              <div key={i} className="mz-stat"><div className="mz-stat-v">{b.value}h</div><div className="mz-stat-l">{b.label}</div></div>
            ))}
          </div>
        </Card>
      )}

      {(referralSummary || commissionSummary) && (
        <div className="mz-grid mz-g2">
          {referralSummary && (
            <Card title="员工推荐奖励">
              <div className="mz-stats" style={{ marginBottom: 16 }}>
                {[['总推荐', referralSummary.total], ['进行中', referralSummary.active], ['已完成', referralSummary.completed], ['本月新增', referralSummary.this_month]]
                  .map(([l, v]) => <div key={l} className="mz-stat"><div className="mz-stat-v">{v}</div><div className="mz-stat-l">{l}</div></div>)}
              </div>
              <PaidPending paid={referralSummary.total_paid} pending={referralSummary.total_pending} />
            </Card>
          )}
          {commissionSummary && (
            <Card title="合作伙伴返佣">
              <div className="mz-stats" style={{ marginBottom: 16 }}>
                {[['总协议', commissionSummary.total], ['生效中', commissionSummary.active]]
                  .map(([l, v]) => <div key={l} className="mz-stat"><div className="mz-stat-v">{v}</div><div className="mz-stat-l">{l}</div></div>)}
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                {Object.entries(commissionSummary.tier_breakdown).filter(([, c]) => c > 0).map(([tier, count]) => (
                  <span key={tier} className="mz-tag"><span className="mz-dot" style={{ background: TIER_COLORS[tier] || 'var(--tx3)' }} />
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} × {count}</span>
                ))}
              </div>
              <PaidPending paid={commissionSummary.total_paid} pending={commissionSummary.total_pending} />
            </Card>
          )}
        </div>
      )}

      {dispatchSummary && (
        <Card title="派遣需求与人才储备">
          <div className="mz-grid mz-g2">
            <div>
              <div className="mz-muted" style={{ marginBottom: 10 }}>需求状态</div>
              <div className="mz-stats" style={{ marginBottom: 12 }}>
                {[['open', '招募中'], ['recruiting', '招聘中'], ['filled', '已满员'], ['closed', '已关闭']].map(([k, l]) => (
                  <div key={k} className="mz-stat"><div className="mz-stat-v">{dispatchSummary.demand_by_status?.[k] || 0}</div><div className="mz-stat-l">{l}</div></div>
                ))}
              </div>
              <div className="mz-muted" style={{ display: 'flex', gap: 16 }}>
                <span>需求人数 <b style={{ color: 'var(--tx)' }}>{dispatchSummary.open_headcount}</b></span>
                <span>已匹配 <b style={{ color: 'var(--tx)' }}>{dispatchSummary.matched_count}</b></span>
                <span>填满率 <b style={{ color: dispatchSummary.fill_rate >= 80 ? 'var(--gn)' : 'var(--og)' }}>{dispatchSummary.fill_rate}%</b></span>
              </div>
            </div>
            <div>
              <div className="mz-muted" style={{ marginBottom: 10 }}>人才储备（共 {dispatchSummary.talent_total} 人）</div>
              <div className="mz-stats">
                {[['available', '待联系'], ['contacted', '已联系'], ['interviewing', '面试中'], ['hired', '已录用']].map(([k, l]) => (
                  <div key={k} className="mz-stat"><div className="mz-stat-v">{dispatchSummary.talent_by_status?.[k] || 0}</div><div className="mz-stat-l">{l}</div></div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="mz-card">
      <div className="mz-card-h"><div className="mz-card-t">{title}</div></div>
      {children}
    </div>
  );
}

function PaidPending({ paid, pending }) {
  return (
    <div className="mz-muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>已付 <b className="mz-num" style={{ color: 'var(--tx)' }}>€{paid.toFixed(0)}</b></span>
      <span>待付 <b className="mz-num" style={{ color: 'var(--og)' }}>€{pending.toFixed(0)}</b></span>
    </div>
  );
}
