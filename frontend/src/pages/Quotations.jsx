import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const STATUS_COLORS = {
  draft: '#94a3b8', sent: '#3b82f6', negotiating: '#f59e0b',
  accepted: '#10b981', rejected: '#f0526c',
};
const STATUS_LABELS = {
  draft:'草稿', sent:'已发送', negotiating:'谈判中', accepted:'已接受', rejected:'已拒绝',
};
const PROJECT_TYPES = ['dispatch','werkvertrag','cross_docking'];
const PROJECT_LABELS = { dispatch:'纯派遣', werkvertrag:'项目承包', cross_docking:'快转仓' };
const GRADES = ['P1','P2','P3','P4','P5','P6','P7','P8','P9'];
const BIZ_LINES = ['9A','9B','9C','9D'];
const BIZ_LABELS = { '9A':'出库作业', '9B':'入库作业', '9C':'WLE作业', '9D':'卸柜作业' };

const fmtE = v => v != null ? `€${Number(v).toFixed(2)}` : '-';
const fmtPct = v => v != null ? `${(Number(v)*100).toFixed(1)}%` : '-';

const TIER_COLORS = { standard:'#94a3b8', bronze:'#cd7f32', silver:'#9ca3af', gold:'#f59e0b' };

export default function Quotations({ token, user }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [tab, setTab] = useState('info');
  const [addModal, setAddModal] = useState(false);
  const [costModal, setCostModal] = useState(false);
  const [itemsModal, setItemsModal] = useState(false);
  const [costCalcs, setCostCalcs] = useState([]);
  const [priceMatrix, setPriceMatrix] = useState(null);
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin','mgr'].includes(user?.role);
  const canCalc = ['admin','mgr','fin'].includes(user?.role);
  const canApprove = ['admin','fin','mgr'].includes(user?.role);

  const [form, setForm] = useState({
    client_name:'', client_contact:'', warehouse_code:'', project_type:'dispatch',
    valid_until:'', headcount_estimate:'', avg_grade:'P1', notes:'',
  });
  const [costForm, setCostForm] = useState({
    avg_grade:'P1', headcount:1, target_margin:0.20,
    monthly_hours_estimate:'', equipment_cost:0, notes:'',
  });
  const [lineItems, setLineItems] = useState([{ biz_line:'9A', volume:'' }]);
  const [itemResult, setItemResult] = useState(null);

  const load = () => {
    setLoading(true);
    api('/api/v1/quotations', { token }).then(setQuotes).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (canCalc) {
      api('/api/v1/quotations/price-matrix', { token }).then(setPriceMatrix).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selQ = quotes.find(q => q.id === selId);

  const loadCostCalcs = (id) => {
    api(`/api/v1/quotations/${id}/cost-calculations`, { token }).then(setCostCalcs).catch(() => {});
  };

  const selectQuote = (id) => {
    setSelId(id); setTab('info'); setCostCalcs([]);
    loadCostCalcs(id);
  };

  const createQuote = async () => {
    if (!form.client_name) { showToast('请填写客户名称', 'err'); return; }
    try {
      const body = { ...form };
      if (body.headcount_estimate) body.headcount_estimate = parseInt(body.headcount_estimate);
      else delete body.headcount_estimate;
      if (!body.valid_until) delete body.valid_until;
      await api('/api/v1/quotations', { method:'POST', body, token });
      showToast('报价单已创建'); setAddModal(false); load();
      setForm({ client_name:'', client_contact:'', warehouse_code:'', project_type:'dispatch', valid_until:'', headcount_estimate:'', avg_grade:'P1', notes:'' });
    } catch(e) { showToast(e.message, 'err'); }
  };

  const runCostCalc = async () => {
    if (!selId) return;
    try {
      const body = { ...costForm, headcount: parseInt(costForm.headcount) };
      if (body.monthly_hours_estimate) body.monthly_hours_estimate = parseFloat(body.monthly_hours_estimate);
      else delete body.monthly_hours_estimate;
      await api(`/api/v1/quotations/${selId}/calculate-cost`, { method:'POST', body, token });
      showToast('成本测算完成'); setCostModal(false); load(); loadCostCalcs(selId);
    } catch(e) { showToast(e.message, 'err'); }
  };

  const buildItems = async () => {
    if (!selId) return;
    const valid = lineItems.filter(i => i.biz_line && i.volume !== '');
    if (valid.length === 0) { showToast('请至少填写一项作业量', 'err'); return; }
    try {
      const items = valid.map(i => ({ biz_line: i.biz_line, volume: parseFloat(i.volume) }));
      const r = await api(`/api/v1/quotations/${selId}/build-items`, { method:'POST', body: items, token });
      setItemResult(r); load();
      showToast('报价明细已生成');
    } catch(e) { showToast(e.message, 'err'); }
  };

  const downloadQuoteXlsx = async (id, quoteNo) => {
    try {
      const res = await fetch(`/api/v1/quotations/${id}/export-xlsx`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Angebot_${quoteNo}.xlsx`;
      a.click();
    } catch (e) { showToast(e.message, 'err'); }
  };

  const approveQuote = async (id) => {
    try {
      await api(`/api/v1/quotations/${id}/approve`, { method:'PUT', body:{}, token });
      showToast('报价已审批通过'); load();
    } catch(e) { showToast(e.message, 'err'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api(`/api/v1/quotations/${id}`, { method:'PUT', body:{ status }, token });
      showToast('状态已更新'); load();
    } catch(e) { showToast(e.message, 'err'); }
  };

  const statsBar = [
    { label:'报价单总数', value: quotes.length },
    { label:'草稿', value: quotes.filter(q=>q.status==='draft').length },
    { label:'谈判中', value: quotes.filter(q=>q.status==='negotiating').length },
    { label:'已接受', value: quotes.filter(q=>q.status==='accepted').length },
    { label:'月度估值', value: fmtE(quotes.filter(q=>q.status==='accepted').reduce((s,q)=>s+(q.total_monthly_estimate||0),0)) },
  ];

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {statsBar.map(s => (
          <div key={s.label} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:'var(--R2)', padding:'10px 18px', minWidth:100 }}>
            <div style={{ fontSize:9, color:'var(--tx3)', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{s.value}</div>
          </div>
        ))}
        {canEdit && (
          <button className="b bga" style={{ marginLeft:'auto', alignSelf:'center' }} onClick={() => setAddModal(true)}>
            + 新建报价单
          </button>
        )}
      </div>

      <div style={{ display:'flex', gap:12, height:'calc(100vh - 220px)', overflow:'hidden' }}>
        <div style={{ width:280, flexShrink:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
          {loading ? <Loading /> : quotes.map(q => (
            <div key={q.id} onClick={() => selectQuote(q.id)}
              style={{
                padding:'10px 12px', borderRadius:'var(--R2)', cursor:'pointer',
                border:`1px solid ${selId===q.id ? 'var(--ac)' : 'var(--bd)'}`,
                background: selId===q.id ? 'var(--ac)12' : 'var(--bg2)',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:11, color:'var(--ac)' }}>{q.quote_no}</span>
                <span style={{
                  fontSize:9, padding:'2px 6px', borderRadius:4,
                  background: (STATUS_COLORS[q.status] || '#94a3b8') + '25',
                  color: STATUS_COLORS[q.status] || '#94a3b8',
                }}>{STATUS_LABELS[q.status] || q.status}</span>
              </div>
              <div style={{ fontWeight:600, fontSize:12, marginBottom:2 }}>{q.client_name}</div>
              <div style={{ fontSize:10, color:'var(--tx3)' }}>
                {PROJECT_LABELS[q.project_type] || q.project_type || '-'} · {q.warehouse_code || '-'}
              </div>
              {q.cost_total_per_hour && (
                <div style={{ fontSize:10, color:'var(--tx2)', marginTop:4 }}>
                  成本 {fmtE(q.cost_total_per_hour)}/h → 报价 {fmtE(q.quote_hourly_rate)}/h
                </div>
              )}
            </div>
          ))}
          {!loading && quotes.length === 0 && (
            <div style={{ textAlign:'center', padding:20, color:'var(--tx3)', fontSize:11 }}>暂无报价单</div>
          )}
        </div>

        {selQ ? (
          <div style={{ flex:1, overflowY:'auto' }}>
            <div className="cd" style={{ marginBottom:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div>
                  <span style={{ fontWeight:700, fontSize:18, color:'var(--ac)' }}>{selQ.quote_no}</span>
                  <span style={{
                    marginLeft:10, fontSize:10, padding:'3px 8px', borderRadius:4,
                    background:(STATUS_COLORS[selQ.status]||'#94a3b8')+'25', color:STATUS_COLORS[selQ.status]||'#94a3b8',
                  }}>{STATUS_LABELS[selQ.status]||selQ.status}</span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {canCalc && (
                    <button className="b bgh" onClick={() => downloadQuoteXlsx(selQ.id, selQ.quote_no)}>↓ Excel</button>
                  )}
                  {canCalc && selQ.status !== 'accepted' && (
                    <button className="b bgs" onClick={() => setCostModal(true)}>成本测算</button>
                  )}
                  {canCalc && selQ.status !== 'accepted' && (
                    <button className="b bgs" onClick={() => { setItemResult(null); setItemsModal(true); }}>报价明细</button>
                  )}
                  {canApprove && selQ.status === 'sent' && (
                    <button className="b bga" onClick={() => approveQuote(selQ.id)}>审批通过</button>
                  )}
                  {canEdit && selQ.status === 'draft' && (
                    <button className="b bgs" onClick={() => updateStatus(selQ.id, 'sent')}>→ 发送</button>
                  )}
                  {canEdit && selQ.status === 'sent' && (
                    <button className="b bgs" onClick={() => updateStatus(selQ.id, 'negotiating')}>→ 谈判</button>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', gap:2, marginBottom:14, borderBottom:'1px solid var(--bd)' }}>
                {['info','cost','items', ...(canEdit ? ['matrix'] : [])].map(t_ => (
                  <button key={t_} onClick={() => setTab(t_)}
                    style={{
                      padding:'6px 16px', fontSize:12, border:'none', cursor:'pointer', borderRadius:'4px 4px 0 0',
                      background: tab===t_ ? 'var(--ac)' : 'transparent',
                      color: tab===t_ ? '#fff' : 'var(--tx2)',
                    }}>
                    {t_==='info' ? '基本信息' : t_==='cost' ? '成本测算' : t_==='items' ? '报价明细' : '价格矩阵'}
                  </button>
                ))}
              </div>

              {tab === 'info' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    ['客户名称', selQ.client_name], ['联系人', selQ.client_contact||'-'],
                    ['仓库', selQ.warehouse_code||'-'], ['业务线', selQ.biz_line||'-'],
                    ['项目类型', PROJECT_LABELS[selQ.project_type]||selQ.project_type||'-'],
                    ['有效期至', selQ.valid_until||'-'],
                    ['预估人数', selQ.headcount_estimate||'-'],
                    ['平均职级', selQ.avg_grade||'-'],
                    ['综合时薪成本', fmtE(selQ.cost_total_per_hour)],
                    ['建议报价单价', fmtE(selQ.quote_hourly_rate)],
                    ['目标毛利率', fmtPct(selQ.quote_margin)],
                    ['月度估值(含税)', fmtE(selQ.total_monthly_estimate)],
                    ['折扣档位', selQ.volume_tier||'-'],
                    ['折扣比例', fmtPct(selQ.volume_discount)],
                    ['审批人', selQ.approved_by||'-'],
                    ['创建人', selQ.created_by||'-'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize:10, color:'var(--tx3)' }}>{label}</div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{val}</div>
                    </div>
                  ))}
                  {selQ.notes && (
                    <div style={{ gridColumn:'1/-1' }}>
                      <div style={{ fontSize:10, color:'var(--tx3)' }}>备注</div>
                      <div style={{ fontSize:12, color:'var(--tx2)' }}>{selQ.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'cost' && (
                <div>
                  {costCalcs.length === 0 ? (
                    <div style={{ textAlign:'center', padding:30, color:'var(--tx3)', fontSize:12 }}>
                      暂无成本测算记录
                      {canCalc && <div><button className="b bga" style={{ marginTop:10 }} onClick={() => setCostModal(true)}>立即测算</button></div>}
                    </div>
                  ) : (
                    <div className="tw"><table>
                      <thead><tr>
                        <th>测算编号</th><th>职级</th><th>人数</th><th>总时成本</th>
                        <th>建议报价</th><th>毛利率</th><th>月度收入估值</th><th>月度利润估值</th><th>时间</th>
                      </tr></thead>
                      <tbody>
                        {costCalcs.map(c => (
                          <tr key={c.id}>
                            <td><code style={{fontSize:10}}>{c.calc_no}</code></td>
                            <td>{c.avg_grade}</td>
                            <td>{c.headcount}</td>
                            <td>{fmtE(c.total_cost_per_hour)}/h</td>
                            <td style={{ color:'var(--ac)', fontWeight:600 }}>{fmtE(c.suggested_rate)}/h</td>
                            <td>{fmtPct(c.target_margin)}</td>
                            <td>{fmtE(c.monthly_revenue_estimate)}</td>
                            <td style={{ color: c.monthly_profit_estimate > 0 ? '#10b981' : '#f0526c' }}>
                              {fmtE(c.monthly_profit_estimate)}
                            </td>
                            <td style={{ fontSize:10, color:'var(--tx3)' }}>
                              {c.created_at?.slice(0,10)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  )}

                  <div style={{ marginTop:20 }}>
                    <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>
                      参考: P1-P9 成本速查 (20%毛利率建议报价)
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:6, fontSize:10 }}>
                      {[
                        {g:'P1',total:20.02,rate:25.02},
                        {g:'P2',total:21.02,rate:26.27},
                        {g:'P3',total:22.02,rate:27.52},
                        {g:'P4',total:24.02,rate:30.02},
                        {g:'P5',total:26.02,rate:32.52},
                        {g:'P6',total:28.02,rate:35.03},
                        {g:'P7',total:30.02,rate:37.53},
                        {g:'P8',total:32.03,rate:40.03},
                        {g:'P9',total:36.03,rate:45.04},
                      ].map(r => (
                        <div key={r.g} style={{ background:'var(--bg3)', borderRadius:'var(--R1)', padding:'8px 6px', textAlign:'center' }}>
                          <div style={{ fontWeight:700, fontSize:13, color:'var(--ac)' }}>{r.g}</div>
                          <div style={{ color:'var(--tx3)', fontSize:9, marginTop:2 }}>成本</div>
                          <div style={{ fontWeight:600 }}>{fmtE(r.total)}</div>
                          <div style={{ color:'var(--tx3)', fontSize:9, marginTop:2 }}>报价</div>
                          <div style={{ fontWeight:600, color:'#10b981' }}>{fmtE(r.rate)}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:9, color:'var(--tx3)', marginTop:6 }}>
                      综合成本 = 时薪 × (1 + 21%社保 + 10%年假 + 5%病假 + 8%管理费)
                    </div>
                  </div>
                </div>
              )}

              {tab === 'items' && (
                <div>
                  {selQ.items_json ? (() => {
                    let items = [];
                    try { items = JSON.parse(selQ.items_json); } catch {}
                    return (
                      <div>
                        <div className="tw"><table>
                          <thead><tr>
                            <th>业务线</th><th>作业量</th><th>单位</th>
                            <th>基础价</th><th>折扣档</th><th>折扣</th>
                            <th>净单价</th><th>金额(Netto)</th>
                          </tr></thead>
                          <tbody>
                            {items.map((it, i) => (
                              <tr key={i}>
                                <td><strong>{it.biz_line}</strong> <span style={{color:'var(--tx3)',fontSize:10}}>{it.label}</span></td>
                                <td>{Number(it.volume).toLocaleString()}</td>
                                <td>{it.unit}</td>
                                <td>{fmtE(it.base_price)}</td>
                                <td>
                                  <span style={{
                                    background: (TIER_COLORS[it.tier]||'#94a3b8')+'25',
                                    color: TIER_COLORS[it.tier]||'#94a3b8',
                                    padding:'2px 6px', borderRadius:4, fontSize:10,
                                  }}>{it.tier}</span>
                                </td>
                                <td style={{ color: it.discount > 0 ? '#10b981' : 'inherit' }}>
                                  {it.discount > 0 ? `-${(it.discount*100).toFixed(0)}%` : '-'}
                                </td>
                                <td>{fmtE(it.net_price)}</td>
                                <td style={{ fontWeight:600 }}>{fmtE(it.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table></div>
                        {selQ.total_monthly_estimate && (
                          <div style={{ marginTop:12, textAlign:'right', fontSize:12 }}>
                            <div>Netto: {fmtE(selQ.total_monthly_estimate / 1.19)}</div>
                            <div>MwSt. (19%): {fmtE(selQ.total_monthly_estimate - selQ.total_monthly_estimate / 1.19)}</div>
                            <div style={{ fontWeight:700, fontSize:15, color:'var(--ac)' }}>
                              Brutto: {fmtE(selQ.total_monthly_estimate)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div style={{ textAlign:'center', padding:30, color:'var(--tx3)', fontSize:12 }}>
                      暂无报价明细
                      {canCalc && <div><button className="b bga" style={{ marginTop:10 }} onClick={() => { setItemResult(null); setItemsModal(true); }}>生成明细</button></div>}
                    </div>
                  )}
                </div>
              )}
              {tab === 'matrix' && priceMatrix && (
                <div>
                  <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:12 }}>
                    v7.0 阶梯价格矩阵 — 标准/Bronze(-3%)/Silver(-5%)/Gold(-8%)，独立评定，互不叠加
                  </div>
                  {Object.entries(priceMatrix).map(([code, biz]) => (
                    <div key={code} style={{ marginBottom:16, background:'var(--bg3)', borderRadius:'var(--R2)', padding:12 }}>
                      <div style={{ fontWeight:700, marginBottom:8, fontSize:13 }}>
                        {code} — {biz.label} <span style={{ fontSize:10, color:'var(--tx3)', marginLeft:4 }}>基价 €{biz.base_price}/{biz.unit}</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                        {Object.entries(biz.tiers).map(([tier, info]) => {
                          const colors = { standard:'#94a3b8', bronze:'#cd7f32', silver:'#9ca3af', gold:'#f59e0b' };
                          const c = colors[tier] || '#94a3b8';
                          return (
                            <div key={tier} style={{ background: c + '15', border:`1px solid ${c}44`, borderRadius:6, padding:'8px 10px' }}>
                              <div style={{ fontWeight:700, fontSize:11, color: c }}>{tier.toUpperCase()}</div>
                              <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>
                                {info.min_volume.toLocaleString()} – {info.max_volume ? info.max_volume.toLocaleString() : '∞'}
                              </div>
                              <div style={{ fontSize:12, fontWeight:600, marginTop:4, color: info.discount > 0 ? 'var(--gn)' : 'var(--tx2)' }}>
                                {info.discount > 0 ? `-${(info.discount*100).toFixed(0)}%` : '—'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'matrix' && !priceMatrix && (
                <div style={{ textAlign:'center', padding:20, color:'var(--tx3)' }}>价格矩阵加载中…</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tx3)', fontSize:13 }}>
            ← 选择左侧报价单查看详情
          </div>
        )}
      </div>

      {addModal && (
        <Modal title="新建报价单" onClose={() => setAddModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['client_name','客户名称','text',true],
              ['client_contact','联系人','text',false],
              ['warehouse_code','仓库代码','text',false],
            ].map(([k,label,type,req]) => (
              <div key={k}>
                <label style={{ fontSize:11, color:'var(--tx3)' }}>{label}{req&&' *'}</label>
                <input className="inp" type={type} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>项目类型</label>
              <select className="inp" value={form.project_type} onChange={e => setForm({...form,project_type:e.target.value})}>
                {PROJECT_TYPES.map(pt => <option key={pt} value={pt}>{PROJECT_LABELS[pt]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>平均职级</label>
              <select className="inp" value={form.avg_grade} onChange={e => setForm({...form,avg_grade:e.target.value})}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>预估人数</label>
              <input className="inp" type="number" min="1" value={form.headcount_estimate} onChange={e => setForm({...form,headcount_estimate:e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>有效期至</label>
              <input className="inp" type="date" value={form.valid_until} onChange={e => setForm({...form,valid_until:e.target.value})} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>备注</label>
              <textarea className="inp" rows={2} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:14 }}>
            <button className="b bgs" onClick={() => setAddModal(false)}>取消</button>
            <button className="b bga" onClick={createQuote}>创建</button>
          </div>
        </Modal>
      )}

      {costModal && selQ && (
        <Modal title={`成本测算 — ${selQ.quote_no}`} onClose={() => setCostModal(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>平均职级</label>
              <select className="inp" value={costForm.avg_grade} onChange={e => setCostForm({...costForm,avg_grade:e.target.value})}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>预估人数</label>
              <input className="inp" type="number" min="1" value={costForm.headcount} onChange={e => setCostForm({...costForm,headcount:e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>目标毛利率</label>
              <input className="inp" type="number" step="0.01" min="0.05" max="0.5" value={costForm.target_margin} onChange={e => setCostForm({...costForm,target_margin:parseFloat(e.target.value)})} />
              <div style={{ fontSize:9, color:'var(--tx3)' }}>如 0.20 = 20%</div>
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>月工时/人</label>
              <input className="inp" type="number" min="0" value={costForm.monthly_hours_estimate} onChange={e => setCostForm({...costForm,monthly_hours_estimate:e.target.value})} />
              <div style={{ fontSize:9, color:'var(--tx3)' }}>标准约173h/月</div>
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--tx3)' }}>设备工具成本(€/h)</label>
              <input className="inp" type="number" min="0" step="0.01" value={costForm.equipment_cost} onChange={e => setCostForm({...costForm,equipment_cost:parseFloat(e.target.value)})} />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:14 }}>
            <button className="b bgs" onClick={() => setCostModal(false)}>取消</button>
            <button className="b bga" onClick={runCostCalc}>运行测算</button>
          </div>
        </Modal>
      )}

      {itemsModal && selQ && (
        <Modal title={`报价明细 — ${selQ.quote_no}`} onClose={() => { setItemsModal(false); setItemResult(null); }}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>填写各业务线月度作业量</div>
            {lineItems.map((item, idx) => (
              <div key={idx} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
                <select className="inp" style={{ width:120 }} value={item.biz_line} onChange={e => {
                  const l = [...lineItems]; l[idx] = {...l[idx], biz_line: e.target.value}; setLineItems(l);
                }}>
                  {BIZ_LINES.map(b => <option key={b} value={b}>{b} {BIZ_LABELS[b]}</option>)}
                </select>
                <input className="inp" type="number" placeholder="月作业量" style={{ flex:1 }} value={item.volume}
                  onChange={e => { const l=[...lineItems]; l[idx]={...l[idx],volume:e.target.value}; setLineItems(l); }} />
                {lineItems.length > 1 && (
                  <button className="b" style={{ padding:'4px 8px', fontSize:11 }}
                    onClick={() => setLineItems(lineItems.filter((_,i)=>i!==idx))}>✕</button>
                )}
              </div>
            ))}
            <button className="b bgs" style={{ fontSize:11, marginTop:4 }}
              onClick={() => setLineItems([...lineItems, { biz_line:'9A', volume:'' }])}>
              + 添加业务线
            </button>
          </div>

          {itemResult && (
            <div style={{ background:'var(--bg3)', padding:12, borderRadius:'var(--R2)', marginBottom:12 }}>
              <div style={{ fontWeight:600, marginBottom:8 }}>计算结果</div>
              {itemResult.items.map((it,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                  <span>{it.biz_line} {it.label} × {Number(it.volume).toLocaleString()}{it.unit}</span>
                  <span>
                    <span style={{ color: TIER_COLORS[it.tier], fontSize:10, marginRight:6 }}>[{it.tier}]</span>
                    {it.discount > 0 && <span style={{ color:'#10b981', fontSize:10, marginRight:6 }}>-{(it.discount*100).toFixed(0)}%</span>}
                    <strong>{fmtE(it.amount)}</strong>
                  </span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid var(--bd)', paddingTop:8, marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span>Netto</span><strong>{fmtE(itemResult.subtotal_netto)}</strong>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span>MwSt. 19%</span><span>{fmtE(itemResult.mwst_19pct)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:'var(--ac)', marginTop:4 }}>
                  <span>Brutto</span><span>{fmtE(itemResult.total_brutto)}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button className="b bgs" onClick={() => { setItemsModal(false); setItemResult(null); }}>关闭</button>
            <button className="b bga" onClick={buildItems}>生成报价</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
