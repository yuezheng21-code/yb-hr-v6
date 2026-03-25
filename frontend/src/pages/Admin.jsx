import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';

const ROLE_COLORS = {
  admin: '#f0526c', hr: '#a78bfa', fin: '#2dd4a0', wh: '#f5a623',
  sup: '#ef4444', mgr: '#ff6b9d', worker: '#38bdf8',
};
const ROLE_LABELS = {
  admin: '管理员', hr: 'HR', fin: '财务', wh: '仓库管理', sup: '供应商', mgr: '经理', worker: '工人',
};
const ROLES = Object.keys(ROLE_LABELS);

const CONFIG_LABELS = {
  p1_hourly_rate: 'P1基础时薪 (€)',
  social_rate: '社保率 (%)',
  vacation_rate: '年假准备金率 (%)',
  sick_rate: '病假准备金率 (%)',
  mgmt_overhead: '管理费率 (%)',
  default_margin: '默认毛利率 (%)',
  arbzg_daily_limit: 'ArbZG每日上限 (h)',
  arbzg_weekly_limit: 'ArbZG每周上限 (h)',
  zeitkonto_max_positive: '时间账户上限 (h)',
  zeitkonto_max_negative: '时间账户下限 (h)',
  session_timeout_minutes: '会话超时 (分钟)',
  company_name: '公司名称',
  company_timezone: '时区',
};
const PCT_KEYS = new Set(['social_rate', 'vacation_rate', 'sick_rate', 'mgmt_overhead', 'default_margin']);

