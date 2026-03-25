import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const STATUS_COLORS = {
  open: '#3b82f6', recruiting: '#f59e0b', filled: '#10b981', closed: '#94a3b8',
};
const STATUS_LABELS = { open:'招募中', recruiting:'招聘中', filled:'已满员', closed:'已关闭' };
const PRIORITY_COLORS = { high:'#f0526c', medium:'#f59e0b', low:'#10b981' };
const PRIORITY_LABELS = { high:'高', medium:'中', low:'低' };
const BIZ_LABELS = { '9A':'出库', '9B':'入库', '9C':'WLE', '9D':'卸柜' };

export default function Dispatch({ token, user }) {
  const [demands, setDemands] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [complianceModal, setComplianceModal] = useState(false);
  const [complianceInput, setComplianceInput] = useState('');
  const [complianceResult, setComplianceResult] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin','hr','mgr'].includes(user?.role);

  const emptyForm = {
    biz_line: '', warehouse_code: '', position: '',
    headcount: 1, start_date: '', end_date: '',
    shift_pattern: '', client_settlement_type: 'hourly',
    client_rate: '', priority: 'medium', requester: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterPriority) params.set('priority', filterPriority);
    Promise.all([
      api(`/api/v1/dispatch?${params}`, { token }),
      api('/api/v1/dispatch/stats', { token }).catch(() => null),
    ]).then(([d, s]) => {
      setDemands(d);
      setStats(s);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterPriority]); // eslint-disable-line react-hooks/exhaustive-deps

  const selD = demands.find(d => d.id === selId);

  const createDemand = async () => {
    if (!form.warehouse_code) { showToast('请填写仓库代码', 'err'); return; }
    try {
      const body = { ...form };
      body.headcount = parseInt(body.headcount) || 1;
      if (body.client_rate) body.client_rate = parseFloat(body.client_rate);
      else delete body.client_rate;
      if (!body.start_date) delete body.start_date;
      if (!body.end_date) delete body.end_date;
      await api('/api/v1/dispatch', { method: 'POST', body, token });
      showToast('需求已创建'); setAddModal(false); setForm(emptyForm); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api(`/api/v1/dispatch/${id}`, { method: 'PUT', body: { status }, token });
      showToast('状态已更新'); load();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const runComplianceCheck = async () => {
    let timesheets;
    try {
      timesheets = JSON.parse(complianceInput);
      if (!Array.isArray(timesheets)) throw new Error('must be array');
    } catch {
      showToast('请输入有效的工时JSON数组', 'err'); return;
    }
    setComplianceLoading(true);
    try {
      const result = await api('/api/v1/dispatch/compliance-check', {
        method: 'POST', body: { timesheets }, token,
      });
      setComplianceResult(result);
    } catch (e) { showToast(e.message, 'err'); }
    finally { setComplianceLoading(false); }
  };

  const statsBar = stats ? [
    { label: '开放需求', value: stats.by_status?.open || 0, color: '#3b82f6' },
    { label: '招聘中', value: stats.by_status?.recruiting || 0, color: '#f59e0b' },
    { label: '已满员', value: stats.by_status?.filled || 0, color: '#10b981' },
    { label: '需求总人数', value: stats.open_headcount || 0, color: '#8b5cf6' },
    { label: '已匹配', value: stats.matched_count || 0, color: '#10b981' },
    { label: '填满率', value: `${stats.fill_rate || 0}%`, color: '#f59e0b' },
  ] : [];

  return (
    <div>
      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {statsBar.map(s => (
            <div key={s.label} style={{
              background: 'var(--bg2)', border: '1px solid var(--bd)',
              borderRadius: 'var(--R2)', padding: '10px 18px', minWidth: 90,
              borderLeft: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: 9, color: 'var(--tx3)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</div>
            </div>
          ))}
          {canEdit && (
            <button className="b bga" style={{ marginLeft: 'auto', alignSelf: 'center' }}
              onClick={() => setAddModal(true)}>
              + 新建派遣需求
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="inp" style={{ width: 110 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="inp" style={{ width: 90 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">全部优先级</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {!stats && canEdit && (
          <button className="b bga" style={{ marginLeft: 'auto' }} onClick={() => setAddModal(true)}>
            + 新建派遣需求
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 260px)', overflow: 'hidden' }}>
        {/* List */}
        <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading ? <Loading /> : demands.map(d => (
            <div key={d.id} onClick={() => setSelId(d.id)}
              style={{
                padding: '10px 12px', borderRadius: 'var(--R2)', cursor: 'pointer',
                border: `1px solid ${selId === d.id ? 'var(--ac)' : 'var(--bd)'}`,
                background: selId === d.id ? 'var(--ac)12' : 'var(--bg2)',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--ac)' }}>{d.demand_no}</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: (PRIORITY_COLORS[d.priority] || '#94a3b8') + '25',
                  color: PRIORITY_COLORS[d.priority] || '#94a3b8',
                }}>{PRIORITY_LABELS[d.priority] || d.priority}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>
                {BIZ_LABELS[d.biz_line] || d.biz_line || '-'} · {d.warehouse_code || '-'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx2)' }}>
                {d.position || '-'} · 需 {d.headcount}人 · 已匹配 {d.matched_count}人
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: (STATUS_COLORS[d.status] || '#94a3b8') + '25',
                  color: STATUS_COLORS[d.status] || '#94a3b8',
                }}>{STATUS_LABELS[d.status] || d.status}</span>
                {d.start_date && (
                  <span style={{ fontSize: 9, color: 'var(--tx3)' }}>{d.start_date}</span>
                )}
              </div>
            </div>
          ))}
          {!loading && demands.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--tx3)', fontSize: 11 }}>暂无派遣需求</div>
          )}
        </div>

        {/* Detail */}
        {selD ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="cd">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ac)' }}>{selD.demand_no}</span>
                  <span style={{
                    marginLeft: 10, fontSize: 10, padding: '3px 8px', borderRadius: 4,
                    background: (PRIORITY_COLORS[selD.priority] || '#94a3b8') + '25',
                    color: PRIORITY_COLORS[selD.priority] || '#94a3b8',
                  }}>{PRIORITY_LABELS[selD.priority] || selD.priority}优先级</span>
                </div>
                {canEdit && selD.status !== 'closed' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selD.status === 'open' && (
                      <button className="b bgs" onClick={() => updateStatus(selD.id, 'recruiting')}>→ 招聘中</button>
                    )}
                    {selD.status === 'recruiting' && (
                      <button className="b bga" onClick={() => updateStatus(selD.id, 'filled')}>→ 已满员</button>
                    )}
                    <button className="b" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444' }}
                      onClick={() => updateStatus(selD.id, 'closed')}>关闭</button>
                  </div>
                )}
                <button className="b bgs" onClick={() => { setComplianceResult(null); setComplianceInput(''); setComplianceModal(true); }}>
                  ✔ ArbZG合规检查
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['需求编号', selD.demand_no],
                  ['状态', STATUS_LABELS[selD.status] || selD.status],
                  ['仓库', selD.warehouse_code || '-'],
                  ['业务线', BIZ_LABELS[selD.biz_line] || selD.biz_line || '-'],
                  ['岗位', selD.position || '-'],
                  ['需求人数', selD.headcount],
                  ['已匹配', selD.matched_count],
                  ['缺口', selD.headcount - selD.matched_count],
                  ['班次', selD.shift_pattern || '-'],
                  ['结算方式', selD.client_settlement_type || '-'],
                  ['客户单价', selD.client_rate ? `€${Number(selD.client_rate).toFixed(2)}` : '-'],
                  ['开始日期', selD.start_date || '-'],
                  ['结束日期', selD.end_date || '-'],
                  ['申请人', selD.requester || '-'],
                  ['创建人', selD.created_by || '-'],
                  ['创建时间', selD.created_at?.slice(0, 10) || '-'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{val}</div>
                  </div>
                ))}
                {selD.notes && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>备注</div>
                    <div style={{ fontSize: 12, color: 'var(--tx2)' }}>{selD.notes}</div>
                  </div>
                )}
              </div>

              {/* Fill rate progress */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--tx3)' }}>填满进度</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    {selD.matched_count}/{selD.headcount}人
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${selD.headcount > 0 ? Math.min(100, (selD.matched_count / selD.headcount) * 100) : 0}%`,
                    background: selD.matched_count >= selD.headcount ? '#10b981' : 'var(--ac)',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 13 }}>
            ← 选择左侧需求查看详情
          </div>
        )}
      </div>

      {/* Compliance Check Modal */}
      {complianceModal && (
        <Modal title="ArbZG 合规检查" onClose={() => setComplianceModal(false)}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 6 }}>
              输入员工工时记录 (JSON数组格式)，检查是否符合德国劳动时间法 (ArbZG)。
            </div>
            <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 8, background: 'var(--bg3)', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace' }}>
              示例: {`[{"date":"2025-03-01","hours":9.5},{"date":"2025-03-02","hours":8}]`}
            </div>
            <textarea
              className="inp" rows={4}
              placeholder='[{"date":"YYYY-MM-DD","hours":8.5},...]'
              value={complianceInput}
              onChange={e => setComplianceInput(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 11, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {complianceResult && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  ['工作天数', complianceResult.total_days, 'var(--cy)'],
                  ['总工时', `${complianceResult.total_hours}h`, 'var(--ac)'],
                  ['违规数', complianceResult.summary?.violation_count || 0, complianceResult.compliant ? 'var(--gn)' : '#ef4444'],
                  ['警告数', complianceResult.summary?.warning_count || 0, '#f59e0b'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '6px 12px', textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color }}>{val}</div>
                    <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{label}</div>
                  </div>
                ))}
                <div style={{
                  marginLeft: 'auto', alignSelf: 'center',
                  padding: '4px 14px', borderRadius: 6, fontWeight: 700, fontSize: 12,
                  background: complianceResult.compliant ? '#10b98120' : '#ef444420',
                  color: complianceResult.compliant ? '#10b981' : '#ef4444',
                  border: `1px solid ${complianceResult.compliant ? '#10b981' : '#ef4444'}44`,
                }}>
                  {complianceResult.compliant ? '✓ 合规' : '✗ 存在违规'}
                </div>
              </div>

              {complianceResult.violations?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>违规项</div>
                  {complianceResult.violations.map((v, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#ef4444', background: '#ef444410', borderRadius: 4, padding: '4px 8px', marginBottom: 3 }}>
                      {v.message}
                    </div>
                  ))}
                </div>
              )}

              {complianceResult.warnings?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>警告项</div>
                  {complianceResult.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#f59e0b', background: '#f59e0b10', borderRadius: 4, padding: '4px 8px', marginBottom: 3 }}>
                      {w.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="b bgs" onClick={() => setComplianceModal(false)}>关闭</button>
            <button className="b bga" onClick={runComplianceCheck} disabled={complianceLoading}>
              {complianceLoading ? '检查中…' : '运行检查'}
            </button>
          </div>
        </Modal>
      )}

      {/* Add modal */}
      {addModal && (
        <Modal title="新建派遣需求" onClose={() => setAddModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['warehouse_code', '仓库代码', 'text'],
              ['biz_line', '业务线 (9A/9B/9C/9D)', 'text'],
              ['position', '岗位', 'text'],
              ['headcount', '需求人数', 'number'],
              ['start_date', '开始日期', 'date'],
              ['end_date', '结束日期', 'date'],
              ['shift_pattern', '班次安排', 'text'],
              ['client_rate', '客户单价(€)', 'number'],
              ['requester', '申请人', 'text'],
            ].map(([k, label, type]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: 'var(--tx3)' }}>{label}</label>
                <input className="inp" type={type} value={form[k]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx3)' }}>优先级</label>
              <select className="inp" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx3)' }}>结算方式</label>
              <select className="inp" value={form.client_settlement_type} onChange={e => setForm({ ...form, client_settlement_type: e.target.value })}>
                <option value="hourly">按时计费</option>
                <option value="piece">按件计费</option>
                <option value="contract">承包合同</option>
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
            <button className="b bga" onClick={createDemand}>创建</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
