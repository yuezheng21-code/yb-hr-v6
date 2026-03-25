import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge, fmtE } from '../components/StatusBadge.jsx';

const GRADES = ['P1','P2','P3','P4','P5','P6','P7','P8','P9'];

const STATUS_ORDER = ['submitted','verified','onboarded','day14_confirmed','month1','month3','month6','month12','completed','cancelled'];

const TIER_COLORS = {
  submitted: '#6a7498', verified: '#4f6ef7', onboarded: '#f5a623',
  day14_confirmed: '#f97316', month1: '#2dd4a0', month3: '#2dd4a0',
  month6: '#2dd4a0', month12: '#2dd4a0', completed: '#10b981', cancelled: '#f0526c',
};

function RefBadge({ status }) {
  const color = TIER_COLORS[status] || '#6a7498';
  const labels = {
    submitted:'已提交', verified:'已审核', onboarded:'已入职', day14_confirmed:'14天确认',
    month1:'满1月', month3:'满3月', month6:'满6月', month12:'满12月',
    completed:'已完成', cancelled:'已取消',
  };
  return (
    <span style={{ background: color + '1a', color, border: `1px solid ${color}33`,
      padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600 }}>
      {labels[status] || status}
    </span>
  );
}

export default function Referrals({ token, user }) {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [actionModal, setActionModal] = useState(null); // {type, record}
  const [statusFilter, setStatusFilter] = useState('');
  const [onboardDate, setOnboardDate] = useState(new Date().toISOString().slice(0,10));
  const [milestoneTarget, setMilestoneTarget] = useState('month1');
  const showToast = useToast();

  const isHR = ['admin','hr'].includes(user?.role);
  const isFin = ['admin','fin'].includes(user?.role);
  const isWorker = !isHR && !isFin;

  const [form, setForm] = useState({
    referee_name: '', referee_phone: '', referee_target_grade: 'P1',
    is_scarce_position: false, is_off_season: false, is_cross_region: false, notes: '',
  });

  const load = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    Promise.all([
      api(`/api/v1/referrals${params}`, { token }),
      api('/api/v1/referrals/my-stats', { token }),
    ]).then(([rows, s]) => { setReferrals(rows); setStats(s); })
      .catch(e => showToast(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  const submitReferral = async () => {
    if (!form.referee_name.trim()) { showToast('请填写被推荐人姓名', 'err'); return; }
    try {
      await api('/api/v1/referrals', { method: 'POST', body: form, token });
      setAddModal(false);
      setForm({ referee_name:'', referee_phone:'', referee_target_grade:'P1',
        is_scarce_position:false, is_off_season:false, is_cross_region:false, notes:'' });
      load(); showToast('推荐已提交');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const doVerify = async (id) => {
    try {
      await api(`/api/v1/referrals/${id}/verify`, { method: 'PUT', token });
      load(); showToast('已审核');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const doConfirmOnboard = async (id) => {
    try {
      await api(`/api/v1/referrals/${id}/confirm-onboard`, {
        method: 'PUT', body: { onboard_date: onboardDate }, token,
      });
      setActionModal(null); load(); showToast('入职已确认');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const doDay14 = async (id) => {
    try {
      await api(`/api/v1/referrals/${id}/confirm-day14`, { method: 'PUT', token });
      load(); showToast('14天确认完成，入职奖励已解锁');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const doMilestone = async (id) => {
    try {
      await api(`/api/v1/referrals/${id}/confirm-milestone`, {
        method: 'PUT', body: { milestone: milestoneTarget }, token,
      });
      setActionModal(null); load(); showToast(`${milestoneTarget} 里程碑已确认`);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const MILESTONES = ['month1','month3','month6','month12'];
  const MILESTONE_LABELS = { month1:'满1个月', month3:'满3个月', month6:'满6个月', month12:'满12个月' };

  return (
    <div>
      {/* Stats bar */}
      {stats && (
        <div className="sr" style={{ marginBottom: 12 }}>
          {[
            [stats.total, '累计推荐', 'var(--cy)'],
            [stats.active, '进行中', 'var(--og)'],
            [stats.completed, '已完成', 'var(--gn)'],
            [`€${fmtE(stats.total_paid)}`, '已发奖励', 'var(--ac)'],
            [`€${fmtE(stats.total_pending)}`, '待发奖励', 'var(--pp)'],
            [`×${stats.rank_multiplier}`, '当前倍率', 'var(--rd)'],
          ].map(([val, label, color], i) => (
            <div key={i} className="sc">
              <div className="sl">{label}</div>
              <div className="sv" style={{ color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="ab">
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <select className="fsl" style={{ width:140 }} value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="ml">
          <button className="b bga" onClick={() => setAddModal(true)}>+ 提交推荐</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        referrals.length === 0
          ? <div style={{ textAlign:'center', padding:40, color:'var(--tx3)' }}>暂无推荐记录</div>
          : (
            <div className="tw"><div className="ts"><table>
              <thead><tr>
                <th>推荐编号</th><th>推荐人</th><th>职级</th>
                <th>被推荐人</th><th>目标职级</th><th>奖励层级</th>
                <th>入职奖(€)</th><th>总待发(€)</th><th>总已发(€)</th>
                <th>提交日期</th><th>状态</th><th>操作</th>
              </tr></thead>
              <tbody>{referrals.map(r => (
                <tr key={r.id}>
                  <td className="mn tm">{r.referral_no}</td>
                  <td className="fw6">{r.referrer_name}</td>
                  <td>{r.referrer_grade}</td>
                  <td>{r.referee_name}</td>
                  <td>{r.referee_target_grade}</td>
                  <td>{r.reward_tier}</td>
                  <td>{fmtE(r.reward_onboard)}{r.is_scarce_position ? ' ★' : ''}</td>
                  <td style={{ color:'var(--og)' }}>{fmtE(r.reward_total_pending)}</td>
                  <td style={{ color:'var(--gn)' }}>{fmtE(r.reward_total_paid)}</td>
                  <td style={{ fontSize:11 }}>{r.submitted_at?.slice(0,10)}</td>
                  <td><RefBadge status={r.status} /></td>
                  <td style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                    {isHR && r.status === 'submitted' && (
                      <button className="b bga xs" onClick={() => doVerify(r.id)}>审核</button>
                    )}
                    {isHR && r.status === 'verified' && (
                      <button className="b bga xs" onClick={() => setActionModal({ type:'onboard', record:r })}>确认入职</button>
                    )}
                    {isHR && r.status === 'onboarded' && (
                      <button className="b bga xs" onClick={() => doDay14(r.id)}>14天确认</button>
                    )}
                    {(isHR || isFin) && ['day14_confirmed','month1','month3','month6'].includes(r.status) && (
                      <button className="b bga xs" onClick={() => {
                        const next = { day14_confirmed:'month1', month1:'month3', month3:'month6', month6:'month12' }[r.status];
                        setMilestoneTarget(next);
                        setActionModal({ type:'milestone', record:r });
                      }}>确认里程碑</button>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table></div></div>
          )
      )}

      {/* Submit referral modal */}
      {addModal && (
        <Modal title="提交员工推荐" onClose={() => setAddModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setAddModal(false)}>取消</button>
            <button className="b bga" onClick={submitReferral}>提交推荐</button>
          </>}
        >
          <div className="alert alert-ac" style={{ fontSize:11 }}>
            推荐奖励按被推荐人入职留存里程碑分期发放。推荐人须在职且试用期满3个月（P1-P5）。
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">被推荐人姓名 *</label>
              <input className="fi" value={form.referee_name}
                onChange={e => setForm({...form, referee_name:e.target.value})} placeholder="全名" /></div>
            <div className="fg"><label className="fl">联系电话</label>
              <input className="fi" value={form.referee_phone}
                onChange={e => setForm({...form, referee_phone:e.target.value})} placeholder="+49..." /></div>
            <div className="fg"><label className="fl">目标职级 *</label>
              <select className="fsl" value={form.referee_target_grade}
                onChange={e => setForm({...form, referee_target_grade:e.target.value})}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select></div>
            <div className="fg"><label className="fl">特殊标志</label>
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                {[
                  ['is_scarce_position','紧缺岗位 (×1.5)'],
                  ['is_off_season','淡季推荐 (+€50)'],
                  ['is_cross_region','跨区推荐 (+€80)'],
                ].map(([k, label]) => (
                  <label key={k} style={{ display:'flex', gap:4, alignItems:'center', fontSize:12 }}>
                    <input type="checkbox" checked={form[k]}
                      onChange={e => setForm({...form, [k]:e.target.checked})} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="fg ful"><label className="fl">备注</label>
              <textarea className="fta" rows={2} value={form.notes}
                onChange={e => setForm({...form, notes:e.target.value})} /></div>
          </div>
        </Modal>
      )}

      {/* Confirm onboard modal */}
      {actionModal?.type === 'onboard' && (
        <Modal title={`确认入职 — ${actionModal.record.referee_name}`}
          onClose={() => setActionModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setActionModal(null)}>取消</button>
            <button className="b bga" onClick={() => doConfirmOnboard(actionModal.record.id)}>确认入职</button>
          </>}
        >
          <div className="fg"><label className="fl">入职日期</label>
            <input className="fi" type="date" value={onboardDate}
              onChange={e => setOnboardDate(e.target.value)} /></div>
        </Modal>
      )}

      {/* Confirm milestone modal */}
      {actionModal?.type === 'milestone' && (
        <Modal title={`确认里程碑 — ${actionModal.record.referee_name}`}
          onClose={() => setActionModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setActionModal(null)}>取消</button>
            <button className="b bga" onClick={() => doMilestone(actionModal.record.id)}>确认发放</button>
          </>}
        >
          <div className="fg"><label className="fl">里程碑</label>
            <select className="fsl" value={milestoneTarget}
              onChange={e => setMilestoneTarget(e.target.value)}>
              {MILESTONES.map(m => <option key={m} value={m}>{MILESTONE_LABELS[m]}</option>)}
            </select></div>
          <div style={{ marginTop:8, fontSize:12, color:'var(--tx3)' }}>
            入职日期：{actionModal.record.onboard_date || '—'}
          </div>
        </Modal>
      )}
    </div>
  );
}

