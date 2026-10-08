import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading } from '../../components/Spinner.jsx';
import '../../styles/minimal.css';

const GROUPS = [
  { title: '公司', items: [
    ['company_name', '公司名称', 'text'],
    ['company_timezone', '时区', 'text'],
  ] },
  { title: '薪资与成本', items: [
    ['p1_hourly_rate', 'P1 基础时薪', '€'],
    ['social_rate', '社保率', '%'],
    ['vacation_rate', '年假准备金率', '%'],
    ['sick_rate', '病假准备金率', '%'],
    ['mgmt_overhead', '管理费率', '%'],
    ['default_margin', '默认毛利率', '%'],
  ] },
  { title: '工时合规（ArbZG / Zeitkonto）', items: [
    ['arbzg_daily_limit', '每日工时上限', 'h'],
    ['arbzg_weekly_limit', '每周工时上限', 'h'],
    ['zeitkonto_max_positive', '时间账户上限', 'h'],
    ['zeitkonto_max_negative', '时间账户下限', 'h'],
  ] },
  { title: '安全', items: [
    ['session_timeout_minutes', '会话超时', '分钟'],
  ] },
];

export default function Settings({ token, user }) {
  const showToast = useToast();
  const [config, setConfig] = useState(null);
  const [dirty, setDirty] = useState({});

  const load = () => api('/api/v1/admin/system-config', { token }).then(c => { setConfig(c); setDirty({}); })
    .catch(e => showToast(e.message, 'err'));
  useEffect(() => { if (user?.role === 'admin') load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user?.role !== 'admin') return <div className="mz-empty">仅管理员可访问</div>;
  if (!config) return <Loading />;

  const value = (k, unit) => {
    const v = dirty[k] !== undefined ? dirty[k] : config[k];
    return unit === '%' && typeof v === 'number' ? +(v * 100).toFixed(2) : (v ?? '');
  };
  const change = (k, unit, raw) => {
    let v = raw;
    if (unit !== 'text') v = raw === '' ? '' : parseFloat(raw);
    if (unit === '%' && v !== '') v = v / 100;
    setDirty({ ...dirty, [k]: v });
  };
  const save = async () => {
    const body = Object.fromEntries(Object.entries(dirty).filter(([, v]) => v !== '' && !Number.isNaN(v)));
    if (!Object.keys(body).length) return;
    try {
      await api('/api/v1/admin/system-config', { method: 'PUT', body, token });
      showToast('设置已保存'); load();
    } catch (e) { showToast(e.message, 'err'); }
  };
  const changed = Object.keys(dirty).length;

  return (
    <div className="mz" style={{ maxWidth: 760 }}>
      <div className="mz-head">
        <div>
          <div className="mz-sub">业务参数用于成本测算、报价与合规预警</div>
        </div>
        <div className="mz-actions">
          <button className="mz-btn" disabled={!changed} onClick={() => setDirty({})}>撤销</button>
          <button className="mz-btn mz-btn-p" disabled={!changed} onClick={save}>保存{changed ? `（${changed}）` : ''}</button>
        </div>
      </div>

      {GROUPS.map(g => (
        <div key={g.title} className="mz-card">
          <div className="mz-card-t" style={{ marginBottom: 8 }}>{g.title}</div>
          {g.items.map(([k, label, unit]) => (
            <div key={k} className="mz-row" style={{ justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12 }}>
                {label}
                {dirty[k] !== undefined && <span className="mz-dot" style={{ background: 'var(--ac)', marginLeft: 8 }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="mz-input" style={{ width: unit === 'text' ? 240 : 120, textAlign: unit === 'text' ? 'left' : 'right' }}
                  type={unit === 'text' ? 'text' : 'number'} step="any"
                  value={value(k, unit)} onChange={e => change(k, unit, e.target.value)} />
                {unit !== 'text' && <span className="mz-muted" style={{ width: 32 }}>{unit}</span>}
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="mz-hint">注意：当前设置保存在服务内存中，服务重启后会恢复默认值。</div>
    </div>
  );
}
