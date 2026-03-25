import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';

export default function AuditLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    api('/api/v1/admin/audit-logs', { token }).then(setLogs).finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      {loading ? <Loading /> : (
        <div className="tw"><div className="ts"><table>
          <thead><tr>
            <th>{t('log.col_time')}</th><th>{t('log.col_user')}</th>
            <th>{t('log.col_action')}</th><th>{t('log.col_table')}</th>
            <th>{t('log.col_id')}</th><th>{t('log.col_detail')}</th>
          </tr></thead>
          <tbody>{logs.map((l, i) => (
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
