import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { fmtE } from '../components/StatusBadge.jsx';

export default function Commissions({ token }) {
  const [grades, setGrades] = useState([]);
  const [kpiLevels, setKpiLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [costForm, setCostForm] = useState({ brutto_rate: 13, weekly_hours: 40, emp_type: '自有' });
  const [costResult, setCostResult] = useState(null);
  const { t } = useLang();

  useEffect(() => {
    Promise.all([
      api('/api/grades', { token }),
      api('/api/kpi-levels', { token }),
    ]).then(([g, k]) => { setGrades(g); setKpiLevels(k); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const calcCost = async () => {
    try {
      const r = await api('/api/cost-calc', { method:'POST', body:costForm, token });
      setCostResult(r);
    } catch (e) {
      // Fallback local estimate
      const lb = costForm.brutto_rate * costForm.weekly_hours * 4.33;
      const soc = lb * 0.21;
      const hol = lb * 0.08;
      setCostResult({ labor: lb, social: soc, holiday: hol, total: lb + soc + hol });
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="alert alert-ac">
        职级薪酬体系 · P1-P9 · 基于 MiLoG §1 最低工资标准 + MTV DGB/GVP 2026 集体协议
      </div>

      {/* Grade table */}
      <div className="cd" style={{ marginBottom:16 }}>
        <div className="ct-t">{t('grade.title')}</div>
        <div className="tw"><table>
          <thead><tr>
            <th>{t('grade.col_grade')}</th>
            <th>{t('grade.col_base')}</th>
            <th>{t('grade.col_mult')}</th>
            <th>{t('grade.col_gross')}</th>
            <th>{t('grade.col_mgmt')}</th>
            <th>{t('grade.col_ot')}</th>
            <th>{t('grade.col_cost')}</th>
            <th>{t('grade.col_hourly')}</th>
            <th>{t('grade.col_desc')}</th>
          </tr></thead>
          <tbody>{grades.map((g, i) => (
            <tr key={i}>
              <td><span style={{ color:'var(--pp)',fontWeight:700 }}>{g.grade}</span></td>
              <td className="mn">€{fmtE(g.base_hourly)}/h</td>
              <td className="mn">{g.multiplier}×</td>
              <td className="mn fw6">€{fmtE(g.monthly_gross)}</td>
              <td className="mn tm">{g.mgmt_allowance ? '€'+fmtE(g.mgmt_allowance) : '—'}</td>
              <td className="mn" style={{ color:'var(--og)' }}>{g.ot_threshold_h}h</td>
              <td className="mn" style={{ color:'var(--rd)' }}>€{fmtE(g.true_cost)}</td>
              <td className="mn gn">€{fmtE(g.effective_hourly)}/h</td>
              <td className="tm" style={{ fontSize:10 }}>{g.description}</td>
            </tr>
          ))}
          {grades.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign:'center',color:'var(--tx3)',padding:20 }}>{t('c.no_data')}</td></tr>
          )}
          </tbody>
        </table></div>
      </div>

      {/* KPI bonus tiers */}
      {kpiLevels.length > 0 && (
        <div className="cd" style={{ marginBottom:16 }}>
          <div className="ct-t">📈 KPI 绩效奖金等级</div>
          <div className="tw"><table>
            <thead><tr><th>等级</th><th>描述</th><th>绩效系数</th><th>奖金</th></tr></thead>
            <tbody>{kpiLevels.map((k, i) => (
              <tr key={i}>
                <td><span style={{ color:'var(--og)',fontWeight:700 }}>{k.level}</span></td>
                <td>{k.description}</td>
                <td className="mn">{k.multiplier}×</td>
                <td className="mn gn">€{fmtE(k.bonus_amount)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      )}

      {/* Cost calculator */}
      <div className="cd">
        <div className="ct-t">🧮 {t('cost.title')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'flex-end' }}>
          <div className="fg">
            <label className="fl">{t('cost.f_type')}</label>
            <select className="fsl" value={costForm.emp_type}
              onChange={e => setCostForm({...costForm,emp_type:e.target.value})}>
              <option value="自有">自有</option>
              <option value="供应商">供应商</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">时薪 (€/h)</label>
            <input className="fi" type="number" step="0.5" value={costForm.brutto_rate}
              onChange={e => setCostForm({...costForm,brutto_rate:+e.target.value})} />
          </div>
          <div className="fg">
            <label className="fl">{t('cost.f_weekly')}</label>
            <input className="fi" type="number" step="1" value={costForm.weekly_hours}
              onChange={e => setCostForm({...costForm,weekly_hours:+e.target.value})} />
          </div>
          <button className="b bga" onClick={calcCost}>{t('cost.calc')}</button>
        </div>

        {costResult && (
          <div className="sr" style={{ marginTop:12 }}>
            {[
              ['劳动力成本', '€'+fmtE(costResult.labor || costResult.total_labor), 'var(--cy)'],
              ['社会保险', '€'+fmtE(costResult.social || costResult.social_insurance), 'var(--og)'],
              ['假期成本', '€'+fmtE(costResult.holiday || costResult.holiday_cost), 'var(--pp)'],
              ['总成本/月', '€'+fmtE(costResult.total || costResult.total_monthly_cost), 'var(--rd)'],
            ].map(([label, val, color]) => (
              <div key={label} className="sc">
                <div className="sl">{label}</div>
                <div className="sv" style={{ color, fontSize:16 }}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
