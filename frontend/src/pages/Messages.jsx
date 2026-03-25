import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';

const TYPE_COLORS = {
  notice: '#3b82f6', alert: '#f0526c', task: '#f59e0b', system: '#8b5cf6',
};
const TYPE_LABELS = { notice: '通知', alert: '警告', task: '任务', system: '系统' };
const PRIORITY_COLORS = { normal: '#94a3b8', high: '#f59e0b', urgent: '#f0526c' };
const PRIORITY_LABELS = { normal: '普通', high: '重要', urgent: '紧急' };

const ROLES = ['admin','hr','fin','wh','sup','mgr','worker'];
const ROLE_LABELS = { admin:'管理员', hr:'HR', fin:'财务', wh:'仓库', sup:'供应商', mgr:'经理', worker:'工人' };

export default function Messages({ token, user }) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [sendModal, setSendModal] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const showToast = useToast();

  const canSend = ['admin', 'hr', 'mgr'].includes(user?.role);

  const emptyForm = {
    subject: '', body: '', msg_type: 'notice', priority: 'normal',
    is_broadcast: false, recipient: '', recipient_role: '',
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api(`/api/v1/messages?unread_only=${unreadOnly}`, { token }),
      api('/api/v1/messages/unread-count', { token }),
    ]).then(([msgs, cnt]) => {
      setMessages(msgs);
      setUnread(cnt.unread || 0);
    }).finally(() => setLoading(false));
  }, [token, unreadOnly]);

  useEffect(() => { load(); }, [load]);

  const selMsg = messages.find(m => m.id === selId);

  const openMsg = async (id) => {
    setSelId(id);
    const msg = messages.find(m => m.id === id);
    if (msg && !msg.is_read) {
      try {
        await api(`/api/v1/messages/${id}/read`, { method: 'POST', token });
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
        setUnread(prev => Math.max(0, prev - 1));
      } catch (_) {}
    }
  };

  const markAllRead = async () => {
    try {
      await api('/api/v1/messages/read-all', { method: 'POST', token });
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      setUnread(0);
      showToast('全部已读');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const sendMessage = async () => {
    if (!form.body) { showToast('消息内容不能为空', 'err'); return; }
    try {
      const body = { ...form };
      if (!body.recipient) delete body.recipient;
      if (!body.recipient_role) delete body.recipient_role;
      await api('/api/v1/messages', { method: 'POST', body, token });
      showToast('消息已发送'); setSendModal(false); setForm(emptyForm); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const deleteMsg = async (id) => {
    if (!confirm('确定删除此消息？')) return;
    try {
      await api(`/api/v1/messages/${id}`, { method: 'DELETE', token });
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selId === id) setSelId(null);
      showToast('已删除');
    } catch (e) { showToast(e.message, 'err'); }
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--R2)', padding: '6px 12px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--tx2)' }}>收件箱</span>
          {unread > 0 && (
            <span style={{
              background: '#f0526c', color: '#fff', borderRadius: 10,
              padding: '1px 6px', fontSize: 10, fontWeight: 700,
            }}>{unread}</span>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
          只看未读
        </label>
        {unread > 0 && (
          <button className="b bgs" style={{ fontSize: 11 }} onClick={markAllRead}>
            全部标为已读
          </button>
        )}
        {canSend && (
          <button className="b bga" style={{ marginLeft: 'auto' }} onClick={() => setSendModal(true)}>
            ✉ 发送消息
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 230px)', overflow: 'hidden' }}>
        {/* Message list */}
        <div style={{ width: 320, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loading ? <Loading /> : messages.map(m => (
            <div key={m.id} onClick={() => openMsg(m.id)}
              style={{
                padding: '10px 12px', borderRadius: 'var(--R2)', cursor: 'pointer',
                border: `1px solid ${selId === m.id ? 'var(--ac)' : 'var(--bd)'}`,
                background: selId === m.id ? 'var(--ac)12' : m.is_read ? 'var(--bg)' : 'var(--bg2)',
                borderLeft: `3px solid ${TYPE_COLORS[m.msg_type] || '#3b82f6'}`,
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {!m.is_read && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f0526c', display: 'inline-block' }} />
                  )}
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 3,
                    background: (TYPE_COLORS[m.msg_type] || '#3b82f6') + '20',
                    color: TYPE_COLORS[m.msg_type] || '#3b82f6',
                  }}>{TYPE_LABELS[m.msg_type] || m.msg_type}</span>
                  {m.priority !== 'normal' && (
                    <span style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 3,
                      background: (PRIORITY_COLORS[m.priority] || '#f59e0b') + '20',
                      color: PRIORITY_COLORS[m.priority] || '#f59e0b',
                    }}>{PRIORITY_LABELS[m.priority] || m.priority}</span>
                  )}
                </div>
                <span style={{ fontSize: 9, color: 'var(--tx3)' }}>
                  {m.created_at?.slice(5, 16)}
                </span>
              </div>
              {m.subject && (
                <div style={{ fontWeight: m.is_read ? 500 : 700, fontSize: 12, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.subject}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--tx2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.body}
              </div>
              <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 3 }}>
                发件人: {m.sender_display || m.sender}
                {m.is_broadcast && <span style={{ marginLeft: 6, color: '#8b5cf6' }}>@ 全员</span>}
                {m.recipient_role && <span style={{ marginLeft: 6, color: '#3b82f6' }}>@ {ROLE_LABELS[m.recipient_role] || m.recipient_role}</span>}
              </div>
            </div>
          ))}
          {!loading && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--tx3)', fontSize: 12 }}>
              {unreadOnly ? '没有未读消息 ✓' : '暂无消息'}
            </div>
          )}
        </div>

        {/* Message detail */}
        {selMsg ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="cd">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  {selMsg.subject && (
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{selMsg.subject}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4,
                      background: (TYPE_COLORS[selMsg.msg_type] || '#3b82f6') + '20',
                      color: TYPE_COLORS[selMsg.msg_type] || '#3b82f6',
                    }}>{TYPE_LABELS[selMsg.msg_type] || selMsg.msg_type}</span>
                    {selMsg.priority !== 'normal' && (
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: (PRIORITY_COLORS[selMsg.priority]) + '20',
                        color: PRIORITY_COLORS[selMsg.priority],
                      }}>{PRIORITY_LABELS[selMsg.priority]}</span>
                    )}
                    <span style={{ fontSize: 10, color: 'var(--tx3)' }}>
                      发件人: <strong>{selMsg.sender_display || selMsg.sender}</strong>
                    </span>
                    {selMsg.is_broadcast && <span style={{ fontSize: 10, color: '#8b5cf6' }}>📢 全员广播</span>}
                    {selMsg.recipient_role && (
                      <span style={{ fontSize: 10, color: '#3b82f6' }}>→ 角色: {ROLE_LABELS[selMsg.recipient_role] || selMsg.recipient_role}</span>
                    )}
                    {selMsg.recipient && <span style={{ fontSize: 10, color: '#10b981' }}>→ {selMsg.recipient}</span>}
                    <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{selMsg.created_at?.slice(0, 16)}</span>
                  </div>
                </div>
                {(user?.role === 'admin' || selMsg.sender === user?.username) && (
                  <button
                    style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}
                    onClick={() => deleteMsg(selMsg.id)}
                  >删除</button>
                )}
              </div>
              <div style={{
                borderTop: '1px solid var(--bd)', paddingTop: 16,
                fontSize: 14, lineHeight: 1.8, color: 'var(--tx)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {selMsg.body}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 13 }}>
            ← 选择左侧消息查看详情
          </div>
        )}
      </div>

      {/* Send modal */}
      {sendModal && (
        <Modal title="发送消息" onClose={() => setSendModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx3)' }}>主题</label>
              <input className="inp" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="可选" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx3)' }}>消息内容 *</label>
              <textarea className="inp" rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="消息内容..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--tx3)' }}>消息类型</label>
                <select className="inp" value={form.msg_type} onChange={e => setForm({ ...form, msg_type: e.target.value })}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--tx3)' }}>优先级</label>
                <select className="inp" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            {['admin', 'hr'].includes(user?.role) && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_broadcast}
                    onChange={e => setForm({ ...form, is_broadcast: e.target.checked, recipient: '', recipient_role: '' })} />
                  全员广播
                </label>
              </div>
            )}
            {!form.is_broadcast && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--tx3)' }}>发送给角色 (可选)</label>
                  <select className="inp" value={form.recipient_role}
                    onChange={e => setForm({ ...form, recipient_role: e.target.value, recipient: '' })}>
                    <option value="">选择角色...</option>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--tx3)' }}>发送给用户名 (可选)</label>
                  <input className="inp" value={form.recipient}
                    onChange={e => setForm({ ...form, recipient: e.target.value, recipient_role: '' })}
                    placeholder="具体用户名" />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="b bgs" onClick={() => setSendModal(false)}>取消</button>
            <button className="b bga" onClick={sendMessage}>发送</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
