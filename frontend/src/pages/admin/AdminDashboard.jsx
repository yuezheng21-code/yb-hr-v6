import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Loading } from '../../components/Spinner.jsx';
import { ROLE_META, ROLES, initials, timeAgo } from './shared.js';

export default function AdminDashboard({ token, user }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setErr('');
    api('/api/v1/admin/overview', { token }).then(setD).catch(e => setErr(e.message));
  };
  useEffect(() => { if (user?.role === 'admin') load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user?.role !== 'admin') return <div className="mz-empty">仅管理员可访问</div>;
  if (err) return <div className="mz-empty">{err}</div>;
  if (!d) return <Loading />;

  const u = d.users;
  const issues = d.checks.filter(c => !c.ok).length;
  const todo = d.data.timesheets_pending + d.data.ops_pending + d.data.ops_unmatched;
  const maxRole = Math.max(1, ...Object.values(u.by_role));
  const maxAct = Math.max(1, ...d.activity.map(a => a.count));

  return (
    <div className="mz">
      <div className="mz-head">
        <div>
          <div className="mz-sub">{d.system.company} · V{d.system.version} · {d.system.database}</div>
        </div>
        <div className="mz-actions">
          <button className="mz-btn" onClick={load}>刷新</button>
          <button className="mz-btn" onClick={() => navigate('/settings')}>系统设置</button>
          <button className="mz-btn mz-btn-p" onClick={() => navigate('/users')}>管理用户</button>
        </div>
      </div>

      <div className="mz-grid mz-g4">
        <Kpi label="账号总数" value={u.total} note={`启用 ${u.active} · 停用 ${u.inactive}`} />
        <Kpi label="近 7 天活跃" value={u.active_7d} note={`${u.never_logged_in} 个账号从未登录`} />
        <Kpi label="待处理事项" value={todo} note={`工时 ${d.data.timesheets_pending} · 作业 ${d.data.ops_pending} · 未匹配 ${d.data.ops_unmatched}`} />
        <Kpi label="安全与配置" value={issues === 0 ? '正常' : `${issues} 项`} note={issues === 0 ? '所有检查通过' : '需要处理，见下方'}
          color={issues ? 'var(--og)' : 'var(--gn)'} />
      </div>

      <div className="mz-grid mz-g32">
        <div className="mz-card">
          <div className="mz-card-h"><div className="mz-card-t">系统健康</div></div>
          {d.checks.map(c => (
            <div key={c.key} className="mz-check">
              <div className={`mz-check-i ${c.ok ? 'mz-ok' : 'mz-warn'}`}>{c.ok ? '✓' : '!'}</div>
              <div className="mz-grow">
                <div style={{ fontSize: 12 }}>{c.label}</div>
                <div className="mz-muted" style={{ marginTop: 2 }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mz-card">
          <div className="mz-card-h">
            <div className="mz-card-t">角色分布</div>
            <button className="mz-link" onClick={() => navigate('/users')}>查看全部 →</button>
          </div>
          {ROLES.filter(r => u.by_role[r]).map(r => (
            <div key={r} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span className="mz-tag"><span className="mz-dot" style={{ background: ROLE_META[r].color }} />{ROLE_META[r].label}</span>
                <span className="mz-num">{u.by_role[r]}</span>
              </div>
              <div className="mz-bar"><div style={{ width: `${u.by_role[r] / maxRole * 100}%`, background: ROLE_META[r].color }} /></div>
            </div>
          ))}
          <div className="mz-card-t" style={{ margin: '24px 0 12px' }}>近 7 天操作量</div>
          <div className="mz-spark">
            {d.activity.map(a => (
              <div key={a.date} title={`${a.date}：${a.count}`}>
                <i style={{ height: `${Math.max(3, a.count / maxAct * 100)}%`, opacity: a.count ? .75 : .2 }} />
                <span>{a.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mz-grid mz-g2">
        <div className="mz-card">
          <div className="mz-card-h"><div className="mz-card-t">最近登录</div></div>
          {d.recent_logins.length === 0 && <div className="mz-empty">暂无登录记录</div>}
          {d.recent_logins.map(l => (
            <div key={l.id} className="mz-row">
              <div className="mz-av" style={{ background: ROLE_META[l.role]?.color || l.avatar_color }}>{initials(l.display_name)}</div>
              <div className="mz-grow">
                <div className="mz-ellipsis" style={{ fontSize: 12 }}>{l.display_name}</div>
                <div className="mz-muted">{l.username} · {ROLE_META[l.role]?.label || l.role}</div>
              </div>
              <div className="mz-muted">{timeAgo(l.last_login)}</div>
            </div>
          ))}
        </div>

        <div className="mz-card">
          <div className="mz-card-h">
            <div className="mz-card-t">最近操作</div>
            <button className="mz-link" onClick={() => navigate('/logs')}>审计日志 →</button>
          </div>
          {d.recent_actions.length === 0 && <div className="mz-empty">暂无操作记录</div>}
          {d.recent_actions.map((a, i) => (
            <div key={i} className="mz-row">
              <span className="mz-dot" style={{ background: 'var(--ac)' }} />
              <div className="mz-grow">
                <div className="mz-ellipsis" style={{ fontSize: 12 }}>
                  {a.user_display || a.username} <span className="mz-muted">{a.action}</span> {a.target_table}{a.target_id ? ` #${a.target_id}` : ''}
                </div>
                {a.detail && <div className="mz-muted mz-ellipsis">{a.detail}</div>}
              </div>
              <div className="mz-muted">{timeAgo(a.created_at)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mz-card">
        <div className="mz-card-h"><div className="mz-card-t">数据概况</div></div>
        <div className="mz-stats">
          {[
            [d.data.employees, '在职员工', '/employees'],
            [d.data.suppliers, '合作供应商', '/suppliers'],
            [d.data.warehouses, '仓库', '/warehouses'],
            [d.data.timesheets_pending, '待审工时', '/timesheets'],
            [d.data.ops_pending, '待确认作业', '/operations'],
            [d.data.ops_unmatched, '未匹配作业', '/operations'],
            [d.data.ingest_sources, 'WMS 接入源', '/operations'],
          ].map(([v, l, path]) => (
            <div key={l} className="mz-stat" style={{ cursor: 'pointer' }} onClick={() => navigate(path)}>
              <div className="mz-stat-v">{v}</div>
              <div className="mz-stat-l">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, color }) {
  return (
    <div className="mz-card">
      <div className="mz-kpi-l">{label}</div>
      <div className="mz-kpi-v" style={color ? { color } : undefined}>{value}</div>
      <div className="mz-kpi-n">{note}</div>
    </div>
  );
}
