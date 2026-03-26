import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { StatusBadge, fmtE } from '../components/StatusBadge.jsx';

const TABS = ['employee', 'supplier', 'project'];

function SettlementTab({ tab, period, token, user, t, showToast }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const canGenerate = tab === 'project'
    ? ['admin', 'fin'].includes(user?.role)
    : ['admin', 'hr', 'fin'].includes(user?.role);
  const canExport = ['admin', 'hr', 'fin'].includes(user?.role);

  const load = () => {
    setLoading(true);
    Promise.all([
      api(`/api/v1/settlements/${tab}?period=${period}`, { token }),
      api(`/api/v1/settlements/summary?period=${period}`, { token }),
    ])
      .then(([rows, summ]) => { setData(rows); setSummary(summ); })
      .catch(e => showToast(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab, period]); // eslint-disable-line

  const generate = async () => {
    setGenerating(true);
    try {
      const endpoint = tab === 'project'
        ? `/api/v1/settlements/project/generate`
        : `/api/v1/settlements/${tab}/generate`;
      const r = await api(endpoint, { method: 'POST', body: { period, overwrite: true }, token });
      showToast(`已生成 ${r.generated} 条结算记录`);
      load();
    } catch (e) { showToast(e.message, 'err'); }
    finally { setGenerating(false); }
  };

  const downloadXlsx = async () => {
    try {
      const url = `/api/v1/settlements/${tab}/export/xlsx?period=${period}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${tab}_settlement_${period}.xlsx`;
      a.click();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const approve = async (id, action) => {
    try {
      await api(`/api/v1/settlements/employee/${id}/${action}`, { method: 'PUT', token });
      load();
      showToast(action === 'confirm' ? '已确认' : '已标记付款');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const sumData = summary?.[tab];

  return (
    <div>
      {/* Summary cards */}
      {sumData && (
        <div className="sr" style={{ marginBottom: 12 }}>
          {tab === 'employee' && [
            [sumData.count, t('settle.emp_count'), 'var(--cy)'],
            [`${sumData.total_hours}h`, t('settle.hours'), 'var(--pp)'],
            [fmtE(sumData.total_gross), 'Brutto', 'var(--og)'],
            [fmtE(sumData.total_cost), t('settle.total_cost'), 'var(--rd)'],
          ].map(([val, label, color], i) => (
            <div key={i} className="sc">
              <div className="sl">{label}</div>
              <div className="sv" style={{ color }}>{val}</div>
            </div>
          ))}
          {tab === 'supplier' && [
            [sumData.count, t('settle.supplier_count'), 'var(--cy)'],
            [fmtE(sumData.total_amount), t('settle.total_amount'), 'var(--og)'],
          ].map(([val, label, color], i) => (
            <div key={i} className="sc">
              <div className="sl">{label}</div>
              <div className="sv" style={{ color }}>{val}</div>
            </div>
          ))}
          {tab === 'project' && [
            [sumData.count, t('settle.project_count'), 'var(--cy)'],
            [fmtE(sumData.total_revenue), t('settle.revenue'), 'var(--gn)'],
            [fmtE(sumData.total_profit), t('settle.profit'), 'var(--ac)'],
          ].map(([val, label, color], i) => (
            <div key={i} className="sc">
              <div className="sl">{label}</div>
              <div className="sv" style={{ color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="ab">
        <div className="ml" style={{ display: 'flex', gap: 6 }}>
          {canGenerate && (
            <button className="b bga" onClick={generate} disabled={generating}>
              {generating ? '⏳' : '⚡'} {t('settle.generate')}
            </button>
          )}
          {canExport && data.length > 0 && (
            <button className="b bgh" onClick={downloadXlsx}>↓ Excel</button>
          )}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          {tab === 'employee' && (
            <>
              <thead><tr>
                <th>{t('settle.col_emp')}</th><th>工号</th><th>职级</th>
                <th>{t('settle.col_wh')}</th><th>条数</th>
                <th>工时(h)</th><th>基础工资(€)</th>
                <th>Brutto(€)</th><th>综合成本(€)</th>
                <th>{t('c.status')}</th><th></th>
              </tr></thead>
              <tbody>{data.map(r => (
                <tr key={r.id}>
                  <td className="fw6">{r.emp_name}</td>
                  <td>{r.emp_no}</td><td>{r.grade}</td>
                  <td>{r.warehouse_code}</td>
                  <td>{r.timesheet_count}</td>
                  <td>{r.total_hours}</td>
                  <td>{fmtE(r.base_pay)}</td>
                  <td className="fw6">{fmtE(r.gross_pay)}</td>
                  <td>{fmtE(r.total_cost)}</td>
                  <td><StatusBadge value={r.status} /></td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    {r.status === 'draft' && ['admin','fin'].includes(user?.role) && (
                      <button className="b bga xs" onClick={() => approve(r.id, 'confirm')}>确认</button>
                    )}
                    {r.status === 'confirmed' && ['admin','fin'].includes(user?.role) && (
                      <button className="b bgg xs" onClick={() => approve(r.id, 'mark-paid')}>标记付款</button>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </>
          )}
          {tab === 'supplier' && (
            <>
              <thead><tr>
                <th>供应商</th><th>业务线</th><th>员工数</th><th>工时条数</th>
                <th>总工时(h)</th><th>应付(€)</th><th>发票号</th><th>状态</th>
              </tr></thead>
              <tbody>{data.map(r => (
                <tr key={r.id}>
                  <td className="fw6">{r.supplier_name}</td>
                  <td>{r.biz_line}</td>
                  <td>{r.employee_count}</td>
                  <td>{r.timesheet_count}</td>
                  <td>{r.total_hours}</td>
                  <td className="fw6">{fmtE(r.total_amount)}</td>
                  <td>{r.invoice_no || '—'}</td>
                  <td><StatusBadge value={r.status} /></td>
                </tr>
              ))}</tbody>
            </>
          )}
          {tab === 'project' && (
            <>
              <thead><tr>
                <th>仓库</th><th>业务线</th><th>客户收入(€)</th>
                <th>自有成本(€)</th><th>供应商成本(€)</th>
                <th>总成本(€)</th><th>毛利(€)</th><th>毛利率</th><th>状态</th>
              </tr></thead>
              <tbody>{data.map(r => (
                <tr key={r.id}>
                  <td className="fw6">{r.warehouse_code}</td>
                  <td>{r.biz_line}</td>
                  <td>{fmtE(r.client_revenue)}</td>
                  <td>{fmtE(r.own_labor_cost)}</td>
                  <td>{fmtE(r.supplier_labor_cost)}</td>
                  <td>{fmtE(r.total_labor_cost)}</td>
                  <td className="fw6" style={{ color: r.gross_profit >= 0 ? 'var(--gn)' : 'var(--rd)' }}>
                    {fmtE(r.gross_profit)}
                  </td>
                  <td>{(r.gross_margin * 100).toFixed(1)}%</td>
                  <td><StatusBadge value={r.status} /></td>
                </tr>
              ))}</tbody>
            </>
          )}
        </table></div></div>
      )}
    </div>
  );
}

export default function Settlements({ token, user }) {
  // hr role cannot access project settlements (backend returns 403)
  const visibleTabs = ['admin', 'fin', 'mgr'].includes(user?.role)
    ? ['employee', 'supplier', 'project']
    : ['employee', 'supplier'];

  const [tab, setTab] = useState('employee');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { t } = useLang();
  const showToast = useToast();

  const tabLabels = {
    employee: t('settle.tab_employee'),
    supplier: t('settle.tab_supplier'),
    project: t('settle.tab_project'),
  };

  return (
    <div>
      <div className="ab">
        <div style={{ display: 'flex', gap: 6 }}>
          {visibleTabs.map(tb => (
            <button key={tb} className={`fb ${tab === tb ? 'on' : ''}`} onClick={() => setTab(tb)}>
              {tabLabels[tb]}
            </button>
          ))}
        </div>
        <div className="ml">
          <input type="month" className="fs" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
      </div>
      <SettlementTab
        key={`${tab}-${month}`}
        tab={tab}
        period={month}
        token={token}
        user={user}
        t={t}
        showToast={showToast}
      />
    </div>
  );
}
