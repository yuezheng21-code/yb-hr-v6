import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { fmtE } from '../components/StatusBadge.jsx';

const TIERS = ['bronze','silver','gold','platinum'];
const TIER_COLORS = { bronze:'#cd7f32', silver:'#a0a0b0', gold:'#f5a623', platinum:'#6b7de8' };
const TIER_LABELS = { bronze:'Bronze (3%)', silver:'Silver (4%)', gold:'Gold (5%)', platinum:'Platinum (6%)' };
const STATUS_COLORS = { pending:'#f5a623', active:'#2dd4a0', expired:'#6a7498', terminated:'#f0526c' };
const STATUS_LABELS = { pending:'待生效', active:'生效中', expired:'已到期', terminated:'已终止' };

function TierBadge({ tier }) {
  const color = TIER_COLORS[tier] || '#6a7498';
  return (
    <span style={{ background: color + '1a', color, border: `1px solid ${color}44`,
      padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700 }}>
      {tier?.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6a7498';
  return (
    <span style={{ background: color + '1a', color, border: `1px solid ${color}33`,
      padding:'2px 8px', borderRadius:4, fontSize:11 }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function Commissions({ token, user }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [calcPeriod, setCalcPeriod] = useState(new Date().toISOString().slice(0,7));
  const [invoiceInputs, setInvoiceInputs] = useState({});
  const showToast = useToast();

  const canAdmin = user?.role === 'admin';
  const canView = ['admin','fin'].includes(user?.role);

  const [form, setForm] = useState({
    referrer_name:'', referrer_type:'individual', referrer_contact:'',
    referrer_iban:'', referrer_tax_id:'', client_name:'', client_warehouse:'',
    contract_no:'', contract_start:'', tier:'bronze', notes:'',
  });

  const load = () => {
    setLoading(true);
    api('/api/v1/commissions', { token })
      .then(setCommissions)
      .catch(e => showToast(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const loadMonthly = (id) => {
    api(`/api/v1/commissions/${id}/monthly`, { token })
      .then(setMonthlyData)
      .catch(e => showToast(e.message, 'err'));
  };

  const openDetail = (id) => {
    setDetailId(id);
    loadMonthly(id);
  };

  const createCommission = async () => {
    if (!form.referrer_name.trim() || !form.client_name.trim()) {
      showToast('请填写推荐人和客户名称', 'err'); return;
    }
    try {
      await api('/api/v1/commissions', { method:'POST', body: form, token });
      setCreateModal(false);
      setForm({ referrer_name:'', referrer_type:'individual', referrer_contact:'',
        referrer_iban:'', referrer_tax_id:'', client_name:'', client_warehouse:'',
        contract_no:'', contract_start:'', tier:'bronze', notes:'' });
      load(); showToast('返佣协议已创建');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const activateCommission = async (id, validityStart) => {
    try {
      await api(`/api/v1/commissions/${id}`, {
        method:'PUT', body:{ status:'active', validity_start: validityStart }, token,
      });
      load(); showToast('已生效');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const calculatePeriod = async () => {
    const body = {};
    commissions.filter(c => ['active','pending'].includes(c.status)).forEach(c => {
      const amt = invoiceInputs[c.id];
      const parsed = parseFloat(amt);
      if (amt !== '' && amt != null && !isNaN(parsed)) body[String(c.id)] = parsed;
    });
    if (Object.keys(body).length === 0) { showToast('请先填写发票金额', 'err'); return; }
    try {
      const r = await api(`/api/v1/commissions/calculate/${calcPeriod}`, {
        method:'POST', body, token,
      });
      showToast(`已计算 ${r.results?.length} 条`);
      setInvoiceInputs({});
      load();
      if (detailId) loadMonthly(detailId);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const markPaid = async (monthlyId) => {
    try {
      await api(`/api/v1/commissions/monthly/${monthlyId}/pay`, { method:'PUT', token });
      if (detailId) loadMonthly(detailId);
      load(); showToast('已标记付款');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const detailRecord = commissions.find(c => c.id === detailId);

  return (
    <div>
      {/* Calculate bar */}
      <div className="cd" style={{ marginBottom:12 }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div className="fg" style={{ minWidth:120 }}>
            <label className="fl">计算月份</label>
            <input className="fi" type="month" value={calcPeriod}
              onChange={e => setCalcPeriod(e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'flex-end' }}>
            {commissions.filter(c => ['active','pending'].includes(c.status)).map(c => (
              <div key={c.id} className="fg" style={{ minWidth:160 }}>
                <label className="fl" style={{ fontSize:10 }}>{c.client_name} ({c.tier})</label>
                <input className="fi" type="number" placeholder="发票金额(€)"
                  value={invoiceInputs[c.id] || ''}
                  onChange={e => setInvoiceInputs({...invoiceInputs, [c.id]:e.target.value})} />
              </div>
            ))}
          </div>
          {canView && (
            <button className="b bga" onClick={calculatePeriod}>⚡ 计算返佣</button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="ab">
        <div />
        <div className="ml">
          {canAdmin && (
            <button className="b bga" onClick={() => setCreateModal(true)}>+ 新建返佣协议</button>
          )}
        </div>
      </div>

      {loading ? <Loading /> : (
        commissions.length === 0
          ? <div style={{ textAlign:'center', padding:40, color:'var(--tx3)' }}>暂无返佣协议</div>
          : (
            <div className="tw"><div className="ts"><table>
              <thead><tr>
                <th>协议编号</th><th>推荐人</th><th>类型</th><th>客户</th><th>仓库</th>
                <th>层级</th><th>返佣率</th><th>有效期(月)</th>
                <th>已付(€)</th><th>待付(€)</th><th>状态</th><th>操作</th>
              </tr></thead>
              <tbody>{commissions.map(r => (
                <tr key={r.id}>
                  <td className="mn tm">{r.commission_no}</td>
                  <td className="fw6">{r.referrer_name}</td>
                  <td style={{ fontSize:11 }}>{r.referrer_type === 'individual' ? '个人' : '机构'}</td>
                  <td>{r.client_name}</td>
                  <td>{r.client_warehouse || '—'}</td>
                  <td><TierBadge tier={r.tier} /></td>
                  <td className="mn fw6" style={{ color:'var(--gn)' }}>{r.commission_rate}%</td>
                  <td className="mn">{r.validity_months || '—'}</td>
                  <td style={{ color:'var(--gn)' }}>{fmtE(r.total_paid)}</td>
                  <td style={{ color:'var(--og)' }}>{fmtE(r.total_pending)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ display:'flex', gap:3 }}>
                    <button className="b bgh xs" onClick={() => openDetail(r.id)}>明细</button>
                    {canAdmin && r.status === 'pending' && (
                      <button className="b bga xs"
                        onClick={() => activateCommission(r.id, new Date().toISOString().slice(0,10))}>
                        生效
                      </button>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table></div></div>
          )
      )}

      {/* Create modal */}
      {createModal && (
        <Modal title="新建返佣协议" onClose={() => setCreateModal(false)} wide
          footer={<>
            <button className="b bgh" onClick={() => setCreateModal(false)}>取消</button>
            <button className="b bga" onClick={createCommission}>创建协议</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label className="fl">推荐人姓名 *</label>
              <input className="fi" value={form.referrer_name}
                onChange={e => setForm({...form, referrer_name:e.target.value})} /></div>
            <div className="fg"><label className="fl">推荐人类型</label>
              <select className="fsl" value={form.referrer_type}
                onChange={e => setForm({...form, referrer_type:e.target.value})}>
                <option value="individual">个人</option>
                <option value="institution">机构</option>
              </select></div>
            <div className="fg"><label className="fl">联系方式</label>
              <input className="fi" value={form.referrer_contact}
                onChange={e => setForm({...form, referrer_contact:e.target.value})} /></div>
            <div className="fg"><label className="fl">IBAN</label>
              <input className="fi" value={form.referrer_iban}
                onChange={e => setForm({...form, referrer_iban:e.target.value})} placeholder="DE..." /></div>
            <div className="fg"><label className="fl">税号</label>
              <input className="fi" value={form.referrer_tax_id}
                onChange={e => setForm({...form, referrer_tax_id:e.target.value})} /></div>
            <div className="fg"><label className="fl">客户名称 *</label>
              <input className="fi" value={form.client_name}
                onChange={e => setForm({...form, client_name:e.target.value})} /></div>
            <div className="fg"><label className="fl">仓库代码</label>
              <input className="fi" value={form.client_warehouse}
                onChange={e => setForm({...form, client_warehouse:e.target.value})} /></div>
            <div className="fg"><label className="fl">合同编号</label>
              <input className="fi" value={form.contract_no}
                onChange={e => setForm({...form, contract_no:e.target.value})} /></div>
            <div className="fg"><label className="fl">合同开始日期</label>
              <input className="fi" type="date" value={form.contract_start}
                onChange={e => setForm({...form, contract_start:e.target.value})} /></div>
            <div className="fg"><label className="fl">返佣层级</label>
              <select className="fsl" value={form.tier}
                onChange={e => setForm({...form, tier:e.target.value})}>
                {TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
              </select></div>
            <div className="fg ful"><label className="fl">备注</label>
              <textarea className="fta" rows={2} value={form.notes}
                onChange={e => setForm({...form, notes:e.target.value})} /></div>
          </div>
          <div className="alert alert-ac" style={{ marginTop:8, fontSize:11 }}>
            层级说明：Bronze ≤€5k · Silver €5k-15k · Gold €15k-40k · Platinum ≥€40k（月均发票额）<br/>
            返佣率：Bronze 3% · Silver 4% · Gold 5% · Platinum 6%
          </div>
        </Modal>
      )}

      {/* Monthly detail modal */}
      {detailId && detailRecord && (
        <Modal title={`返佣明细 — ${detailRecord.client_name} (${detailRecord.commission_no})`}
          onClose={() => { setDetailId(null); setMonthlyData([]); }} wide
          footer={<button className="b bgh" onClick={() => { setDetailId(null); setMonthlyData([]); }}>关闭</button>}
        >
          <div className="sr" style={{ marginBottom:12 }}>
            {[
              ['层级', <TierBadge tier={detailRecord.tier} />, null],
              [`${detailRecord.commission_rate}%`, '当前返佣率', 'var(--gn)'],
              [`€${fmtE(detailRecord.total_paid)}`, '已付', 'var(--ac)'],
              [`€${fmtE(detailRecord.total_pending)}`, '待付', 'var(--og)'],
            ].map(([val, label, color], i) => (
              <div key={i} className="sc">
                <div className="sl">{label}</div>
                <div className="sv" style={color ? { color } : {}}>{val}</div>
              </div>
            ))}
          </div>
          {monthlyData.length === 0
            ? <div style={{ textAlign:'center', padding:20, color:'var(--tx3)' }}>暂无月度记录</div>
            : (
              <div className="tw"><table>
                <thead><tr>
                  <th>月份</th><th>发票额(€)</th><th>返佣率(%)</th>
                  <th>返佣额(€)</th><th>付款状态</th><th>付款日期</th><th>备注</th><th></th>
                </tr></thead>
                <tbody>{monthlyData.map(m => (
                  <tr key={m.id}>
                    <td className="fw6">{m.period}</td>
                    <td>{fmtE(m.client_invoice_amount)}</td>
                    <td>{m.commission_rate}%</td>
                    <td className="fw6" style={{ color:'var(--gn)' }}>{fmtE(m.commission_amount)}</td>
                    <td>
                      <span style={{
                        color: m.payment_status === 'paid' ? 'var(--gn)' : 'var(--og)',
                        fontWeight:600, fontSize:11,
                      }}>
                        {m.payment_status === 'paid' ? '已付' : m.payment_status === 'disputed' ? '有争议' : '待付'}
                      </span>
                    </td>
                    <td style={{ fontSize:11 }}>{m.payment_date || '—'}</td>
                    <td style={{ fontSize:10, color:'var(--tx3)' }}>{m.notes || ''}</td>
                    <td>
                      {m.payment_status === 'pending' && m.commission_amount > 0 && canView && (
                        <button className="b bgg xs" onClick={() => markPaid(m.id)}>标记付款</button>
                      )}
                    </td>
                  </tr>
                ))}</tbody>
              </table></div>
            )
          }
        </Modal>
      )}
    </div>
  );
}
