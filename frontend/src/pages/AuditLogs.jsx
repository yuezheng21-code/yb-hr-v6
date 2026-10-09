import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { useListTools, ListToolbar } from '../components/ListTools.jsx';

export default function AuditLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();
  const lt = useListTools(logs, { date: 'created_at' }, token);
  const COLS = [
    { label: t('log.col_time'), value: l => (l.created_at || '').slice(0, 19).replace('T', ' ') }, { label: t('log.col_user'), value: 'user_display' },
    { label: t('log.col_action'), value: 'action' }, { label: t('log.col_table'), value: 'target_table' },
    { label: t('log.col_id'), value: 'target_id' }, { label: t('log.col_detail'), value: 'detail' },
  ];

  useEffect(() => {
    api('/api/v1/admin/audit-logs?limit=5000', { token }).then(setLogs).catch(() => setLogs([])).finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <ListToolbar lt={lt} title="审计日志" columns={COLS} token={token} />
      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{t('log.col_time')}</th><th>{t('log.col_user')}</th>
            <th>{t('log.col_action')}</th><th>{t('log.col_table')}</th>
            <th>{t('log.col_id')}</th><th>{t('log.col_detail')}</th>
          </tr></thead>
          <tbody>{lt.rows.map((l, i) => (
            <tr key={i}>
              <td className="mn tm">{l.created_at?.slice(5, 19)}</td>
              <td className="fw6">{l.user_display}</td>
              <td><span style={{ color:'var(--ac2)' }}>{l.action}</span></td>
              <td className="tm">{l.target_table}</td>
              <td className="mn">{l.target_id}</td>
              <td>{l.detail}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign:'center',color:'var(--tx3)',padding:20 }}>{t('c.no_data')}</td></tr>
          )}
          </tbody>
        </table></div></div>
      )}
    </div>
  );
}
