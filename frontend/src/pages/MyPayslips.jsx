import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { openFile } from './PersonnelFile.jsx';

const eur = (v) => `€${Number(v || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MyPayslips({ token }) {
  const showToast = useToast();
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/api/v1/finance/my/payslips', { token }).then(setList).catch(e => setErr(e.message)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <div className="mz-empty">{err}</div>;
  if (!list) return <Loading />;
  return (
    <div className="mz">
      <div className="mz-head"><div><div className="mz-title">我的工资条</div><div className="mz-sub">Meine Entgeltabrechnungen · 点击查看或下载 PDF</div></div></div>
      {!list.length ? <div className="mz-card"><div className="mz-empty">还没有已签发的工资条</div></div> : (
        <div className="mz-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {list.map(s => (
            <button key={s.id} className="mz-card" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              onClick={() => openFile(`/api/v1/finance/my/payslips/${s.id}/pdf`, token).catch(e => showToast(e.message, 'err'))}>
              <div className="mz-kpi-l">{s.period}</div>
              <div className="mz-kpi-v" style={{ fontSize: 24 }}>{eur(s.payout)}</div>
              <div className="mz-kpi-n">实发 Auszahlung · 税前 {eur(s.gross)}</div>
              <div className="mz-muted" style={{ marginTop: 8 }}>{s.work_days} 天 · {s.total_hours} 小时{s.has_statutory ? '' : ' · 税/社保见工资核算'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
