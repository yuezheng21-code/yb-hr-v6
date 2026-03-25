import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';

const STATUS_COLORS = {
  available: '#10b981', contacted: '#3b82f6', interviewing: '#f59e0b',
  hired: '#8b5cf6', rejected: '#f0526c',
};
const STATUS_LABELS = {
  available: '可用', contacted: '已联系', interviewing: '面试中',
  hired: '已录用', rejected: '已拒绝',
};
const SOURCE_LABELS = { own: '自有渠道', supplier: '供应商推荐' };
const BIZ_LABELS = { '9A': '出库', '9B': '入库', '9C': 'WLE', '9D': '卸柜' };

const fmtE = v => v != null ? `€${Number(v).toFixed(2)}` : '-';

export default function Talent({ token, user }) {
  const [talents, setTalents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [matchModal, setMatchModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBizLine, setFilterBizLine] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [demands, setDemands] = useState([]);
  const [matchDemandId, setMatchDemandId] = useState('');
  const showToast = useToast();

  const canEdit = ['admin', 'hr', 'mgr'].includes(user?.role);

  const emptyForm = {
    name: '', phone: '', nationality: '', source_type: 'own',
    preferred_biz_line: '', position: '', expected_rate: '',
    languages: '', skills: '', referrer: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('pool_status', filterStatus);
    if (filterBizLine) params.set('biz_line', filterBizLine);
    if (searchQ) params.set('q', searchQ);
    Promise.all([
      api(`/api/v1/talent?${params}`, { token }),
      api('/api/v1/talent/stats', { token }).catch(() => null),
    ]).then(([t, s]) => {
      setTalents(t);
      setStats(s);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterBizLine, searchQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const selT = talents.find(t => t.id === selId);

  const createTalent = async () => {
    if (!form.name) { showToast('请填写姓名', 'err'); return; }
    try {
      const body = { ...form };
      if (body.expected_rate) body.expected_rate = parseFloat(body.expected_rate);
      else delete body.expected_rate;
      await api('/api/v1/talent', { method: 'POST', body, token });
      showToast('人才已添加'); setAddModal(false); setForm(emptyForm); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const updateStatus = async (id, pool_status) => {
    try {
      await api(`/api/v1/talent/${id}`, { method: 'PUT', body: { pool_status }, token });
      showToast('状态已更新'); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const matchToDemand = async () => {
    if (!selId) return;
    try {
      await api(`/api/v1/talent/${selId}/match`, {
        method: 'POST',
        body: { demand_id: matchDemandId ? parseInt(matchDemandId) : null },
        token,
      });
      showToast('匹配成功'); setMatchModal(false); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const openMatchModal = () => {
    api('/api/v1/dispatch?status=open', { token }).then(setDemands).catch(() => {});
    api('/api/v1/dispatch?status=recruiting', { token })
      .then(more => setDemands(prev => [...prev, ...more])).catch(() => {});
    setMatchModal(true);
  };

  const funnelSteps = ['available', 'contacted', 'interviewing', 'hired'];

  return (
    <div>
      {/* Stats + funnel */}
      {stats && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {funnelSteps.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    background: STATUS_COLORS[s] + '20', border: `1px solid ${STATUS_COLORS[s]}`,
                    borderRadius: 'var(--R2)', padding: '8px 14px', textAlign: 'center', minWidth: 70,
                  }}>
                    <div style={{ fontSize: 9, color: STATUS_COLORS[s] }}>{STATUS_LABELS[s]}</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: STATUS_COLORS[s] }}>
                      {stats.by_status?.[s] || 0}
                    </div>
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <span style={{ color: 'var(--tx3)', margin: '0 4px', fontSize: 14 }}>›</span>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <button className="b bga" style={{ marginLeft: 'auto' }}
                onClick={() => setAddModal(true)}>
                + 添加人才
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="inp" placeholder="搜索姓名..." style={{ width: 140 }}
          value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        <select className="inp" style={{ width: 110 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="inp" style={{ width: 110 }} value={filterBizLine} onChange={e => setFilterBizLine(e.target.value)}>
          <option value="">全部业务线</option>
          {Object.entries(BIZ_LABELS).map(([k, v]) => <option key={k} value={k}>{k} {v}</option>)}
        </select>
        {!stats && canEdit && (
          <button className="b bga" style={{ marginLeft: 'auto' }} onClick={() => setAddModal(true)}>
            + 添加人才
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 280px)', overflow: 'hidden' }}>
        {/* List */}
        <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading ? <Loading /> : talents.map(t => (
            <div key={t.id} onClick={() => setSelId(t.id)}
              style={{
                padding: '10px 12px', borderRadius: 'var(--R2)', cursor: 'pointer',
                border: `1px solid ${selId === t.id ? 'var(--ac)' : 'var(--bd)'}`,
                background: selId === t.id ? 'var(--ac)12' : 'var(--bg2)',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: (STATUS_COLORS[t.pool_status] || '#94a3b8') + '25',
                  color: STATUS_COLORS[t.pool_status] || '#94a3b8',
                }}>{STATUS_LABELS[t.pool_status] || t.pool_status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 2 }}>
                {t.position || '-'} · {BIZ_LABELS[t.preferred_biz_line] || t.preferred_biz_line || '-'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--tx3)' }}>
                {SOURCE_LABELS[t.source_type] || t.source_type} · {t.nationality || '-'}
                {t.expected_rate && ` · ${fmtE(t.expected_rate)}/h`}
              </div>
            </div>
          ))}
          {!loading && talents.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--tx3)', fontSize: 11 }}>暂无人才记录</div>
          )}
        </div>

        {/* Detail */}
        {selT ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="cd">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 20 }}>{selT.name}</span>
                  <span style={{
                    marginLeft: 10, fontSize: 10, padding: '3px 8px', borderRadius: 4,
                    background: (STATUS_COLORS[selT.pool_status] || '#94a3b8') + '25',
                    color: STATUS_COLORS[selT.pool_status] || '#94a3b8',
                  }}>{STATUS_LABELS[selT.pool_status] || selT.pool_status}</span>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selT.pool_status === 'available' && (
                      <button className="b bgs" onClick={() => updateStatus(selT.id, 'contacted')}>联系</button>
                    )}
                    {selT.pool_status === 'contacted' && (
                      <button className="b bgs" onClick={() => updateStatus(selT.id, 'interviewing')}>→ 面试</button>
                    )}
                    {selT.pool_status === 'interviewing' && (
                      <button className="b bga" onClick={() => openMatchModal()}>录用 & 匹配</button>
                    )}
                    {selT.pool_status !== 'rejected' && selT.pool_status !== 'hired' && (
                      <button className="b" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444' }}
                        onClick={() => updateStatus(selT.id, 'rejected')}>拒绝</button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['姓名', selT.name],
                  ['电话', selT.phone || '-'],
                  ['国籍', selT.nationality || '-'],
                  ['来源', SOURCE_LABELS[selT.source_type] || selT.source_type],
                  ['意向业务线', BIZ_LABELS[selT.preferred_biz_line] || selT.preferred_biz_line || '-'],
                  ['意向岗位', selT.position || '-'],
                  ['期望时薪', selT.expected_rate ? `${fmtE(selT.expected_rate)}/h` : '-'],
                  ['语言', selT.languages || '-'],
                  ['技能', selT.skills || '-'],
                  ['推荐人', selT.referrer || '-'],
                  ['匹配评分', selT.match_score != null ? `${selT.match_score}分` : '-'],
                  ['创建人', selT.created_by || '-'],
                  ['创建时间', selT.created_at?.slice(0, 10) || '-'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{val}</div>
                  </div>
                ))}
                {selT.notes && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>备注</div>
                    <div style={{ fontSize: 12, color: 'var(--tx2)' }}>{selT.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 13 }}>
            ← 选择左侧人才查看详情
          </div>
        )}
      </div>

      {/* Add modal */}
      {addModal && (
        <Modal title="添加人才" onClose={() => setAddModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['name', '姓名 *', 'text'],
              ['phone', '电话', 'text'],
              ['nationality', '国籍', 'text'],
              ['position', '意向岗位', 'text'],
              ['expected_rate', '期望时薪(€/h)', 'number'],
              ['languages', '语言能力', 'text'],
              ['skills', '技能特长', 'text'],
              ['referrer', '推荐人', 'text'],
            ].map(([k, label, type]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: 'var(--tx3)' }}>{label}</label>
                <input className="inp" type={type} value={form[k]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx3)' }}>来源</label>
              <select className="inp" value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value })}>
                <option value="own">自有渠道</option>
                <option value="supplier">供应商推荐</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx3)' }}>意向业务线</label>
              <select className="inp" value={form.preferred_biz_line} onChange={e => setForm({ ...form, preferred_biz_line: e.target.value })}>
                <option value="">不限</option>
                {Object.entries(BIZ_LABELS).map(([k, v]) => <option key={k} value={k}>{k} {v}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: 'var(--tx3)' }}>备注</label>
              <textarea className="inp" rows={2} value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="b bgs" onClick={() => setAddModal(false)}>取消</button>
            <button className="b bga" onClick={createTalent}>添加</button>
          </div>
        </Modal>
      )}

      {/* Match modal */}
      {matchModal && selT && (
        <Modal title={`录用匹配 — ${selT.name}`} onClose={() => setMatchModal(false)}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--tx3)' }}>关联派遣需求 (可选)</label>
            <select className="inp" value={matchDemandId} onChange={e => setMatchDemandId(e.target.value)}>
              <option value="">不关联具体需求</option>
              {demands.map(d => (
                <option key={d.id} value={d.id}>
                  {d.demand_no} — {d.warehouse_code} {d.biz_line} ({d.matched_count}/{d.headcount}人)
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="b bgs" onClick={() => setMatchModal(false)}>取消</button>
            <button className="b bga" onClick={matchToDemand}>确认录用</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
