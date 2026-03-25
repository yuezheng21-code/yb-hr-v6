import { useState, useEffect } from 'react';
import { api, downloadCsv } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { StatusBadge, fmtE } from '../components/StatusBadge.jsx';

export default function Settlements({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { t } = useLang();
  const showToast = useToast();

  useEffect(() => {
    setLoading(true);
    api(`/api/settlement/monthly?month=${month}`, { token })
      .then(setData)
      .finally(() => setLoading(false));
  }, [month, token]);

  return (
    <div>
      <div className="ab">
        <input type="month" className="fs" value={month} onChange={e => setMonth(e.target.value)} />
        <div className="ml">
          <button className="b bgh" onClick={() =>
            downloadCsv(`/api/settlement/monthly/export?month=${month}`, token, `settlement_${month}.csv`)
              .catch(e => showToast(e.message, 'err'))
          }>↓ CSV</button>
        </div>
      </div>

      {data && (
        <div className="sr">
          {[
            [t('settle.emp_count'), data.summary.employee_count, 'var(--cy)'],
            [`${t('settle.hours')} ${data.summary.total_hours}h`, '', 'var(--pp)'],
            [t('settle.brutto'), '€' + fmtE(data.summary.total_gross), 'var(--og)'],
            [t('settle.net'), '€' + fmtE(data.summary.total_net), 'var(--gn)'],
          ].map(([label, val, color], i) => (
            <div key={i} className="sc">
              <div className="sl">{label}</div>
              <div className="sv" style={{ color }}>{val || data.summary.employee_count}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <Loading /> : data && (
        <div className="tw"><table>
          <thead><tr>
            <th>{t('settle.col_emp')}</th><th>{t('settle.col_wh')}</th>
            <th>{t('settle.col_biz')}</th><th>{t('settle.col_src')}</th>
            <th>{t('settle.col_hrs')}</th><th>Brutto</th>
            <th>SSI</th><th>Tax</th><th>Net</th><th>{t('settle.col_count')}</th>
          </tr></thead>
          <tbody>{data.rows.map((r, i) => (
            <tr key={i}>
              <td className="fw6">{r.employee_name}</td>
              <td>{r.warehouse_code}</td>
              <td><StatusBadge value={r.biz_line} /></td>
              <td><StatusBadge value={r.source} /></td>
              <td className="mn">{r.total_hours}h</td>
              <td className="mn">€{fmtE(r.gross_total)}</td>
              <td className="mn tm">€{fmtE(r.ssi_total)}</td>
              <td className="mn tm">€{fmtE(r.tax_total)}</td>
              <td className="mn gn fw6">€{fmtE(r.net_total)}</td>
              <td className="tm">{r.record_count}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}
