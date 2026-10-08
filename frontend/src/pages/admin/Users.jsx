import { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading } from '../../components/Spinner.jsx';
import { ROLE_META, ROLES, initials, timeAgo } from './shared.js';
import '../../styles/minimal.css';

const LANGS = [['zh', '中文'], ['en', 'English'], ['de', 'Deutsch'], ['tr', 'Türkçe'], ['ar', 'العربية'],
  ['hu', 'Magyar'], ['vi', 'Tiếng Việt'], ['pl', 'Polski']];
const BIZ_LINES = ['渊博', '579'];

const EMPTY = {
  username: '', display_name: '', password: '', role: 'worker', lang: 'zh',
  bound_warehouse: '', bound_supplier_id: '', bound_biz_line: '', pin: '', is_active: true,
};

export default function Users({ token, user }) {
  const showToast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('active');
  const [drawer, setDrawer] = useState(null); // { mode: 'new'|'edit', form }
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const load = () => {
    setLoading(true);
    api('/api/v1/admin/users?active_only=false&limit=1000', { token })
      .then(setUsers).catch(e => showToast(e.message, 'err')).finally(() => setLoading(false));
  };
  useEffect(() => {
    if (user?.role !== 'admin') return;
    load();
    api('/api/v1/warehouses', { token }).then(setWarehouses).catch(() => {});
    api('/api/v1/suppliers', { token }).then(setSuppliers).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const supName = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s.name])), [suppliers]);

  const byStatus = users.filter(u => status === 'all' || (status === 'active' ? u.is_active : !u.is_active));
  const counts = ROLES.reduce((acc, r) => ({ ...acc, [r]: byStatus.filter(u => u.role === r).length }), {});
  const list = byStatus.filter(u => (!role || u.role === role) && (!q ||
    `${u.username} ${u.display_name}`.toLowerCase().includes(q.toLowerCase())));

  if (user?.role !== 'admin') return <div className="mz-empty">仅管理员可访问</div>;

  const openNew = () => setDrawer({ mode: 'new', form: { ...EMPTY } });
  const openEdit = (u) => setDrawer({
    mode: 'edit',
    form: {
      ...EMPTY, ...u, password: '', pin: u.pin || '',
      bound_warehouse: u.bound_warehouse || '', bound_supplier_id: u.bound_supplier_id || '', bound_biz_line: u.bound_biz_line || '',
    },
  });

  const save = async () => {
    const f = drawer.form;
    if (!f.display_name) { showToast('请填写显示名称', 'err'); return; }
    if (f.role === 'sup' && !f.bound_supplier_id) { showToast('供应商账号必须绑定供应商', 'err'); return; }
    if (f.role === 'wh' && !f.bound_warehouse) { showToast('仓管账号必须绑定仓库', 'err'); return; }
    const body = {
      display_name: f.display_name, role: f.role, lang: f.lang, is_active: f.is_active,
      bound_warehouse: f.bound_warehouse || null,
      bound_supplier_id: f.bound_supplier_id ? parseInt(f.bound_supplier_id) : null,
      bound_biz_line: f.bound_biz_line || null,
      pin: f.pin,
    };
    try {
      if (drawer.mode === 'new') {
        if (!f.username || !f.password) { showToast('用户名和密码必填', 'err'); return; }
        await api('/api/v1/admin/users', { method: 'POST', token, body: { ...body, username: f.username, password: f.password, pin: f.pin || null } });
        showToast('用户已创建');
      } else {
        if (f.password) body.password = f.password;
        await api(`/api/v1/admin/users/${f.id}`, { method: 'PUT', token, body });
        showToast('已保存');
      }
      setDrawer(null); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const toggleActive = async (u) => {
    if (u.is_active && !window.confirm(`停用 ${u.display_name}？停用后无法登录。`)) return;
    try {
      if (u.is_active) await api(`/api/v1/admin/users/${u.id}`, { method: 'DELETE', token });
      else await api(`/api/v1/admin/users/${u.id}`, { method: 'PUT', token, body: { is_active: true } });
      showToast(u.is_active ? '已停用' : '已恢复'); setDrawer(null); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const scope = (u) => {
    const parts = [];
    if (u.bound_warehouse) parts.push(`仓库 ${u.bound_warehouse}`);
    if (u.bound_supplier_id) parts.push(supName[u.bound_supplier_id] || `供应商 #${u.bound_supplier_id}`);
    if (u.bound_biz_line) parts.push(`业务线 ${u.bound_biz_line}`);
    if (parts.length) return parts.join(' · ');
    if ((u.role === 'sup' || u.role === 'wh')) return <span style={{ color: 'var(--og)' }}>未绑定</span>;
    return <span className="mz-muted">全部</span>;
  };

  return (
    <div className="mz">
      <div className="mz-head">
        <div>
          <div className="mz-sub">{users.filter(u => u.is_active).length} 个启用账号 · {users.filter(u => !u.is_active).length} 个已停用</div>
        </div>
        <div className="mz-actions"><button className="mz-btn mz-btn-p" onClick={openNew}>新建用户</button></div>
      </div>

      <div className="mz-card">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          <input className="mz-input" style={{ width: 220 }} placeholder="搜索用户名或姓名" value={q} onChange={e => setQ(e.target.value)} />
          <div className="mz-seg">
            <button className={role === '' ? 'on' : ''} onClick={() => setRole('')}>全部<em>{byStatus.length}</em></button>
            {ROLES.filter(r => counts[r]).map(r => (
              <button key={r} className={role === r ? 'on' : ''} onClick={() => setRole(r)}>{ROLE_META[r].label}<em>{counts[r]}</em></button>
            ))}
          </div>
          <div className="mz-seg" style={{ marginLeft: 'auto' }}>
            {[['active', '启用'], ['inactive', '停用'], ['all', '全部']].map(([k, l]) => (
              <button key={k} className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>{l}</button>
            ))}
          </div>
        </div>

        {loading ? <Loading /> : (
          <div className="mz-scroll">
            <table className="mz-table">
              <thead><tr><th>用户</th><th>角色</th><th>数据范围</th><th>PIN</th><th>语言</th><th>最近登录</th><th>状态</th><th /></tr></thead>
              <tbody>
                {list.map(u => (
                  <tr key={u.id} style={{ cursor: 'pointer', opacity: u.is_active ? 1 : .55 }} onClick={() => openEdit(u)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="mz-av" style={{ background: ROLE_META[u.role]?.color || '#6a7498' }}>{initials(u.display_name)}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.display_name}{u.id === user.id && <span className="mz-muted"> （我）</span>}</div>
                          <div className="mz-muted">{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="mz-tag"><span className="mz-dot" style={{ background: ROLE_META[u.role]?.color }} />{ROLE_META[u.role]?.label || u.role}</span></td>
                    <td style={{ fontSize: 12 }}>{scope(u)}</td>
                    <td className="mz-muted">{u.pin ? '••••' : '—'}</td>
                    <td className="mz-muted">{(LANGS.find(l => l[0] === u.lang) || [, u.lang])[1]}</td>
                    <td className="mz-muted">{timeAgo(u.last_login)}</td>
                    <td><span className="mz-tag"><span className="mz-dot" style={{ background: u.is_active ? 'var(--gn)' : 'var(--tx3)' }} />{u.is_active ? '启用' : '停用'}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="mz-link">编辑</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <div className="mz-empty">没有符合条件的用户</div>}
          </div>
        )}
      </div>

      {drawer && (
        <UserDrawer
          drawer={drawer} setDrawer={setDrawer} onSave={save} onToggle={toggleActive}
          warehouses={warehouses} suppliers={suppliers} isSelf={drawer.form.id === user.id}
        />
      )}
    </div>
  );
}

function UserDrawer({ drawer, setDrawer, onSave, onToggle, warehouses, suppliers, isSelf }) {
  const f = drawer.form;
  const isNew = drawer.mode === 'new';
  const set = (k, v) => setDrawer({ ...drawer, form: { ...f, [k]: v } });

  return (
    <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) setDrawer(null); }}>
      <div className="mz-drawer">
        <div className="mz-drawer-h">
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{isNew ? '新建用户' : f.display_name}</div>
            {!isNew && <div className="mz-muted" style={{ marginTop: 2 }}>{f.username} · 创建于 {f.created_at?.slice(0, 10)}</div>}
          </div>
          <button className="mz-link" style={{ fontSize: 18 }} onClick={() => setDrawer(null)}>×</button>
        </div>

        <div className="mz-drawer-b">
          <div className="mz-section">账号</div>
          {isNew && (
            <div className="mz-field"><label>用户名</label>
              <input className="mz-input" value={f.username} onChange={e => set('username', e.target.value.trim())} autoFocus /></div>
          )}
          <div className="mz-field"><label>显示名称</label>
            <input className="mz-input" value={f.display_name} onChange={e => set('display_name', e.target.value)} />
            {f.role === 'worker' && <span className="mz-hint">工人账号的显示名称需与员工花名册姓名一致，用于关联打卡和报工。</span>}
          </div>
          <div className="mz-field"><label>{isNew ? '密码' : '重置密码'}</label>
            <input className="mz-input" type="password" value={f.password} placeholder={isNew ? '至少 6 位' : '留空则不修改'}
              onChange={e => set('password', e.target.value)} /></div>

          <div className="mz-section">角色</div>
          <div className="mz-roles">
            {ROLES.map(r => (
              <button key={r} type="button" className={`mz-role ${f.role === r ? 'on' : ''}`} disabled={isSelf && r !== 'admin'}
                onClick={() => set('role', r)}>
                <span className="mz-tag" style={{ color: 'inherit' }}><span className="mz-dot" style={{ background: ROLE_META[r].color }} />{ROLE_META[r].label}</span>
                <small>{ROLE_META[r].desc}</small>
              </button>
            ))}
          </div>

          <div className="mz-section">数据范围</div>
          {(f.role === 'wh' || f.bound_warehouse) && (
            <div className="mz-field"><label>绑定仓库{f.role === 'wh' ? '（必填）' : ''}</label>
              <select className="mz-select" value={f.bound_warehouse} onChange={e => set('bound_warehouse', e.target.value)}>
                <option value="">不限</option>
                {warehouses.map(w => <option key={w.code} value={w.code}>{w.code} · {w.name}</option>)}
              </select></div>
          )}
          {(f.role === 'sup' || f.bound_supplier_id) && (
            <div className="mz-field"><label>绑定供应商{f.role === 'sup' ? '（必填）' : ''}</label>
              <select className="mz-select" value={f.bound_supplier_id} onChange={e => set('bound_supplier_id', e.target.value)}>
                <option value="">不限</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
              </select></div>
          )}
          <div className="mz-field"><label>业务线</label>
            <select className="mz-select" value={f.bound_biz_line} onChange={e => set('bound_biz_line', e.target.value)}>
              <option value="">不限</option>
              {BIZ_LINES.map(b => <option key={b} value={b}>{b}</option>)}
            </select></div>
          {f.role !== 'wh' && f.role !== 'sup' && !f.bound_warehouse && !f.bound_supplier_id && (
            <span className="mz-hint">{f.role === 'worker' ? '工人只能看到自己的数据。' : '该角色默认可查看全部仓库与供应商数据。'}</span>
          )}

          <div className="mz-section">偏好</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="mz-field"><label>界面语言</label>
              <select className="mz-select" value={f.lang} onChange={e => set('lang', e.target.value)}>
                {LANGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select></div>
            <div className="mz-field"><label>打卡 PIN（4 位）</label>
              <input className="mz-input" inputMode="numeric" maxLength={4} value={f.pin} placeholder="可选"
                onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
          </div>

          {isNew && (
            <label className="mz-switch">启用账号
              <input type="checkbox" checked={f.is_active} onChange={e => set('is_active', e.target.checked)} /></label>
          )}
        </div>

        <div className="mz-drawer-f">
          {!isNew && !isSelf && (
            <button className={`mz-btn ${f.is_active ? 'mz-btn-d' : ''}`} style={{ marginRight: 'auto' }} onClick={() => onToggle(f)}>
              {f.is_active ? '停用账号' : '恢复账号'}
            </button>
          )}
          <button className="mz-btn" onClick={() => setDrawer(null)}>取消</button>
          <button className="mz-btn mz-btn-p" onClick={onSave}>{isNew ? '创建' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}