export default function Admin({ token, user }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selUser, setSelUser] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [config, setConfig] = useState({});
  const [configDirty, setConfigDirty] = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const showToast = useToast();

  const emptyForm = {
    username: '', display_name: '', password: '', role: 'worker',
    lang: 'zh', avatar_color: '#4f6ef7',
    bound_warehouse: '', bound_biz_line: '', is_active: true,
  };
  const [form, setForm] = useState(emptyForm);

  if (user?.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>⛔ 仅管理员可访问</div>;
  }

  const loadUsers = () => {
    setLoading(true);
    const params = filterRole ? `?role=${filterRole}&active_only=false` : '?active_only=false';
    api(`/api/v1/admin/users${params}`, { token }).then(setUsers).finally(() => setLoading(false));
  };

  const loadAuditLogs = () => {
    setAuditLoading(true);
    api('/api/v1/admin/audit-logs', { token }).then(setAuditLogs).finally(() => setAuditLoading(false));
  };

  const loadConfig = () => {
    setConfigLoading(true);
    api('/api/v1/admin/system-config', { token }).then(c => { setConfig(c); setConfigDirty({}); }).finally(() => setConfigLoading(false));
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'audit') loadAuditLogs();
    else if (tab === 'config') loadConfig();
  }, [tab, filterRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const createUser = async () => {
    if (!form.username || !form.password) { showToast('用户名和密码必填', 'err'); return; }
    try {
      const body = { ...form };
      if (!body.bound_warehouse) delete body.bound_warehouse;
      if (!body.bound_biz_line) delete body.bound_biz_line;
      await api('/api/v1/admin/users', { method: 'POST', body, token });
      showToast('用户已创建'); setAddModal(false); setForm(emptyForm); loadUsers();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const updateUser = async () => {
    if (!editModal) return;
    try {
      const body = { ...editModal };
      if (!body.bound_warehouse) body.bound_warehouse = null;
      if (!body.bound_biz_line) body.bound_biz_line = null;
      if (!body._new_password) delete body.password;
      else body.password = body._new_password;
      delete body._new_password;
      delete body.id; delete body.username; delete body.created_at; delete body.last_login;
      await api(`/api/v1/admin/users/${editModal.id}`, { method: 'PUT', body, token });
      showToast('用户已更新'); setEditModal(null); loadUsers();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const deactivateUser = async (id) => {
    if (!confirm('确定停用此用户？')) return;
    try {
      await api(`/api/v1/admin/users/${id}`, { method: 'DELETE', token });
      showToast('用户已停用'); loadUsers();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const reactivateUser = async (id) => {
    try {
      await api(`/api/v1/admin/users/${id}`, { method: 'PUT', body: { is_active: true }, token });
      showToast('用户已恢复'); loadUsers();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const saveConfig = async () => {
    if (!Object.keys(configDirty).length) { showToast('没有变更', 'warn'); return; }
    try {
      const body = {};
      for (const [k, v] of Object.entries(configDirty)) {
        body[k] = typeof config[k] === 'number' ? parseFloat(v) : v;
      }
      await api('/api/v1/admin/system-config', { method: 'PUT', body, token });
      showToast('配置已保存'); setConfigDirty({}); loadConfig();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const TABS = [
    { key: 'users', label: '👤 用户管理' },
    { key: 'audit', label: '📋 审计日志' },
    { key: 'config', label: '⚙️ 系统配置' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--bd)', paddingBottom: 8 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '6px 16px', borderRadius: 'var(--R2)', border: 'none', cursor: 'pointer',
              background: tab === t.key ? 'var(--ac)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--tx2)',
              fontWeight: tab === t.key ? 700 : 400, fontSize: 12,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="inp" style={{ width: 120 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">全部角色</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button className="b bga" style={{ marginLeft: 'auto' }} onClick={() => setAddModal(true)}>
              + 新建用户
            </button>
          </div>
          {loading ? <Loading /> : (
            <div className="tw"><div className="ts"><table>
              <thead><tr>
                <th>用户名</th><th>显示名称</th><th>角色</th>
                <th>绑定仓库</th><th>业务线</th><th>状态</th>
                <th>最后登录</th><th>操作</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="fw6">{u.username}</td>
                    <td>{u.display_name}</td>
                    <td>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: (ROLE_COLORS[u.role] || '#94a3b8') + '25',
                        color: ROLE_COLORS[u.role] || '#94a3b8',
                      }}>{ROLE_LABELS[u.role] || u.role}</span>
                    </td>
                    <td className="mn">{u.bound_warehouse || '-'}</td>
                    <td className="mn">{u.bound_biz_line || '-'}</td>
                    <td>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: u.is_active ? '#10b98120' : '#94a3b820',
                        color: u.is_active ? '#10b981' : '#94a3b8',
                      }}>{u.is_active ? '启用' : '停用'}</span>
                    </td>
                    <td className="tm mn">{u.last_login?.slice(0, 10) || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="b bgs" style={{ fontSize: 10, padding: '2px 8px' }}
                          onClick={() => setEditModal({ ...u, _new_password: '' })}>编辑</button>
                        {u.is_active
                          ? <button className="b" style={{ fontSize: 10, padding: '2px 8px', background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444' }}
                            onClick={() => deactivateUser(u.id)}>停用</button>
                          : <button className="b bga" style={{ fontSize: 10, padding: '2px 8px' }}
                            onClick={() => reactivateUser(u.id)}>恢复</button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div></div>
          )}
        </div>
      )}

      {/* Audit logs tab */}
      {tab === 'audit' && (
        <div>
          {auditLoading ? <Loading /> : (
            <div className="tw"><div className="ts"><table>
              <thead><tr>
                <th>时间</th><th>用户</th><th>操作</th><th>数据表</th><th>记录ID</th><th>详情</th>
              </tr></thead>
              <tbody>
                {auditLogs.map((l, i) => (
                  <tr key={i}>
                    <td className="mn tm">{String(l.created_at || '').slice(0, 19)}</td>
                    <td className="fw6">{l.user_display || l.username}</td>
                    <td><span style={{ color: 'var(--ac2)', fontSize: 11 }}>{l.action}</span></td>
                    <td className="tm">{l.target_table}</td>
                    <td className="mn">{l.target_id}</td>
                    <td style={{ maxWidth: 200, fontSize: 10, color: 'var(--tx2)' }}>{l.detail}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tx3)', padding: 20 }}>暂无审计日志</td></tr>
                )}
              </tbody>
            </table></div></div>
          )}
        </div>
      )}

      {/* System config tab */}
      {tab === 'config' && (
        <div>
          {configLoading ? <Loading /> : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 16 }}>
                {Object.entries(CONFIG_LABELS).map(([k, label]) => {
                  const val = configDirty[k] !== undefined ? configDirty[k] : config[k];
                  const isPct = PCT_KEYS.has(k);
                  const displayVal = isPct && typeof val === 'number' ? (val * 100).toFixed(1) : val;
                  return (
                    <div key={k} style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4 }}>{label}</div>
                      <input className="inp" type={typeof config[k] === 'number' ? 'number' : 'text'}
                        step={isPct ? '0.1' : '0.01'}
                        value={displayVal ?? ''}
                        onChange={e => {
                          const raw = e.target.value;
                          setConfigDirty(prev => ({ ...prev, [k]: isPct ? parseFloat(raw) / 100 : raw }));
                        }}
                      />
                      {isPct && <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 2 }}>输入百分比数值, 如: 21 = 21%</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="b bgs" onClick={() => { setConfigDirty({}); loadConfig(); }}>重置</button>
                <button className="b bga" onClick={saveConfig}>
                  保存配置 {Object.keys(configDirty).length > 0 ? `(${Object.keys(configDirty).length}项变更)` : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add user modal */}
      {addModal && (
        <Modal title="新建用户" onClose={() => setAddModal(false)}>
          <UserFormFields form={form} setForm={setForm} showPassword={true} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="b bgs" onClick={() => setAddModal(false)}>取消</button>
            <button className="b bga" onClick={createUser}>创建</button>
          </div>
        </Modal>
      )}

      {/* Edit user modal */}
      {editModal && (
        <Modal title={`编辑用户 — ${editModal.username}`} onClose={() => setEditModal(null)}>
          <UserFormFields form={editModal} setForm={setEditModal} showPassword={false} />
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--tx3)' }}>新密码 (留空不修改)</label>
            <input className="inp" type="password" value={editModal._new_password || ''}
              onChange={e => setEditModal({ ...editModal, _new_password: e.target.value })} placeholder="留空则不修改" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="b bgs" onClick={() => setEditModal(null)}>取消</button>
            <button className="b bga" onClick={updateUser}>保存</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UserFormFields({ form, setForm, showPassword }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {showPassword && (
        <>
          <div>
            <label style={{ fontSize: 11, color: 'var(--tx3)' }}>用户名 *</label>
            <input className="inp" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--tx3)' }}>密码 *</label>
            <input className="inp" type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
        </>
      )}
      <div>
        <label style={{ fontSize: 11, color: 'var(--tx3)' }}>显示名称 *</label>
        <input className="inp" value={form.display_name || ''} onChange={e => setForm({ ...form, display_name: e.target.value })} />
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--tx3)' }}>角色</label>
        <select className="inp" value={form.role || 'worker'} onChange={e => setForm({ ...form, role: e.target.value })}>
          {Object.entries({ admin: '管理员', hr: 'HR', fin: '财务', wh: '仓库管理', sup: '供应商', mgr: '经理', worker: '工人' })
            .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--tx3)' }}>语言</label>
        <select className="inp" value={form.lang || 'zh'} onChange={e => setForm({ ...form, lang: e.target.value })}>
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="ar">العربية</option>
          <option value="hu">Magyar</option>
          <option value="vi">Tiếng Việt</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--tx3)' }}>绑定仓库 (可选)</label>
        <input className="inp" value={form.bound_warehouse || ''} onChange={e => setForm({ ...form, bound_warehouse: e.target.value })} placeholder="如: UNA" />
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--tx3)' }}>绑定业务线 (可选)</label>
        <input className="inp" value={form.bound_biz_line || ''} onChange={e => setForm({ ...form, bound_biz_line: e.target.value })} placeholder="如: 9A" />
      </div>
      <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          启用账户
        </label>
      </div>
    </div>
  );
}
